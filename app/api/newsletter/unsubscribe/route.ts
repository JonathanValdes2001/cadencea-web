import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { renderNewsletterPage } from '@/lib/newsletter-html'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = unsubscribeSchema.parse(body)
    const { email } = validatedData

    const serviceSupabase = createServiceSupabaseClient()

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

    if (subscription.status === 'unsubscribed') {
      return NextResponse.json({
        message: 'Email is already unsubscribed from our newsletter',
        email: subscription.email,
      })
    }

    const { data: updatedSubscription, error: updateError } =
      await serviceSupabase
        .from('newsletter_subscriptions')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_unsubscribed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: {
          status: 'unsubscribed',
          email: subscription.email,
        },
      })
    } catch (logError) {
      console.error('Error logging newsletter unsubscribe:', logError)
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed from our newsletter',
      email: subscription.email,
      unsubscribed_at: updatedSubscription.unsubscribed_at,
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
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
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
      return renderNewsletterPage({
        title: 'Unsubscribe error',
        heading: 'Missing email address.',
        body:
          'This unsubscribe link is missing the required email parameter. ' +
          'Please try the link in the most recent newsletter you received.',
        variant: 'error',
        status: 400,
      })
    }

    const validatedData = unsubscribeSchema.parse({ email })

    const serviceSupabase = createServiceSupabaseClient()

    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', validatedData.email)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      return renderNewsletterPage({
        title: 'Email not found',
        heading: 'Email address not found.',
        body:
          'We couldn’t find this email in our newsletter database. ' +
          'You may have already been unsubscribed, or never subscribed in the first place.',
        variant: 'info',
        status: 404,
      })
    }

    if (subscription.status === 'unsubscribed') {
      return renderNewsletterPage({
        title: 'Already unsubscribed',
        heading: 'You’re already unsubscribed.',
        body:
          'This email address is already unsubscribed from our newsletter. ' +
          'You won’t receive any further emails from us.',
        variant: 'info',
      })
    }

    const { error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error unsubscribing:', updateError)
      return renderNewsletterPage({
        title: 'Unsubscribe error',
        heading: 'We couldn’t unsubscribe you right now.',
        body: 'Something went wrong on our end. Please try again later.',
        variant: 'error',
        status: 500,
      })
    }

    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_unsubscribed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: {
          status: 'unsubscribed',
          email: subscription.email,
        },
      })
    } catch (logError) {
      console.error('Error logging newsletter unsubscribe:', logError)
    }

    return renderNewsletterPage({
      title: 'Unsubscribed',
      heading: 'Successfully unsubscribed.',
      body:
        `You have been unsubscribed from the Cadencea newsletter. ` +
        `You’ll no longer receive newsletter emails from us.`,
      variant: 'success',
      extraBodyHtml: `
        <p><strong>Email:</strong> ${escape(subscription.email)}</p>
        <p class="footnote">
          We’re sorry to see you go. If you have feedback about our
          newsletter, please let us know at support@cadenceavn.com.
        </p>
      `,
    })
  } catch (error) {
    console.error('Newsletter unsubscribe GET error:', error)

    return renderNewsletterPage({
      title: 'Error',
      heading: 'Something went wrong.',
      body: 'An unexpected error occurred. Please try again later.',
      variant: 'error',
      status: 500,
    })
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
