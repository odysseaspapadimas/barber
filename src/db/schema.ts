import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// prefer integer ms timestamps for easy arithmetic in JS
const nowMs = sql`(strftime('%s','now') * 1000)`;

export const services = sqliteTable("services", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  // boolean mode: TS shows boolean, DB stores 0/1
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // timestamp_ms mode: TS shows number (ms), DB stores integer ms
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const staff_schedules = sqliteTable("staff_schedules", {
  id: integer("id").primaryKey().notNull(),
  staffId: integer("staff_id").notNull(),
  weekday: integer("weekday").notNull(), // 0 = Sunday .. 6 = Saturday
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  slotIntervalMin: integer("slot_interval_min").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const blackouts = sqliteTable("blackouts", {
  id: integer("id").primaryKey().notNull(),
  staffId: integer("staff_id"), // nullable = global blackout when null
  startTs: integer("start_ts", { mode: "timestamp_ms" }).notNull(),
  endTs: integer("end_ts", { mode: "timestamp_ms" }).notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey().notNull(),
  customerId: integer("customer_id").notNull(),
  serviceId: integer("service_id").notNull(),
  staffId: integer("staff_id").notNull(),
  startTs: integer("start_ts", { mode: "timestamp_ms" }).notNull(),
  endTs: integer("end_ts", { mode: "timestamp_ms" }).notNull(),
  status: text("status").notNull().default("confirmed"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export default {
  services,
  staff,
  staff_schedules,
  blackouts,
  customers,
  bookings,
  user,
  session,
  account,
  verification,
};
