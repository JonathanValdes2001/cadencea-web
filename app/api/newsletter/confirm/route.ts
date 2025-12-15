import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const confirmSchema = z.object({
  token: z.string().min(1, 'Confirmation token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = confirmSchema.parse(body)
    const { token } = validatedData

    // Create service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Find subscription by token
    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      )
    }

    // Check if already confirmed
    if (subscription.status === 'confirmed') {
      return NextResponse.json({
        message: 'Email is already confirmed and subscribed to our newsletter',
        email: subscription.email
      })
    }

    // Check if unsubscribed
    if (subscription.status === 'unsubscribed') {
      return NextResponse.json(
        { error: 'This email has been unsubscribed. Please subscribe again if you wish to receive our newsletter.' },
        { status: 400 }
      )
    }

    // Confirm the subscription
    const { data: updatedSubscription, error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null, // Clear the token after use
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error confirming subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm subscription' },
        { status: 500 }
      )
    }

    // Log the confirmation for audit trail
    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_confirmed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: { status: 'confirmed', email: subscription.email }
      })
    } catch (logError) {
      console.error('Error logging newsletter confirmation:', logError)
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      message: 'Email confirmed successfully! You are now subscribed to our newsletter.',
      email: subscription.email,
      confirmed_at: updatedSubscription.confirmed_at
    })

  } catch (error) {
    console.error('Newsletter confirm error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid confirmation token', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET request for email link confirmation
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing confirmation token' },
        { status: 400 }
      )
    }

    // Validate token
    const validatedData = confirmSchema.parse({ token })

    // Create service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Find subscription by token
    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      
      // Return HTML page for better user experience
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Confirmation Error - Cadencea Vault</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; }
              .error { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter Confirmation</h1>
              <p class="error">Invalid or expired confirmation token.</p>
              <p>Please try subscribing again or contact support if you continue to have issues.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if already confirmed
    if (subscription.status === 'confirmed') {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Already Confirmed - Cadencea Vault</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; }
              .success { color: #10b981; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter Subscription</h1>
              <p class="success">Your email is already confirmed and subscribed to our newsletter!</p>
              <p>You'll receive updates about our latest products and features.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Confirm the subscription
    const { error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error confirming subscription:', updateError)
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Confirmation Error - Cadencea Vault</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; }
              .error { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter Confirmation</h1>
              <p class="error">Failed to confirm subscription. Please try again later.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Subscription Confirmed - Cadencea Vault</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #10b981; }
            .checkmark { font-size: 4rem; color: #10b981; margin: 2rem 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h1>Newsletter Subscription Confirmed!</h1>
            <p class="success">Thank you for subscribing to the Cadencea Vault newsletter!</p>
            <p>You'll receive updates about our latest music production tools, sample libraries, and exclusive offers.</p>
            <p><strong>Email:</strong> ${subscription.email}</p>
            <a href="/" style="color: #8b5cf6; text-decoration: none; background: #8b5cf6; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-block; margin-top: 2rem;">Return to Homepage</a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Newsletter confirm GET error:', error)
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Cadencea Vault</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Newsletter Confirmation</h1>
            <p class="error">An unexpected error occurred. Please try again later.</p>
            <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
