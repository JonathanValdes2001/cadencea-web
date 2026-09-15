import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

export const NEWSLETTER_BODY_LIMIT_BYTES = 1024;
export const CONFIRMATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const GENERIC_SUBSCRIBE_MESSAGE =
  'If this address can be subscribed, a confirmation email will arrive shortly.';
export const GENERIC_UNSUBSCRIBE_MESSAGE =
  'If the link was valid, the address has been unsubscribed.';

export class NewsletterRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'NewsletterRequestError';
    this.status = status;
  }
}

export function requestId() {
  return randomUUID();
}

export function normalizeNewsletterEmail(value) {
  if (typeof value !== 'string') return value;
  return value.normalize('NFKC').trim().toLowerCase();
}

export function isOpaqueNewsletterToken(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function hashOpaqueToken(value) {
  if (!isOpaqueNewsletterToken(value)) {
    throw new NewsletterRequestError('Invalid or expired newsletter link');
  }
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function createConfirmationToken(now = Date.now) {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashOpaqueToken(token),
    expiresAt: new Date(now() + CONFIRMATION_TOKEN_TTL_MS).toISOString(),
  };
}

export function getNewsletterTokenSecret(env = process.env) {
  const secret = env.NEWSLETTER_TOKEN_SECRET?.trim();
  if (!secret || secret.length < 32 || /^(?:your|example|placeholder|test)/i.test(secret)) {
    throw new Error('NEWSLETTER_TOKEN_SECRET must be a non-placeholder secret of at least 32 characters');
  }
  return secret;
}

function domainHmac(domain, parts, env) {
  const hmac = createHmac('sha256', getNewsletterTokenSecret(env));
  hmac.update(`cadencea-newsletter:${domain}:v1\0`, 'utf8');
  for (const part of parts) {
    const value = String(part);
    hmac.update(`${Buffer.byteLength(value, 'utf8')}:`, 'utf8');
    hmac.update(value, 'utf8');
    hmac.update('\0', 'utf8');
  }
  return hmac.digest('hex');
}

export function deriveUnsubscribeToken({ id, email, version }, env = process.env) {
  if (!id || !Number.isInteger(version) || version < 1) {
    throw new Error('Invalid unsubscribe token subject');
  }
  return domainHmac(
    'unsubscribe',
    [id, normalizeNewsletterEmail(email), version],
    env,
  );
}

export function deriveUnsubscribeTokenHash(subject, env = process.env) {
  return hashOpaqueToken(deriveUnsubscribeToken(subject, env));
}

export function getClientAddress(request) {
  for (const name of ['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-forwarded-for']) {
    const raw = request.headers.get(name);
    const first = raw?.split(',')[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  return 'unknown';
}

export function rateLimitKey(scope, value, env = process.env) {
  return domainHmac(`rate-limit:${scope}`, [value], env);
}

export function newsletterRateLimitChecks(request, email, env = process.env) {
  return [
    {
      key: rateLimitKey('ip', getClientAddress(request), env),
      limit: 20,
      windowSeconds: 60 * 60,
    },
    {
      key: rateLimitKey('email', normalizeNewsletterEmail(email), env),
      limit: 3,
      windowSeconds: 60 * 60,
    },
    {
      key: rateLimitKey('global', 'newsletter-subscribe', env),
      limit: 500,
      windowSeconds: 15 * 60,
    },
  ];
}

export function newsletterLookupRateLimitChecks(request, operation, env = process.env) {
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(operation)) {
    throw new Error('Invalid newsletter rate-limit operation');
  }
  return [
    {
      key: rateLimitKey(`ip:${operation}`, getClientAddress(request), env),
      limit: 120,
      windowSeconds: 60 * 60,
    },
    {
      key: rateLimitKey(`global:${operation}`, operation, env),
      limit: 2000,
      windowSeconds: 15 * 60,
    },
  ];
}

export async function consumeNewsletterRateLimits(serviceSupabase, checks) {
  for (const check of checks) {
    const { data, error } = await serviceSupabase.rpc(
      'consume_newsletter_rate_limit',
      {
        p_key_hash: check.key,
        p_limit: check.limit,
        p_window_seconds: check.windowSeconds,
      },
    );
    if (error) throw error;
    if (data !== true) {
      throw new NewsletterRequestError(
        'Too many newsletter requests. Please try again later.',
        429,
      );
    }
  }
}

export async function readBoundedBody(request, maxBytes = NEWSLETTER_BODY_LIMIT_BYTES) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new NewsletterRequestError('Request body is too large', 413);
  }
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new NewsletterRequestError('Request body is too large', 413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(body);
}

export async function readBoundedJson(request, maxBytes = NEWSLETTER_BODY_LIMIT_BYTES) {
  const raw = await readBoundedBody(request, maxBytes);
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new NewsletterRequestError('Invalid JSON request body');
  }
}

export async function readUnsubscribeToken(request) {
  const queryToken = new URL(request.url).searchParams.get('token');
  if (queryToken) return queryToken;

  const contentType = request.headers.get('content-type') || '';
  const raw = await readBoundedBody(request);
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw || '{}').token;
    } catch {
      throw new NewsletterRequestError('Invalid JSON request body');
    }
  }
  return new URLSearchParams(raw).get('token');
}

export function safeErrorCode(error) {
  const code = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : error instanceof Error
      ? error.name
      : 'UnknownError';
  return /^[A-Za-z0-9_.-]{1,64}$/.test(code) ? code : 'UnknownError';
}
