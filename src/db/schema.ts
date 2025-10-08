import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// prefer integer ms timestamps for easy arithmetic in JS
const nowMs = sql`(strftime('%s','now') * 1000)`;

export const services = sqliteTable('services', {
  id: integer('id').primaryKey().notNull(),
  name: text('name').notNull(),
  durationMin: integer('duration_min').notNull(),
  priceCents: integer('price_cents').notNull(),
  // boolean mode: TS shows boolean, DB stores 0/1
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  // timestamp_ms mode: TS shows number (ms), DB stores integer ms
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});


export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey().notNull(),
  name: text('name').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const staff_schedules = sqliteTable('staff_schedules', {
  id: integer('id').primaryKey().notNull(),
  staffId: integer('staff_id').notNull(),
  weekday: integer('weekday').notNull(), // 0 = Sunday .. 6 = Saturday
  startMin: integer('start_min').notNull(),
  endMin: integer('end_min').notNull(),
  slotIntervalMin: integer('slot_interval_min').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const blackouts = sqliteTable('blackouts', {
  id: integer('id').primaryKey().notNull(),
  staffId: integer('staff_id'), // nullable = global blackout when null
  startTs: integer('start_ts', { mode: 'timestamp_ms' }).notNull(),
  endTs: integer('end_ts', { mode: 'timestamp_ms' }).notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey().notNull(),
  customerId: integer('customer_id').notNull(),
  serviceId: integer('service_id').notNull(),
  staffId: integer('staff_id').notNull(),
  startTs: integer('start_ts', { mode: 'timestamp_ms' }).notNull(),
  endTs: integer('end_ts', { mode: 'timestamp_ms' }).notNull(),
  status: text('status').notNull().default('confirmed'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});

export default {
  services,
  staff,
  staff_schedules,
  blackouts,
  customers,
  bookings,
};
