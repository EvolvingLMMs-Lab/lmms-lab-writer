import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const TEST_EMAIL = 'test@latex-writer.dev'
const TEST_PASSWORD = 'testpassword123'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test login only available in development' },
      { status: 403 }
    )
  }

  try {
    const adminClient = createAdminClient()

    // Check if test user exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const testUser = existingUsers?.users?.find((u) => u.email === TEST_EMAIL)

    if (!testUser) {
      // Create test user with confirmed email
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      })

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create test user: ${createError.message}` },
          { status: 500 }
        )
      }
    }

    // Return credentials for client-side login
    return NextResponse.json({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
