import { db } from "@/db";
import { staff } from "@/db/schema";
import { adminProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

const staffCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email must be valid"),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is too short")
    .max(32, "Phone number is too long")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  role: z
    .string()
    .trim()
    .min(2, "Role must be at least 2 characters")
    .max(50, "Role must be at most 50 characters")
    .default("Stylist"),
  active: z.boolean().default(true),
});

const staffUpdateSchema = staffCreateSchema
  .partial()
  .extend({
    id: z.number().int().positive("Invalid staff id"),
  })
  .refine((data) => Object.keys(data).length > 1, {
    message: "At least one field must be provided to update",
    path: ["name"],
  });

// Minimal staff router: list (admins), create (admins), update, delete (admins)
export const staffRouter = {
  list: adminProcedure.query(async () => {
    return db.select().from(staff).orderBy(asc(staff.name)).all();
  }),

  create: adminProcedure.input(staffCreateSchema).mutation(async ({ input }) => {
    const values = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role ?? "Stylist",
      active: input.active ?? true,
    };

    const [row] = await db.insert(staff).values(values).returning();
    return row;
  }),

  update: adminProcedure.input(staffUpdateSchema).mutation(async ({ input }) => {
    const { id, ...updates } = input;
    const data = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(data).length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "NO_UPDATES" });
    }

    const [row] = await db
      .update(staff)
      .set(data)
      .where(eq(staff.id, id))
      .returning();

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "STAFF_NOT_FOUND" });
    }

    return row;
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive("Invalid staff id") }))
    .mutation(async ({ input }) => {
      const result = await db
        .delete(staff)
        .where(eq(staff.id, input.id))
        .returning({ id: staff.id });

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "STAFF_NOT_FOUND" });
      }

      return { success: true } as const;
    }),
} satisfies TRPCRouterRecord;
