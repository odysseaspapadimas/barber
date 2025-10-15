import { db } from "@/db";
import { services } from "@/db/schema";
import { adminProcedure, publicProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { servicesInsertSchema, servicesSelectSchema } from "@/lib/types";

const serviceBaseSchema = servicesInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
    .input(servicesSelectSchema.pick({ id: true }))
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
