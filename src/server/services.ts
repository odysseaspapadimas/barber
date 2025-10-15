import { db } from "@/db";
import { services } from "@/db/schema";
import { adminProcedure, publicProcedure } from "@/integrations/trpc/init";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const serviceBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationMin: z.number().int().positive("Duration must be positive"),
  priceCents: z.number().int().min(0, "Price must be positive"),
  active: z.boolean().default(true),
});

export const servicesRouter = {
  list: publicProcedure.query(async () => {
    return db.query.services.findMany({
      orderBy: (services, { asc }) => asc(services.name),
    });
  }),
  add: adminProcedure.input(serviceBaseSchema).mutation(async ({ input }) => {
    const [row] = await db
      .insert(services)
      .values({ ...input, active: input.active ?? true })
      .returning();
    return row;
  }),
  update: adminProcedure
    .input(
      serviceBaseSchema.partial().extend({
        id: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const data = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
      );

      if (Object.keys(data).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields provided for update",
        });
      }

      const [row] = await db
        .update(services)
        .set(data)
        .where(eq(services.id, id))
        .returning();

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
      }

      return row;
    }),
  remove: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(services)
        .where(eq(services.id, input.id))
        .returning({ id: services.id });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
      }
      return { success: true } as const;
    }),
} satisfies TRPCRouterRecord;
