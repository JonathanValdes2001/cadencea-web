import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// Install zod for validation: npm install zod
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    const { email, password, firstName, lastName } = validatedData

    // Create service client for server-side operations
    const supabase = createServiceSupabaseClient()

    // Check if user already exists by attempting to list users with this email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('Error checking existing users:', listError)
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      )
    }
    
    const existingUser = existingUsers.users?.find(user => user.email === email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user with admin API (bypasses email confirmation in dev)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email in development
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // The profile will be created automatically by the database trigger
    // Let's verify it was created
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for trigger
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile creation error:', profileError)
      // Clean up the user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile,
      },
    })

  } catch (error) {
    console.error('Signup error:', error)
    
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
