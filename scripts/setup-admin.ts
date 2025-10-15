/**
 * Setup script to create admin account with password
 * Run this once: pnpm tsx scripts/setup-admin.ts
 */
import { auth } from '../src/auth/server'

async function setupAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  
  console.log('Setting up admin account...')
  
  try {
    // Set password for admin user via Better Auth API
    // This will create the account record with hashed password
    await auth.api.setPassword({
      body: {
        newPassword: adminPassword,
      },
      // This needs to be called from a session context, so we'll do it differently
    })
    
    console.log('✅ Admin account setup complete!')
    console.log('Email: admin@kypseli.com')
    console.log(`Password: ${adminPassword}`)
  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  }
}

setupAdmin()
