import { betterAuth } from 'better-auth'
import { reactStartCookies } from 'better-auth/react-start'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db as any, {
    provider: 'sqlite',
    schema,
  }),
  
  // Simple password-only authentication
  emailAndPassword: {
    enabled: true,
    // TEMPORARILY enable sign-up to create admin account
    // Set this to true after creating admin user
    disableSignUp: false,
    // No email verification needed for admin
    requireEmailVerification: false,
  },

  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // TanStack Start cookie integration - handles all cookie setting automatically!
  plugins: [
    reactStartCookies(), // Must be last plugin
  ],
})
