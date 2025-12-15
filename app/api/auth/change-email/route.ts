import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient, supabase } from '@/lib/supabase'
import { z } from 'zod'

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = changeEmailSchema.parse(body)
    const { newEmail } = validatedData

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

    // Create service client for admin operations
    const serviceSupabase = createServiceSupabaseClient()

    // Check if the new email is already in use
    const { data: existingUsers, error: listError } = await serviceSupabase.auth.admin.listUsers()
    if (listError) {
      console.error('Error checking existing users:', listError)
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      )
    }

    const existingUser = existingUsers.users?.find(u => u.email === newEmail && u.id !== user.id)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      )
    }

    // Update user email using admin API
    const { data: updatedUser, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      user.id,
      {
        email: newEmail,
        email_confirm: true, // Auto-confirm in development
      }
    )

    if (updateError) {
      console.error('Error updating user email:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Update the profile table as well
    const { error: profileUpdateError } = await serviceSupabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Error updating profile email:', profileUpdateError)
      // This is not critical, but we should log it
    }

    return NextResponse.json({
      message: 'Email updated successfully',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
      },
    })

  } catch (error) {
    console.error('Change email error:', error)
    
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
