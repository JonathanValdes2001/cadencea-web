export const STATIC_SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

function configuredOrigin(value) {
  try {
    const url = new URL(value || '');
    if (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return url.origin;
    }
  } catch {
    // Invalid optional origins are excluded from policy rather than reflected.
  }
  return null;
}

export function buildContentSecurityPolicy(nonce, env = process.env) {
  if (!/^[A-Za-z0-9+/=]{20,64}$/.test(nonce)) {
    throw new Error('Invalid CSP nonce');
  }
  const isDevelopment = env.NODE_ENV !== 'production';
  const connectSources = new Set(["'self'"]);
  const formSources = new Set(["'self'"]);
  const supabaseOrigin = configuredOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  if (supabaseOrigin) {
    connectSources.add(supabaseOrigin);
    connectSources.add(supabaseOrigin.replace(/^https:/, 'wss:'));
  }
  const apiOrigin = configuredOrigin(
    env.NEXT_PUBLIC_API_URL || (isDevelopment
      ? 'http://localhost:8001/api'
      : 'https://api.cadencea.app/api'),
  );
  if (apiOrigin) {
    connectSources.add(apiOrigin);
    formSources.add(apiOrigin);
  }
  const sentryOrigin = configuredOrigin(env.NEXT_PUBLIC_SENTRY_DSN);
  if (sentryOrigin) connectSources.add(sentryOrigin);
  if (isDevelopment) {
    connectSources.add('http://localhost:*');
    connectSources.add('ws://localhost:*');
    connectSources.add('http://127.0.0.1:*');
    connectSources.add('ws://127.0.0.1:*');
  }

  const scriptSources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDevelopment) scriptSources.push("'unsafe-eval'");

  const directives = [
    "default-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.backblazeb2.com",
    "media-src 'self' blob: https://*.backblazeb2.com",
    `connect-src ${[...connectSources].join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    `form-action ${[...formSources].join(' ')}`,
    "frame-ancestors 'none'",
  ];
  if (!isDevelopment) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}
