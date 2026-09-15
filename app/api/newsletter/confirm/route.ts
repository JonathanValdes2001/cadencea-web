import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { renderNewsletterPage } from '@/lib/newsletter-html'
import { z } from 'zod'
import {
  NewsletterRequestError,
  consumeNewsletterRateLimits,
  hashOpaqueToken,
  isOpaqueNewsletterToken,
  newsletterLookupRateLimitChecks,
  readBoundedJson,
  requestId,
  safeErrorCode,
} from '@/lib/newsletter-security.mjs'

const confirmSchema = z.object({
  token: z.string().refine(isOpaqueNewsletterToken),
}).strict()

function logFailure(operation: string, id: string, error: unknown) {
  console.error('[Newsletter] Request failed', {
    operation,
    requestId: id,
    code: safeErrorCode(error),
  })
}

async function confirmSubscription(rawToken: string, id: string, request: NextRequest) {
  const tokenHash = hashOpaqueToken(rawToken)
  const serviceSupabase = createServiceSupabaseClient()
  await consumeNewsletterRateLimits(
    serviceSupabase,
    newsletterLookupRateLimitChecks(request, 'confirm'),
  )
  const now = new Date().toISOString()

  const { data: subscription, error: findError } = await serviceSupabase
    .from('newsletter_subscriptions')
    .select('id,status,confirmation_expires_at')
    .eq('confirmation_token_hash', tokenHash)
    .maybeSingle()
  if (findError) throw findError
  if (
    !subscription ||
    subscription.status !== 'pending' ||
    !subscription.confirmation_expires_at ||
    !Number.isFinite(Date.parse(subscription.confirmation_expires_at)) ||
    Date.parse(subscription.confirmation_expires_at) <= Date.now()
  ) {
    return false
  }

  const { data: updated, error: updateError } = await serviceSupabase
    .from('newsletter_subscriptions')
    .update({
      status: 'confirmed',
      confirmed_at: now,
      confirmation_token_hash: null,
      confirmation_expires_at: null,
      updated_at: now,
    })
    .eq('id', subscription.id)
    .eq('status', 'pending')
    .eq('confirmation_token_hash', tokenHash)
    .gt('confirmation_expires_at', now)
    .select('id')
    .maybeSingle()
  if (updateError) throw updateError
  if (!updated) return false

  const { error: auditError } = await serviceSupabase.rpc('log_user_action', {
    p_action: 'newsletter_confirmed',
    p_table_name: 'newsletter_subscriptions',
    p_record_id: subscription.id,
    p_new_values: { status: 'confirmed' },
  })
  if (auditError) logFailure('confirmation_audit', id, auditError)
  return true
}

function noStoreJson(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(status === 429 ? { 'Retry-After': '3600' } : {}),
    },
  })
}

export async function POST(request: NextRequest) {
  const id = requestId()
  try {
    const parsed = confirmSchema.safeParse(await readBoundedJson(request))
    if (!parsed.success || !(await confirmSubscription(parsed.data.token, id, request))) {
      return noStoreJson({ error: 'Invalid or expired confirmation token' }, 400)
    }
    return noStoreJson({ message: 'Newsletter subscription confirmed.' }, 200)
  } catch (error) {
    logFailure('confirm', id, error)
    const status = error instanceof NewsletterRequestError ? error.status : 503
    return noStoreJson(
      {
        error: status === 503
          ? 'Newsletter service is temporarily unavailable.'
          : 'Invalid or expired confirmation token',
        request_id: id,
      },
      status,
    )
  }
}

export async function GET(request: NextRequest) {
  const id = requestId()
  try {
    const token = new URL(request.url).searchParams.get('token')
    const parsed = confirmSchema.safeParse({ token })
    if (!parsed.success || !(await confirmSubscription(parsed.data.token, id, request))) {
      return renderNewsletterPage({
        title: 'Confirmation error',
        heading: 'Invalid or expired link.',
        body: 'This confirmation link is no longer valid. Please request a new one.',
        variant: 'error',
        status: 400,
      })
    }
    return renderNewsletterPage({
      title: 'Subscription confirmed',
      heading: 'You’re in.',
      body: 'Thank you for confirming your Cadencea newsletter subscription.',
      variant: 'success',
    })
  } catch (error) {
    logFailure('confirm_get', id, error)
    if (error instanceof NewsletterRequestError && error.status === 429) {
      const response = renderNewsletterPage({
        title: 'Confirmation delayed',
        heading: 'Please try this link again later.',
        body: 'Too many confirmation attempts have been made from this network.',
        variant: 'info',
        status: 429,
      })
      response.headers.set('Retry-After', '3600')
      return response
    }
    return renderNewsletterPage({
      title: 'Confirmation error',
      heading: 'We couldn’t confirm your subscription.',
      body: `Please try again later. Support reference: ${id}`,
      variant: 'error',
      status: 503,
    })
  }
}
