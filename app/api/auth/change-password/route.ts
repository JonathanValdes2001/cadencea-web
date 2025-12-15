import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = changePasswordSchema.parse(body)
    const { currentPassword, newPassword } = validatedData

    // Get current session from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // First, verify the current password by attempting to sign in with it
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Create service client for admin operations
    const serviceSupabase = createServiceSupabaseClient()

    // Update user password using admin API
    const { data: updatedUser, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      console.error('Error updating user password:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Log the password change for audit trail
    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'password_change',
        p_table_name: 'auth.users',
        p_record_id: user.id,
      })
    } catch (logError) {
      console.error('Error logging password change:', logError)
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    })

  } catch (error) {
    console.error('Change password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
