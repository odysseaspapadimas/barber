import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/lib/auth'

interface Context {
  request: Request
  env: Env
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

// Protected procedure that requires valid admin session
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: ctx.request.headers,
  })

  if (!session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'NOT_AUTHENTICATED',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  })
})
