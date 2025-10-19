import { db } from "@/db";
import { staff_schedules } from "@/db/schema";
import { adminProcedure, protectedProcedure } from "../init";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { staffSchedulesInsertSchema, staffSchedulesSelectSchema } from "@/lib/types";

export const schedulesRouter = {
  list: protectedProcedure
    .input(
      staffSchedulesSelectSchema.pick({ staffId: true }).optional()
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
      staffSchedulesInsertSchema
        .omit({ id: true, createdAt: true, updatedAt: true })
        .extend({
          weekdays: z
            .array(z.number().min(0).max(6))
            .min(1, "Select at least one day"),
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
    .input(staffSchedulesSelectSchema.pick({ id: true }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(staff_schedules)
        .where(eq(staff_schedules.id, input.id))
        .returning({ id: staff_schedules.id });
      if (!row) return { ok: false };
      return { ok: true };
    }),

  update: adminProcedure
    .input(
      staffSchedulesInsertSchema
        .omit({ createdAt: true, updatedAt: true })
        .extend({
          id: z.number().int().positive(),
          weekdays: z
            .array(z.number().min(0).max(6))
            .min(1, "Select at least one day"),
        })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      // Convert weekdays array to JSON string for storage
      const [row] = await db
        .update(staff_schedules)
        .set({
          ...updateData,
          weekdays: JSON.stringify(input.weekdays),
          updatedAt: new Date(),
        })
        .where(eq(staff_schedules.id, id))
        .returning();

      if (!row) throw new Error("Schedule not found");

      return {
        ...row,
        weekdays: JSON.parse(row.weekdays) as number[],
      };
    }),
};
