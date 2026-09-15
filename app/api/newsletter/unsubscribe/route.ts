import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { renderNewsletterPage } from '@/lib/newsletter-html'
import { z } from 'zod'
import {
  GENERIC_UNSUBSCRIBE_MESSAGE,
  NewsletterRequestError,
  consumeNewsletterRateLimits,
  hashOpaqueToken,
  isOpaqueNewsletterToken,
  newsletterLookupRateLimitChecks,
  readUnsubscribeToken,
  requestId,
  safeErrorCode,
} from '@/lib/newsletter-security.mjs'

const unsubscribeSchema = z.object({
  token: z.string().refine(isOpaqueNewsletterToken),
})

function logFailure(operation: string, id: string, error: unknown) {
  console.error('[Newsletter] Request failed', {
    operation,
    requestId: id,
    code: safeErrorCode(error),
  })
}

function jsonResult(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function htmlResult(success: boolean, id?: string) {
  return renderNewsletterPage({
    title: success ? 'Unsubscribed' : 'Unsubscribe error',
    heading: success ? 'Unsubscribe request completed.' : 'We couldn’t process the request.',
    body: success
      ? GENERIC_UNSUBSCRIBE_MESSAGE
      : `Please try again later. Support reference: ${id}`,
    variant: success ? 'success' : 'error',
    status: success ? 200 : 503,
  })
}

export async function POST(request: NextRequest) {
  const id = requestId()
  const wantsHtml = (request.headers.get('content-type') || '')
    .includes('application/x-www-form-urlencoded')
  try {
    const parsed = unsubscribeSchema.safeParse({
      token: await readUnsubscribeToken(request),
    })
    if (!parsed.success) {
      return wantsHtml
        ? htmlResult(true)
        : jsonResult({ message: GENERIC_UNSUBSCRIBE_MESSAGE }, 200)
    }

    const tokenHash = hashOpaqueToken(parsed.data.token)
    const serviceSupabase = createServiceSupabaseClient()
    await consumeNewsletterRateLimits(
      serviceSupabase,
      newsletterLookupRateLimitChecks(request, 'unsubscribe'),
    )
    const now = new Date().toISOString()
    const { error } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: now,
        confirmation_token_hash: null,
        confirmation_expires_at: null,
        unsubscribe_token_hash: null,
        updated_at: now,
      })
      .eq('unsubscribe_token_hash', tokenHash)
    if (error) throw error

    return wantsHtml
      ? htmlResult(true)
      : jsonResult({ message: GENERIC_UNSUBSCRIBE_MESSAGE }, 200)
  } catch (error) {
    logFailure('unsubscribe', id, error)
    if (error instanceof NewsletterRequestError) {
      if (error.status === 429) {
        if (wantsHtml) {
          const response = renderNewsletterPage({
            title: 'Unsubscribe delayed',
            heading: 'Please try this link again later.',
            body: 'Too many unsubscribe attempts have been made from this network.',
            variant: 'info',
            status: 429,
          })
          response.headers.set('Retry-After', '3600')
          return response
        }
        return NextResponse.json(
          { error: 'Please try again later.', request_id: id },
          {
            status: 429,
            headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' },
          },
        )
      }
      return wantsHtml
        ? htmlResult(true)
        : jsonResult({ message: GENERIC_UNSUBSCRIBE_MESSAGE }, 200)
    }
    return wantsHtml
      ? htmlResult(false, id)
      : jsonResult(
        { error: 'Newsletter service is temporarily unavailable.', request_id: id },
        503,
      )
  }
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token')
  const parsed = unsubscribeSchema.safeParse({ token })
  if (!parsed.success) {
    return renderNewsletterPage({
      title: 'Unsubscribe link',
      heading: 'This link is not valid.',
      body: 'Use the unsubscribe link in the most recent newsletter you received.',
      variant: 'info',
      status: 400,
    })
  }

  return renderNewsletterPage({
    title: 'Confirm unsubscribe',
    heading: 'Stop receiving the Cadencea newsletter?',
    body: 'Confirm below. Opening this page has not changed your subscription.',
    variant: 'info',
    extraBodyHtml: `
      <form method="post" action="/api/newsletter/unsubscribe">
        <input type="hidden" name="token" value="${escape(parsed.data.token)}" />
        <button type="submit" class="btn">Unsubscribe</button>
      </form>
    `,
  })
}

function escape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
