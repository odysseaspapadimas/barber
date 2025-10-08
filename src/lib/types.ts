import {
	services,
	staff,
	staff_schedules,
	blackouts,
	customers,
	bookings,
} from '../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

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
export const bookingsInsertSchema = createInsertSchema(bookings);
