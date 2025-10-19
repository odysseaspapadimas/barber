import { integer, text, sqliteTableCreator } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const sqliteTable = sqliteTableCreator((name) => `projects_${name}`);

// prefer integer ms timestamps for easy arithmetic in JS
// Use the same unixepoch(subsecond) expression as the user/account tables
const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const services = sqliteTable("services", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  // boolean mode: TS shows boolean, DB stores 0/1
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // timestamp_ms mode: TS shows number (ms), DB stores integer ms
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone"),
  role: text("role").notNull().default("stylist"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const staff_schedules = sqliteTable("staff_schedules", {
  id: integer("id").primaryKey().notNull(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  weekdays: text("weekdays").notNull().default("[]"), // JSON array of weekday numbers: "[1,2,3,4,5]" for Mon-Fri
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  slotIntervalMin: integer("slot_interval_min").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const blackouts = sqliteTable("blackouts", {
  id: integer("id").primaryKey().notNull(),
  staffId: integer("staff_id").references(() => staff.id), // nullable = global blackout when null
  startTs: integer("start_ts", { mode: "timestamp_ms" }).notNull(),
  endTs: integer("end_ts", { mode: "timestamp_ms" }).notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey().notNull(),
  // Which service was booked
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  // Nullable: when omitted the server will auto-assign an available staff
  staffId: integer("staff_id").references(() => staff.id),
  // start / end timestamps in ms since epoch
  startTs: integer("start_ts", { mode: "timestamp_ms" }).notNull(),
  endTs: integer("end_ts", { mode: "timestamp_ms" }).notNull(),
  // Guest info (bookings are created without requiring a customer account)
  customerName: text("customer_name").notNull(),
  customerContact: text("customer_contact"),
  // booking lifecycle
  status: text("status").notNull().default("confirmed"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
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
    .default(nowMs)
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
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
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
