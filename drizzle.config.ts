import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.D1_ACCOUNT_ID || "D1_ACCOUNT_ID",
    databaseId: process.env.D1_DATABASE_ID || "D1_DATABASE_ID",
    token: process.env.D1_TOKEN || "D1_TOKEN",
  },
});
