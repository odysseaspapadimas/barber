import {
  services,
  staff,
  staff_schedules,
  blackouts,
  customers,
  bookings,
} from "../db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export type Service = typeof services.$inferSelect;
export type ServiceInsert = typeof services.$inferInsert;

export const servicesSelectSchema = createSelectSchema(services);
export const servicesInsertSchema = createInsertSchema(services);

export type StaffSelect = typeof staff.$inferSelect;
export type StaffInsert = typeof staff.$inferInsert;

export const staffSelectSchema = createSelectSchema(staff);
export const staffInsertSchema = createInsertSchema(staff);

export type StaffScheduleSelect = typeof staff_schedules.$inferSelect;
export type StaffScheduleInsert = typeof staff_schedules.$inferInsert;

export const staffSchedulesSelectSchema = createSelectSchema(staff_schedules);
export const staffSchedulesInsertSchema = createInsertSchema(staff_schedules);

export type BlackoutSelect = typeof blackouts.$inferSelect;
export type BlackoutInsert = typeof blackouts.$inferInsert;

export const blackoutsSelectSchema = createSelectSchema(blackouts);
export const blackoutsInsertSchema = createInsertSchema(blackouts);

export type CustomerSelect = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;

export const customersSelectSchema = createSelectSchema(customers);
export const customersInsertSchema = createInsertSchema(customers);

export type BookingSelect = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;

export const bookingsSelectSchema = createSelectSchema(bookings);
export const bookingsInsertSchema = createInsertSchema(bookings, {
  serviceId: z.number().min(1, {
    message: "Service is required",
  }),
  staffId: z.number().min(1, {
    message: "Staff is required",
  }),
  startTs: z.date().refine((date) => date.getTime() > Date.now(), {
    message: "Time must be in the future",
  }),
  customerName: z.string().min(1, {
    message: "Name is required",
  }),
  customerContact: z.string().min(1, {
    message: "Phone is required",
  }),
});

// Extend bookingsInsertSchema for the form, replacing startTs with date + startTs timestamp
export const bookingFormSchema = bookingsInsertSchema
  .omit({ startTs: true, endTs: true, id: true, createdAt: true, updatedAt: true, status: true, notes: true, serviceId: true, staffId: true })
  .extend({
    date: z.string().min(1, "Date is required"),
    serviceId: z.number().nullable().refine((val) => val !== null && val > 0, {
      message: "Service is required",
    }),
    staffId: z.number().nullable().refine((val) => val !== null && val > 0, {
      message: "Staff is required",
    }),
    startTs: z.number().nullable().refine((val) => val !== null && val > 0, {
      message: "Time is required",
    }),
  });
