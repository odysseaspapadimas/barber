import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/auth/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";

interface Context {
  request: Request;
  env: Env;
  responseHeaders?: Headers;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires valid admin session
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const headers = ctx.request.headers;
  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "NOT_AUTHENTICATED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});

export const optionalProcedure = t.procedure.use(async ({ ctx, next }) => {
  const headers = ctx.request.headers;
  const session = await auth.api.getSession({
    headers,
  });

  const isAuthed = !!session;

  return next({
    ctx: {
      ...ctx,
      session,
      isAuthed,
    },
  });
});

// Admin-only protected procedure
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const sessUser = ctx.session?.user;

  // Check if isAdmin is present in session
  if (sessUser?.isAdmin === true) {
    return next({ ctx: { ...ctx, isAdmin: true } });
  }

  // Otherwise, look up the user in DB and check isAdmin flag
  if (sessUser?.id) {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, sessUser.id))
      .all();
    const u = rows[0];
    if (u?.isAdmin) {
      return next({ ctx: { ...ctx, isAdmin: true, user: u } });
    }
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "ADMIN_ONLY",
  });
});
