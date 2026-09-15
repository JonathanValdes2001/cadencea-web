import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildExportDownloadAction,
  clearedExportLocation,
  parseExportDownloadLocation,
} from '../lib/export-download.mjs';
import {
  consumeNewsletterRateLimits,
  createConfirmationToken,
  deriveUnsubscribeToken,
  hashOpaqueToken,
  newsletterLookupRateLimitChecks,
  newsletterRateLimitChecks,
  normalizeNewsletterEmail,
  readBoundedBody,
} from '../lib/newsletter-security.mjs';
import {
  buildContentSecurityPolicy,
  STATIC_SECURITY_HEADERS,
} from '../lib/security-headers.mjs';
import {
  privacySafeSentryOptions,
  scrubSentryEvent,
} from '../lib/sentry-privacy.mjs';
import { scanText } from '../scripts/security-scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokenEnv = { [['NEWSLETTER', '_TOKEN_SECRET'].join('')]: 'a'.repeat(64) };

test('newsletter tokens are hashed, independently scoped, and expiring', () => {
  const confirmation = createConfirmationToken(() => 0);
  assert.match(confirmation.token, /^[a-f0-9]{64}$/);
  assert.notEqual(confirmation.token, confirmation.tokenHash);
  assert.equal(hashOpaqueToken(confirmation.token), confirmation.tokenHash);
  assert.equal(confirmation.expiresAt, new Date(24 * 60 * 60 * 1000).toISOString());

  const first = deriveUnsubscribeToken(
    { id: 'subscription-1', email: 'Listener@Example.com', version: 1 },
    tokenEnv,
  );
  const normalized = deriveUnsubscribeToken(
    { id: 'subscription-1', email: ' listener@example.com ', version: 1 },
    tokenEnv,
  );
  const rotated = deriveUnsubscribeToken(
    { id: 'subscription-1', email: 'listener@example.com', version: 2 },
    tokenEnv,
  );
  assert.equal(first, normalized);
  assert.notEqual(first, rotated);
  assert.equal(normalizeNewsletterEmail(' Listener@Example.COM '), 'listener@example.com');
});

test('newsletter request bodies are bounded even without Content-Length', async () => {
  const accepted = new Request('https://cadencea.app/api/newsletter/subscribe', {
    method: 'POST',
    body: '{}',
  });
  assert.equal(await readBoundedBody(accepted, 2), '{}');

  const rejected = new Request('https://cadencea.app/api/newsletter/subscribe', {
    method: 'POST',
    body: '123',
  });
  await assert.rejects(() => readBoundedBody(rejected, 2), /too large/i);
});

test('newsletter abuse controls generate opaque global, IP, and address keys', () => {
  const request = new Request('https://cadencea.app/api/newsletter/subscribe', {
    headers: { 'x-vercel-forwarded-for': '192.0.2.5' },
  });
  const checks = newsletterRateLimitChecks(request, 'listener@example.com', tokenEnv);
  assert.equal(checks.length, 3);
  assert.deepEqual(checks.map((check) => check.limit), [20, 3, 500]);
  assert.equal(new Set(checks.map((check) => check.key)).size, 3);
  for (const check of checks) assert.match(check.key, /^[a-f0-9]{64}$/);

  const confirmChecks = newsletterLookupRateLimitChecks(request, 'confirm', tokenEnv);
  const unsubscribeChecks = newsletterLookupRateLimitChecks(request, 'unsubscribe', tokenEnv);
  assert.equal(confirmChecks.length, 2);
  assert.equal(unsubscribeChecks.length, 2);
  assert.deepEqual(confirmChecks.map((check) => check.limit), [120, 2000]);
  assert.notDeepEqual(
    confirmChecks.map((check) => check.key),
    unsubscribeChecks.map((check) => check.key),
  );
});

test('database rate limiter fails closed when a quota is exhausted', async () => {
  const calls = [];
  const serviceSupabase = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: calls.length < 2, error: null };
    },
  };
  await assert.rejects(
    () => consumeNewsletterRateLimits(serviceSupabase, [
      { key: 'a'.repeat(64), limit: 10, windowSeconds: 60 },
      { key: 'b'.repeat(64), limit: 10, windowSeconds: 60 },
    ]),
    (error) => error.status === 429,
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].name, 'consume_newsletter_rate_limit');
});

