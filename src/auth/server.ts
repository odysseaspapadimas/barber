import { betterAuth } from "better-auth";
import { reactStartCookies } from "better-auth/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { scryptSync } from "node:crypto";

export const auth = betterAuth({
  database: drizzleAdapter(db as any, {
    provider: "sqlite",
    schema,
  }),
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  // Simple password-only authentication
  emailAndPassword: {
    enabled: true,
    // TEMPORARILY enable sign-up to create admin account
    // Set this to true after creating admin user
    disableSignUp: false,
    // No email verification needed for admin
    requireEmailVerification: false,
    autoSignIn: true,
    password: {
      hash: async (password) => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const key = scryptSync(password.normalize("NFKC"), saltHex, 64, {
          N: 16384,
          r: 16,
          p: 1,
          maxmem: 128 * 16384 * 16 * 2,
        });

        const keyHex = Array.from(key)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return `${saltHex}:${keyHex}`;
      },
      verify: async ({ hash, password }) => {
        const [saltHex, keyHex] = hash.split(":");

        const targetKey = scryptSync(password.normalize("NFKC"), saltHex, 64, {
          N: 16384,
          r: 16,
          p: 1,
          maxmem: 128 * 16384 * 16 * 2,
        });

        const targetKeyHex = Array.from(targetKey)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return targetKeyHex === keyHex;
      },
    },
  },

  // Session configuration
  session: {
    // Keep the session alive for 30 days (30 * 24 * 60 * 60 seconds)
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    // How often the session should be refreshed (server-side rolling)
    updateAge: 24 * 60 * 60, // 1 day
    cookieCache: {
      enabled: true,
      // Keep the client-side cookie cache in sync with session lifetime to
      // avoid the client cache expiring before the server session does.
      // Set to 30 days (seconds).
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },

  // TanStack Start cookie integration - handles all cookie setting automatically!
  plugins: [
    reactStartCookies(), // Must be last plugin
  ],
});
