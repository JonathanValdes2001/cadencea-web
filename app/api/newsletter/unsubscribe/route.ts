import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = unsubscribeSchema.parse(body)
    const { email } = validatedData

    // Create service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Find subscription by email
    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      return NextResponse.json(
        { error: 'Email not found in our newsletter database' },
        { status: 404 }
      )
    }

    // Check if already unsubscribed
    if (subscription.status === 'unsubscribed') {
      return NextResponse.json({
        message: 'Email is already unsubscribed from our newsletter',
        email: subscription.email
      })
    }

    // Unsubscribe the user
    const { data: updatedSubscription, error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({ 
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error unsubscribing:', updateError)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    // Log the unsubscribe for audit trail
    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_unsubscribed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: { status: 'unsubscribed', email: subscription.email }
      })
    } catch (logError) {
      console.error('Error logging newsletter unsubscribe:', logError)
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed from our newsletter',
      email: subscription.email,
      unsubscribed_at: updatedSubscription.unsubscribed_at
    })

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    
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

// Handle GET request for email link unsubscribe
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribe Error - Cadencea Vault</title>
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
              <h1>Newsletter Unsubscribe</h1>
              <p class="error">Missing email address in unsubscribe link.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Validate email
    const validatedData = unsubscribeSchema.parse({ email })

    // Create service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Find subscription by email
    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Not Found - Cadencea Vault</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; }
              .warning { color: #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter Unsubscribe</h1>
              <p class="warning">Email address not found in our newsletter database.</p>
              <p>You may have already been unsubscribed or never subscribed to our newsletter.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if already unsubscribed
    if (subscription.status === 'unsubscribed') {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Already Unsubscribed - Cadencea Vault</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; }
              .info { color: #3b82f6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter Unsubscribe</h1>
              <p class="info">This email address is already unsubscribed from our newsletter.</p>
              <p>You will not receive any further newsletter emails from us.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Unsubscribe the user
    const { error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({ 
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error unsubscribing:', updateError)
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribe Error - Cadencea Vault</title>
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
              <h1>Newsletter Unsubscribe</h1>
              <p class="error">Failed to unsubscribe. Please try again later.</p>
              <a href="/" style="color: #8b5cf6;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Log the unsubscribe
    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_unsubscribed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: { status: 'unsubscribed', email: subscription.email }
      })
    } catch (logError) {
      console.error('Error logging newsletter unsubscribe:', logError)
      // Don't fail the request for logging errors
    }

    // Success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Successfully Unsubscribed - Cadencea Vault</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: white; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #10b981; }
            .checkmark { font-size: 4rem; color: #10b981; margin: 2rem 0; }
            .resubscribe { margin-top: 2rem; padding: 1rem; background: #1e293b; border-radius: 0.5rem; border: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h1>Successfully Unsubscribed</h1>
            <p class="success">You have been unsubscribed from the Cadencea Vault newsletter.</p>
            <p><strong>Email:</strong> ${subscription.email}</p>
            <p>You will no longer receive newsletter emails from us.</p>
            
            <div class="resubscribe">
              <h3>Changed your mind?</h3>
              <p style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem;">
                You can resubscribe to our newsletter anytime by visiting our website.
              </p>
              <a href="/" style="color: #8b5cf6; text-decoration: none;">Visit Homepage</a>
            </div>
            
            <div style="margin-top: 2rem; font-size: 0.75rem; color: #64748b;">
              <p>We're sorry to see you go. If you have any feedback about our newsletter, please let us know at support@cadenceavn.com</p>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Newsletter unsubscribe GET error:', error)
    
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
            <h1>Newsletter Unsubscribe</h1>
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