test('unsubscribe GET cannot mutate state or accept an email credential', () => {
  const route = readFileSync(
    join(root, 'app', 'api', 'newsletter', 'unsubscribe', 'route.ts'),
    'utf8',
  );
  const getHandler = route.slice(route.indexOf('export async function GET'));
  assert.doesNotMatch(getHandler, /\.from\(['"]newsletter_subscriptions/);
  assert.doesNotMatch(getHandler, /consumeNewsletterRateLimits/);
  assert.doesNotMatch(route, /searchParams\.get\(['"]email/);
  assert.match(route, /type="hidden" name="token"/);
});

test('newsletter token lookups consume global and IP database quotas', () => {
  for (const routeName of ['confirm', 'unsubscribe']) {
    const route = readFileSync(
      join(root, 'app', 'api', 'newsletter', routeName, 'route.ts'),
      'utf8',
    );
    assert.match(route, /newsletterLookupRateLimitChecks/);
    assert.match(route, /consumeNewsletterRateLimits/);
  }
});

test('CSP uses a nonce and repository-wide security headers', () => {
  const nonce = Buffer.alloc(16, 1).toString('base64');
  const policy = buildContentSecurityPolicy(nonce, {
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  });
  assert.match(policy, new RegExp(`script-src[^;]*'nonce-${nonce}'`));
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /form-action 'self' https:\/\/api\.cadencea\.app/);
  assert.deepEqual(
    new Set(STATIC_SECURITY_HEADERS.map((header) => header.key)),
    new Set([
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-DNS-Prefetch-Control',
    ]),
  );
});

test('telemetry strips bearer material and direct user identifiers', () => {
  const marker = ['synthetic', 'credential', 'marker'].join('-');
  const signedStorageUrl =
    `https://storage.example.invalid/audio.wav?X-Amz-Credential=${marker}` +
    `&X-Amz-Signature=${marker}&x-bz-info-test=${marker}`;
  const event = scrubSentryEvent({
    message: `Storage request failed at ${signedStorageUrl}`,
    request: {
      url: `https://cadencea.app/api/newsletter/confirm?token=${marker}`,
      cookies: { session: 'secret' },
      data: { password: 'secret' },
      headers: {
        Authorization: 'Bearer synthetic',
        'X-Bz-Info-Test': marker,
        Signature: marker,
        'X-Goog-Credential': marker,
        Accept: 'application/json',
      },
    },
    user: { id: 'user-1', email: 'listener@example.com', ip_address: '192.0.2.1' },
    exception: {
      values: [{ value: `FetchError: ${signedStorageUrl}` }],
    },
  });
  assert.match(event.request.url, /token=(?:%5B)?\[?REDACTED/i);
  assert.equal(event.request.cookies, undefined);
  assert.equal(event.request.data, undefined);
  assert.equal(event.request.headers.Authorization, undefined);
  assert.equal(event.request.headers['X-Bz-Info-Test'], undefined);
  assert.equal(event.request.headers.Signature, undefined);
  assert.equal(event.request.headers['X-Goog-Credential'], undefined);
  assert.deepEqual(event.user, { id: 'user-1' });
  assert.equal(JSON.stringify(event).includes(marker), false);
  assert.match(event.message, /REDACTED/);
  assert.match(event.exception.values[0].value, /REDACTED/);

  const options = privacySafeSentryOptions('https://public@example.invalid/1', {
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: '0.2',
  });
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.enableLogs, false);
  assert.equal(options.tracesSampleRate, 0.2);

  for (const file of [
    'instrumentation-client.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
  ]) {
    const source = readFileSync(join(root, file), 'utf8');
    assert.doesNotMatch(source, /sendDefaultPii:\s*true|tracesSampleRate:\s*1/);
    assert.doesNotMatch(source, /dsn:\s*["']https:\/\//);
  }
});

test('export codes remain in fragments and are cleared before use', () => {
  const id = '0198a74c-1234-7abc-8def-1234567890ab';
  const code = 'a'.repeat(43);
  const href = `https://cadencea.app/export?export_id=${id}#export_code=${code}`;
  assert.deepEqual(parseExportDownloadLocation(href), {
    exportId: id,
    exportCode: code,
  });
  assert.equal(clearedExportLocation(href), `/export?export_id=${id}`);
  assert.equal(
    buildExportDownloadAction(id, 'https://api.cadencea.app/api'),
    `https://api.cadencea.app/api/auth/me/export/${id}/download`,
  );
  assert.equal(parseExportDownloadLocation(href.replace('#', '?')), null);
  assert.equal(parseExportDownloadLocation(`${href}&export_code=${code}`), null);
  assert.equal(parseExportDownloadLocation(
    `https://cadencea.app/export?export_id=${id}&export_id=${id}#export_code=${code}`,
  ), null);
  assert.equal(parseExportDownloadLocation(
    `https://cadencea.app/export?export_id=${id}&next=/account#export_code=${code}`,
  ), null);
  assert.equal(parseExportDownloadLocation(
    `https://cadencea.app/export?export_id=${id}#export_code=${code}&extra=1`,
  ), null);
  assert.equal(
    clearedExportLocation(`${href}&unexpected=1`),
    `/export?export_id=${id}`,
  );
  assert.throws(
    () => buildExportDownloadAction(id, 'https://api.cadencea.app/proxy'),
    /\/api base path/,
  );
});

test('Web owns no executable Supabase migration chain', () => {
  const migrationDirectory = join(root, 'supabase', 'migrations');
  const migrationFiles = existsSync(migrationDirectory)
    ? readdirSync(migrationDirectory)
    : [];
  assert.equal(
    migrationFiles.filter((name) => name.endsWith('.sql')).length,
    0,
  );
  const readme = readFileSync(join(root, 'supabase', 'README.md'), 'utf8');
  assert.match(readme, /cadencea-api\/supabase\/migrations/);
});

test('credential scanner reports labels without retaining values', () => {
  const source = [
    ['DATABASE', '_PASSWORD=', 'prod-value-94x7'].join(''),
    ['SUPABASE', '_SERVICE_ROLE_KEY=', 'eyJ-prod-value-71z9'].join(''),
  ].join('\n');
  const findings = scanText(source, 'fixture.env');
  assert.equal(findings.length, 2);
  assert.equal(JSON.stringify(findings).includes('prod-value'), false);
});
