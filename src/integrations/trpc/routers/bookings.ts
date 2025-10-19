import { db } from "@/db";
import { bookings, services, staff, staff_schedules } from "@/db/schema";
import { publicProcedure, protectedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { bookingsInsertSchema, bookingsSelectSchema } from "@/lib/types";

export const bookingsRouter = {
  // Admin protected list for management (can pass date range or staffId/serviceId)
  list: protectedProcedure
    .input(
      bookingsSelectSchema
        .pick({ staffId: true, serviceId: true })
        .partial()
        .extend({
          fromTs: z.number().optional(),
          toTs: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      // Build explicit branches to satisfy drizzle types
      let bookingRows: any[];
      if (!input) {
        bookingRows = await db.select().from(bookings).all();
      } else {
        const conditions: any[] = [];
        if (input.fromTs)
          conditions.push(gte(bookings.startTs, new Date(input.fromTs)));
        if (input.toTs)
          conditions.push(lte(bookings.startTs, new Date(input.toTs)));
        if (input.staffId) conditions.push(eq(bookings.staffId, input.staffId));
        if (input.serviceId)
          conditions.push(eq(bookings.serviceId, input.serviceId));

        if (conditions.length === 0) {
          bookingRows = await db.select().from(bookings).all();
        } else if (conditions.length === 1) {
          bookingRows = await db.select().from(bookings).where(conditions[0]).all();
        } else {
          bookingRows = await db
            .select()
            .from(bookings)
            .where(and(...conditions))
            .all();
        }
      }

      // Fetch related service and staff data for each booking
      const bookingsWithDetails = await Promise.all(
        bookingRows.map(async (booking) => {
          // Fetch service data
          const [serviceData] = await db
            .select()
            .from(services)
            .where(eq(services.id, booking.serviceId))
            .all();

          // Fetch staff data if staffId exists
          let staffData = null;
          if (booking.staffId) {
            const [staffRow] = await db
              .select()
              .from(staff)
              .where(eq(staff.id, booking.staffId))
              .all();
            staffData = staffRow;
          }

          return {
            ...booking,
            service: serviceData,
            staff: staffData,
          };
        })
      );

      return bookingsWithDetails;
    }),

  get: publicProcedure
    .input(bookingsSelectSchema.pick({ id: true }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id))
        .all();
      const b = rows[0];
      if (!b)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "BOOKING_NOT_FOUND",
        });

      // Fetch related service and staff data
      const [serviceData] = await db
        .select()
        .from(services)
        .where(eq(services.id, b.serviceId))
        .all();

      let staffData = null;
      if (b.staffId) {
        const [staffRow] = await db
          .select()
          .from(staff)
          .where(eq(staff.id, b.staffId))
          .all();
        staffData = staffRow;
      }

      return {
        ...b,
        service: serviceData,
        staff: staffData,
      };
    }),

  // available slots for a date: minimal implementation that returns candidate slots per staff
  available: publicProcedure
    .input(
      bookingsSelectSchema
        .pick({ serviceId: true, staffId: true })
        .extend({
          dateTs: z.number().int().positive(), // any timestamp on the chosen date (ms)
          serviceId: z.number().int().positive().optional(), // optional: defaults to 30 min slot
          staffId: z.number().int().positive().optional(),
        })
    )
    .query(async ({ input }) => {
      // Minimal approach: return slots based on staff schedules and current bookings.
      // For MVP keep this simple: compute weekday from dateTs, query staff_schedules for that weekday,
      // build candidate starts, then filter by existing bookings and blackouts.

      const day = new Date(input.dateTs);
      const weekday = day.getUTCDay();

      // fetch service duration if provided, otherwise use default 30 minutes
      let durationMs = 30 * 60 * 1000;
      if (input.serviceId) {
        const svcRows = await db
          .select()
          .from(services)
          .where(eq(services.id, input.serviceId))
          .all();
        const svc = svcRows[0];
        if (!svc)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "SERVICE_NOT_FOUND",
          });
        durationMs = (svc.durationMin ?? 30) * 60 * 1000;
      }

      // find candidate staff schedules for the weekday
      // weekdays is stored as JSON (e.g. "[1,2,3]"), so load schedules and filter in JS
      const allSchedules = await db.select().from(staff_schedules).all();

      const schedules = (allSchedules || []).filter((s: any) => {
        try {
          const w =
            typeof s.weekdays === "string"
              ? JSON.parse(s.weekdays)
              : s.weekdays;
          return Array.isArray(w) && w.includes(weekday);
        } catch (e) {
          return false;
        }
      });

      // filter by staffId if provided
      const filteredSchedules = input.staffId
        ? schedules.filter((s: any) => s.staffId === input.staffId)
        : schedules;

      const slots: Array<{ startTs: number; endTs: number; staffId: number }> =
        [];

      for (const s of filteredSchedules) {
        const dateStart = Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          0,
          0,
          0,
          0
        );
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

        // iterate by slot interval (use schedule's interval, or default to 30 min)
        const interval = s.slotIntervalMin || 30;
        for (
          let t = dayStartMs;
          t + durationMs <= dayEndMs;
          t += interval * 60 * 1000
        ) {
          const candidateStart = t;
          const candidateEnd = t + durationMs;

          // check overlap
          const overlaps = bks.some(
            (bk: any) =>
              !(bk.endTs <= candidateStart || bk.startTs >= candidateEnd)
          );
          if (!overlaps) {
            slots.push({
              startTs: candidateStart,
              endTs: candidateEnd,
              staffId: s.staffId,
            });
          }
        }
      }

      // sort slots by startTs and filter for future slots only
      const now = Date.now();
      slots.sort((a, b) => a.startTs - b.startTs);
      const futureSlots = slots.filter((slot) => slot.startTs > now);
      return { slots: futureSlots };
    }),

  create: publicProcedure
    .input(bookingsInsertSchema.omit({ endTs: true }))
    .mutation(async ({ input }) => {
      // validate service exists
      const svcRows = await db
        .select()
        .from(services)
        .where(eq(services.id, input.serviceId))
        .all();
      const svc = svcRows[0];
      if (!svc)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SERVICE_NOT_FOUND",
        });

      const durationMs = (svc.durationMin ?? 30) * 60 * 1000;
      const start = input.startTs.getTime();
      const end = start + durationMs;

      // If staffId provided, check availability using overlap condition: booking.start < end && booking.end > start
      if (input.staffId) {
        const overlaps = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.staffId, input.staffId),
              lt(bookings.startTs, new Date(end)),
              gt(bookings.endTs, new Date(start))
            )
          )
          .all();

        if (overlaps.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "SLOT_NOT_AVAILABLE",
          });
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
            .where(
              and(
                eq(bookings.staffId, s.id),
                lt(bookings.startTs, new Date(end)),
                gt(bookings.endTs, new Date(start))
              )
            )
            .all();
          if (overlaps.length === 0) {
            staffId = s.id;
            break;
          }
        }
        if (!staffId)
          throw new TRPCError({
            code: "CONFLICT",
            message: "NO_AVAILABLE_STAFF",
          });
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

  // Cancel a booking (admin only)
  cancel: protectedProcedure
    .input(bookingsSelectSchema.pick({ id: true }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id))
        .all();

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "BOOKING_NOT_FOUND",
        });
      }

      if (existing.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "BOOKING_ALREADY_CANCELLED",
        });
      }

      await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
