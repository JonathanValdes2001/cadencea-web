import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient, supabase } from '@/lib/supabase'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = subscribeSchema.parse(body)
    const { email } = validatedData

    // Create service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Check if user is authenticated to link subscription
    let userId = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      try {
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      } catch (error) {
        // Not authenticated, that's okay for newsletter signup
      }
    }

    // Check if email is already subscribed
    const { data: existingSubscription, error: checkError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking existing subscription:', checkError)
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      )
    }

    if (existingSubscription) {
      if (existingSubscription.status === 'confirmed') {
        return NextResponse.json(
          { message: 'Email is already subscribed to our newsletter' },
          { status: 200 }
        )
      } else if (existingSubscription.status === 'pending') {
        // Resend confirmation email (regenerate token)
        const newToken = randomBytes(32).toString('hex')
        
        const { error: updateError } = await serviceSupabase
          .from('newsletter_subscriptions')
          .update({ 
            confirmation_token: newToken,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)

        if (updateError) {
          console.error('Error updating subscription token:', updateError)
          return NextResponse.json(
            { error: 'Failed to resend confirmation' },
            { status: 500 }
          )
        }

        // In production, send email here
        console.log(`Confirmation email should be sent to ${email} with token: ${newToken}`)

        return NextResponse.json({
          message: 'Confirmation email resent. Please check your inbox.',
          token: process.env.NODE_ENV === 'development' ? newToken : undefined
        })
      } else if (existingSubscription.status === 'unsubscribed') {
        // Resubscribe with new token
        const newToken = randomBytes(32).toString('hex')
        
        const { error: updateError } = await serviceSupabase
          .from('newsletter_subscriptions')
          .update({ 
            status: 'pending',
            confirmation_token: newToken,
            user_id: userId,
            unsubscribed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)

        if (updateError) {
          console.error('Error resubscribing:', updateError)
          return NextResponse.json(
            { error: 'Failed to resubscribe' },
            { status: 500 }
          )
        }

        // In production, send email here
        console.log(`Confirmation email should be sent to ${email} with token: ${newToken}`)

        return NextResponse.json({
          message: 'Subscription renewed! Please check your email to confirm.',
          token: process.env.NODE_ENV === 'development' ? newToken : undefined
        })
      }
    }

    // Create new subscription
    const confirmationToken = randomBytes(32).toString('hex')
    
    const { data: newSubscription, error: insertError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        user_id: userId,
        status: 'pending',
        confirmation_token: confirmationToken,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    // In production, send confirmation email here
    console.log(`Confirmation email should be sent to ${email} with token: ${confirmationToken}`)

    return NextResponse.json({
      message: 'Subscription created! Please check your email to confirm.',
      subscription_id: newSubscription.id,
      token: process.env.NODE_ENV === 'development' ? confirmationToken : undefined
    })

  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
