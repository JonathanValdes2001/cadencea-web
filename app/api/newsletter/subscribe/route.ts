import { NextRequest, NextResponse } from 'next/server'
import {
  createAnonymousServerSupabaseClient,
  createServiceSupabaseClient,
} from '@/lib/supabase/service'
import { z } from 'zod'
import { sendNewsletterConfirmation } from '@/lib/newsletter-email.mjs'
import {
  GENERIC_SUBSCRIBE_MESSAGE,
  NewsletterRequestError,
  consumeNewsletterRateLimits,
  createConfirmationToken,
  deriveUnsubscribeTokenHash,
  newsletterRateLimitChecks,
  normalizeNewsletterEmail,
  readBoundedJson,
  requestId,
  safeErrorCode,
} from '@/lib/newsletter-security.mjs'

const subscribeSchema = z.object({
  email: z.preprocess(
    normalizeNewsletterEmail,
    z.string().email().max(254),
  ),
}).strict()

const RESEND_COOLDOWN_MS = 60_000

function accepted() {
  return NextResponse.json(
    { message: GENERIC_SUBSCRIBE_MESSAGE },
    { status: 202 },
  )
}

function logFailure(operation: string, id: string, error: unknown) {
  console.error('[Newsletter] Request failed', {
    operation,
    requestId: id,
    code: safeErrorCode(error),
  })
}

async function deliverConfirmation(email: string, token: string, id: string) {
  try {
    await sendNewsletterConfirmation({ email, token })
  } catch (error) {
    logFailure('confirmation_delivery', id, error)
  }
}

export async function POST(request: NextRequest) {
  const id = requestId()
  try {
    const parsed = subscribeSchema.safeParse(await readBoundedJson(request))
    if (!parsed.success) {
      throw new NewsletterRequestError('Invalid newsletter request')
    }
    const { email } = parsed.data
    const serviceSupabase = createServiceSupabaseClient()
    await consumeNewsletterRateLimits(
      serviceSupabase,
      newsletterRateLimitChecks(request, email),
    )

    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabase = createAnonymousServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
        userId = user?.id || null
      } catch {
        // Newsletter signup remains available without an account.
      }
    }

    const { data: existing, error: findError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .select('id,email,user_id,status,updated_at,unsubscribe_token_hash,unsubscribe_token_version')
      .eq('email', email)
      .maybeSingle()
    if (findError) throw findError

    if (existing?.status === 'confirmed') {
      if (!existing.unsubscribe_token_hash) {
        const unsubscribeTokenVersion = Math.max(1, existing.unsubscribe_token_version || 1)
        const unsubscribeTokenHash = deriveUnsubscribeTokenHash({
          id: existing.id,
          email,
          version: unsubscribeTokenVersion,
        })
        const { error: repairError } = await serviceSupabase
          .from('newsletter_subscriptions')
          .update({ unsubscribe_token_hash: unsubscribeTokenHash })
          .eq('id', existing.id)
          .is('unsubscribe_token_hash', null)
        if (repairError) throw repairError
      }
      return accepted()
    }
    if (existing?.status === 'pending') {
      const lastUpdate = Date.parse(existing.updated_at)
      if (Number.isFinite(lastUpdate) && Date.now() - lastUpdate < RESEND_COOLDOWN_MS) {
        return accepted()
      }
    }

    const confirmation = createConfirmationToken()

    if (existing) {
      const currentVersion = Math.max(1, existing.unsubscribe_token_version || 1)
      const unsubscribeTokenVersion = existing.status === 'unsubscribed'
        ? currentVersion + 1
        : currentVersion
      const unsubscribeTokenHash = deriveUnsubscribeTokenHash({
        id: existing.id,
        email,
        version: unsubscribeTokenVersion,
      })
      const { error: updateError } = await serviceSupabase
        .from('newsletter_subscriptions')
        .update({
          status: 'pending',
          confirmation_token_hash: confirmation.tokenHash,
          confirmation_expires_at: confirmation.expiresAt,
          unsubscribe_token_hash: unsubscribeTokenHash,
          unsubscribe_token_version: unsubscribeTokenVersion,
          user_id: userId ?? existing.user_id,
          confirmed_at: null,
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (updateError) throw updateError

      await deliverConfirmation(email, confirmation.token, id)
      return accepted()
    }

    const { data: created, error: insertError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        user_id: userId,
        status: 'pending',
        confirmation_token_hash: confirmation.tokenHash,
        confirmation_expires_at: confirmation.expiresAt,
        unsubscribe_token_version: 1,
      })
      .select('id')
      .single()
    if (insertError?.code === '23505') return accepted()
    if (insertError || !created) throw insertError || new Error('Insert failed')

    const unsubscribeTokenHash = deriveUnsubscribeTokenHash({
      id: created.id,
      email,
      version: 1,
    })
    const { error: tokenError } = await serviceSupabase
      .from('newsletter_subscriptions')
      .update({ unsubscribe_token_hash: unsubscribeTokenHash })
      .eq('id', created.id)
    if (tokenError) throw tokenError

    await deliverConfirmation(email, confirmation.token, id)
    return accepted()
  } catch (error) {
    logFailure('subscribe', id, error)
    if (error instanceof NewsletterRequestError) {
      return NextResponse.json(
        { error: error.message, request_id: id },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { error: 'Newsletter service is temporarily unavailable.', request_id: id },
      { status: 503 },
    )
  }
}
