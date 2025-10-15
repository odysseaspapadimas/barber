import { db } from "@/db";
import { staff_schedules } from "@/db/schema";
import { adminProcedure, protectedProcedure } from "../init";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const schedulesRouter = {
  list: protectedProcedure
    .input(
      z
        .object({
          staffId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const rows = input?.staffId
        ? await db
            .select()
            .from(staff_schedules)
            .where(eq(staff_schedules.staffId, input.staffId))
            .all()
        : await db.select().from(staff_schedules).all();

      // Parse JSON weekdays for each row
      return rows.map((row) => ({
        ...row,
        weekdays: JSON.parse(row.weekdays) as number[],
      }));
    }),

  create: adminProcedure
    .input(
      z.object({
        staffId: z.number(),
        weekdays: z
          .array(z.number().min(0).max(6))
          .min(1, "Select at least one day"),
        startMin: z
          .number()
          .min(0)
          .max(24 * 60 - 1),
        endMin: z
          .number()
          .min(1)
          .max(24 * 60),
        slotIntervalMin: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      // Convert weekdays array to JSON string for storage
      const [row] = await db
        .insert(staff_schedules)
        .values({
          ...input,
          weekdays: JSON.stringify(input.weekdays),
        })
        .returning();

      return {
        ...row,
        weekdays: JSON.parse(row.weekdays) as number[],
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(staff_schedules)
        .where(eq(staff_schedules.id, input.id))
        .returning({ id: staff_schedules.id });
      if (!row) return { ok: false };
      return { ok: true };
    }),
};
