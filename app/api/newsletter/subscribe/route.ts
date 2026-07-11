import { NextRequest, NextResponse } from 'next/server'
import {
  createAnonymousServerSupabaseClient,
  createServiceSupabaseClient,
} from '@/lib/supabase/service'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendNewsletterConfirmation } from '@/lib/newsletter-email.mjs'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const RESEND_COOLDOWN_MS = 60_000

async function deliverConfirmation(email: string, token: string) {
  try {
    await sendNewsletterConfirmation({ email, token })
    return null
  } catch (error) {
    const mailError = error as { code?: string; command?: string; name?: string }
    console.error('[Newsletter] Confirmation delivery failed', {
      code: mailError?.code || mailError?.name || 'unknown',
      command: mailError?.command || undefined,
    })
    return NextResponse.json(
      { error: 'Could not send confirmation email. Please try again later.' },
      { status: 503 },
    )
  }
}

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
        const supabase = createAnonymousServerSupabaseClient()
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
        const lastUpdate = Date.parse(existingSubscription.updated_at)
        if (Number.isFinite(lastUpdate) && Date.now() - lastUpdate < RESEND_COOLDOWN_MS) {
          return NextResponse.json(
            { error: 'Please wait before requesting another confirmation email.' },
            { status: 429 },
          )
        }
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

        const deliveryFailure = await deliverConfirmation(email, newToken)
        if (deliveryFailure) return deliveryFailure

        return NextResponse.json({
          message: 'Confirmation email resent. Please check your inbox.'
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

        const deliveryFailure = await deliverConfirmation(email, newToken)
        if (deliveryFailure) return deliveryFailure

        return NextResponse.json({
          message: 'Subscription renewed! Please check your email to confirm.'
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

    const deliveryFailure = await deliverConfirmation(email, confirmationToken)
    if (deliveryFailure) return deliveryFailure

    return NextResponse.json({
      message: 'Subscription created! Please check your email to confirm.',
      subscription_id: newSubscription.id
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
