import { db } from "@/db";
import { bookings, services, staff, staff_schedules } from "@/db/schema";
import { publicProcedure, protectedProcedure } from "@/integrations/trpc/init";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, lt, gt } from "drizzle-orm";
import { z } from "zod";

const bookingCreateSchema = z.object({
  serviceId: z.number().int().positive(),
  staffId: z.number().int().positive().optional(),
  startTs: z.number().int().positive(), // ms since epoch
  customerName: z.string().min(1),
  customerContact: z.string().optional(),
});

export const bookingsRouter = {
  // Admin protected list for management (can pass date range or staffId/serviceId)
  list: protectedProcedure
    .input(
      z
        .object({
          fromTs: z.number().optional(),
          toTs: z.number().optional(),
          staffId: z.number().optional(),
          serviceId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      // Build explicit branches to satisfy drizzle types
      if (!input) return await db.select().from(bookings).all();

      const conditions: any[] = [];
      if (input.fromTs) conditions.push(gte(bookings.startTs, new Date(input.fromTs)));
      if (input.toTs) conditions.push(lte(bookings.startTs, new Date(input.toTs)));
      if (input.staffId) conditions.push(eq(bookings.staffId, input.staffId));
      if (input.serviceId) conditions.push(eq(bookings.serviceId, input.serviceId));

      if (conditions.length === 0) return await db.select().from(bookings).all();
      if (conditions.length === 1) return await db.select().from(bookings).where(conditions[0]).all();
      return await db.select().from(bookings).where(and(...conditions)).all();
    }),

  get: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const rows = await db.select().from(bookings).where(eq(bookings.id, input.id)).all();
      const b = rows[0];
      if (!b) throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      return b;
    }),

  // available slots for a date: minimal implementation that returns candidate slots per staff
  available: publicProcedure
    .input(
      z.object({
        dateTs: z.number().int().positive(), // any timestamp on the chosen date (ms)
        serviceId: z.number().int().positive(),
        staffId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input }) => {
      // Minimal approach: return slots based on staff schedules and current bookings.
      // For MVP keep this simple: compute weekday from dateTs, query staff_schedules for that weekday,
      // build candidate starts, then filter by existing bookings and blackouts.

      const day = new Date(input.dateTs);
      const weekday = day.getUTCDay();

      // fetch service duration
      const svcRows = await db.select().from(services).where(eq(services.id, input.serviceId)).all();
      const svc = svcRows[0];
      if (!svc) throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
      const durationMs = (svc.durationMin ?? 30) * 60 * 1000;

      // find candidate staff schedules for the weekday
      // weekdays is stored as JSON (e.g. "[1,2,3]"), so load schedules and filter in JS
      const allSchedules = await db.select().from(staff_schedules).all();

      const schedules = (allSchedules || []).filter((s: any) => {
        try {
          const w = typeof s.weekdays === "string" ? JSON.parse(s.weekdays) : s.weekdays;
          return Array.isArray(w) && w.includes(weekday);
        } catch (e) {
          return false;
        }
      });

      // filter by staffId if provided
      const filteredSchedules = input.staffId
        ? schedules.filter((s: any) => s.staffId === input.staffId)
        : schedules;

      const slots: Array<{ startTs: number; endTs: number; staffId: number }> = [];

      for (const s of filteredSchedules) {
        const dateStart = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0);
        const dayStartMs = dateStart + s.startMin * 60 * 1000;
        const dayEndMs = dateStart + s.endMin * 60 * 1000;

        // query existing bookings for this staff on that day (include any booking that overlaps the day window)
        // overlap condition: booking.start < dayEndMs && booking.end > dateStart
        const existing = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.staffId, s.staffId),
              lt(bookings.startTs, new Date(dayEndMs)),
              gt(bookings.endTs, new Date(dateStart))
            )
          )
          .all();

        const bks = existing || [];

        // iterate by slot interval
  const interval = s.slotIntervalMin || svc.durationMin || 30;
        for (let t = dayStartMs; t + durationMs <= dayEndMs; t += interval * 60 * 1000) {
          const candidateStart = t;
          const candidateEnd = t + durationMs;

          // check overlap
          const overlaps = bks.some((bk: any) => !(bk.endTs <= candidateStart || bk.startTs >= candidateEnd));
          if (!overlaps) {
            slots.push({ startTs: candidateStart, endTs: candidateEnd, staffId: s.staffId });
          }
        }
      }

      // sort slots by startTs
      slots.sort((a, b) => a.startTs - b.startTs);
      return { slots };
    }),

  create: publicProcedure.input(bookingCreateSchema).mutation(async ({ input }) => {
    // validate service exists
    const svcRows = await db.select().from(services).where(eq(services.id, input.serviceId)).all();
    const svc = svcRows[0];
    if (!svc) throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });

  const durationMs = (svc.durationMin ?? 30) * 60 * 1000;
  const start = input.startTs;
  const end = start + durationMs;

    // If staffId provided, check availability using overlap condition: booking.start < end && booking.end > start
    if (input.staffId) {
      const overlaps = await db
        .select()
        .from(bookings)
        .where(
          and(eq(bookings.staffId, input.staffId), lt(bookings.startTs, new Date(end)), gt(bookings.endTs, new Date(start)))
        )
        .all();

      if (overlaps.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "SLOT_NOT_AVAILABLE" });
      }
    }

    // If no staffId, server will auto-assign: pick first staff with no overlap for that slot
    let staffId = input.staffId;
    if (!staffId) {
      // naive: iterate active staff rows and pick first without overlap
      const staffRows = await db.select().from(staff).all();
      for (const s of staffRows) {
        const overlaps = await db
          .select()
          .from(bookings)
          .where(and(eq(bookings.staffId, s.id), lt(bookings.startTs, new Date(end)), gt(bookings.endTs, new Date(start))))
          .all();
        if (overlaps.length === 0) {
          staffId = s.id;
          break;
        }
      }
      if (!staffId) throw new TRPCError({ code: "CONFLICT", message: "NO_AVAILABLE_STAFF" });
    }

    // Create booking
    const values = {
      serviceId: input.serviceId,
      staffId,
      startTs: new Date(start),
      endTs: new Date(end),
      customerName: input.customerName,
      customerContact: input.customerContact,
    } as const;

    const [row] = await db.insert(bookings).values(values).returning();
    return { id: row.id } as const;
  }),
} satisfies TRPCRouterRecord;
