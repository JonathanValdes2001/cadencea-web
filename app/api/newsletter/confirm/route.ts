import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { renderNewsletterPage } from '@/lib/newsletter-html'
import { z } from 'zod'

const confirmSchema = z.object({
  token: z.string().min(1, 'Confirmation token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = confirmSchema.parse(body)
    const { token } = validatedData

    const serviceSupabase = createServiceSupabaseClient()

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

    if (subscription.status === 'confirmed') {
      return NextResponse.json({
        message: 'Email is already confirmed and subscribed to our newsletter',
        email: subscription.email,
      })
    }

    if (subscription.status === 'unsubscribed') {
      return NextResponse.json(
        {
          error:
            'This email has been unsubscribed. Please subscribe again if you wish to receive our newsletter.',
        },
        { status: 400 }
      )
    }

    const { data: updatedSubscription, error: updateError } =
      await serviceSupabase
        .from('newsletter_subscriptions')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmation_token: null,
          updated_at: new Date().toISOString(),
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

    try {
      await serviceSupabase.rpc('log_user_action', {
        p_action: 'newsletter_confirmed',
        p_table_name: 'newsletter_subscriptions',
        p_record_id: subscription.id,
        p_new_values: { status: 'confirmed', email: subscription.email },
      })
    } catch (logError) {
      console.error('Error logging newsletter confirmation:', logError)
    }

    return NextResponse.json({
      message:
        'Email confirmed successfully! You are now subscribed to our newsletter.',
      email: subscription.email,
      confirmed_at: updatedSubscription.confirmed_at,
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
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
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

    const validatedData = confirmSchema.parse({ token })

    const serviceSupabase = createServiceSupabaseClient()

    const { data: subscription, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', validatedData.token)
      .single()

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError)
      return renderNewsletterPage({
        title: 'Confirmation error',
        heading: 'Invalid or expired link.',
        body:
          'This confirmation link is no longer valid. ' +
          'Please try subscribing again, or contact support if the problem persists.',
        variant: 'error',
        status: 400,
      })
    }

    if (subscription.status === 'confirmed') {
      return renderNewsletterPage({
        title: 'Already confirmed',
        heading: 'You’re already subscribed.',
        body:
          'Your email is already confirmed and you’re on the newsletter list. ' +
          'You’ll receive updates about our latest products and features.',
        variant: 'success',
      })
    }

    const { error: updateError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error confirming subscription:', updateError)
      return renderNewsletterPage({
        title: 'Confirmation error',
        heading: 'We couldn’t confirm your subscription.',
        body: 'Something went wrong on our end. Please try again later.',
        variant: 'error',
        status: 500,
      })
    }

    return renderNewsletterPage({
      title: 'Subscription confirmed',
      heading: 'You’re in.',
      body:
        'Thank you for subscribing to the Cadencea newsletter. ' +
        'You’ll receive updates about our latest music production tools, ' +
        'sample libraries, and exclusive offers.',
      variant: 'success',
      extraBodyHtml: `
        <p><strong>Email:</strong> ${escape(subscription.email)}</p>
      `,
    })
  } catch (error) {
    console.error('Newsletter confirm GET error:', error)

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
