const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'token_hash',
  'code',
  'export_code',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'credential',
  'password',
  'secret',
  'sig',
  'signature',
  'api_key',
  'key',
  'session_id',
  'email',
]);

function isSensitiveQueryKey(key) {
  const normalized = key.toLowerCase();
  return SENSITIVE_QUERY_KEYS.has(normalized) ||
    normalized.startsWith('x-amz-') ||
    normalized.startsWith('x-bz-') ||
    normalized.startsWith('x-goog-') ||
    /(?:^|[-_])(?:token|secret|password|signature|credential|authorization|api[-_]?key)$/.test(normalized);
}

function sanitizeAbsoluteUrl(value) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (isSensitiveQueryKey(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

export function sanitizeTelemetryUrl(value) {
  if (typeof value !== 'string') return value;
  const exact = /^https?:\/\/[^\s<>"']+$/i.test(value)
    ? sanitizeAbsoluteUrl(value)
    : value.replace(/https?:\/\/[^\s<>"']+/gi, (candidate) => {
      const trailing = /[),.;]+$/.exec(candidate)?.[0] || '';
      const url = trailing ? candidate.slice(0, -trailing.length) : candidate;
      return `${sanitizeAbsoluteUrl(url)}${trailing}`;
    });
  return exact.replace(/([?&])([^=&#\s]+)=([^&#\s]*)/g, (match, prefix, key) =>
    isSensitiveQueryKey(key) ? `${prefix}${key}=[REDACTED]` : match,
  );
}

function isSensitiveHeader(key) {
  const normalized = key.toLowerCase();
  return /^(?:authorization|cookie|set-cookie|x-cadencea-export-code|x-api-key|credential|password|secret|sig|signature)$/.test(normalized) ||
    normalized.startsWith('x-amz-') ||
    normalized.startsWith('x-bz-') ||
    normalized.startsWith('x-goog-');
}

export function scrubSentryEvent(event) {
  if (!event || typeof event !== 'object') return event;
  event.message = sanitizeTelemetryUrl(event.message);
  if (event.request && typeof event.request === 'object') {
    event.request.url = sanitizeTelemetryUrl(event.request.url);
    event.request.query_string = sanitizeTelemetryUrl(event.request.query_string);
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers && typeof event.request.headers === 'object') {
      for (const key of Object.keys(event.request.headers)) {
        if (isSensitiveHeader(key)) {
          delete event.request.headers[key];
        }
      }
    }
  }
  if (event.user && typeof event.user === 'object') {
    event.user = event.user.id ? { id: String(event.user.id) } : undefined;
  }
  if (Array.isArray(event.breadcrumbs)) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb && typeof breadcrumb === 'object') {
        breadcrumb.message = sanitizeTelemetryUrl(breadcrumb.message);
        if (breadcrumb.data && typeof breadcrumb.data === 'object') {
          for (const key of ['url', 'from', 'to']) {
            breadcrumb.data[key] = sanitizeTelemetryUrl(breadcrumb.data[key]);
          }
        }
      }
    }
  }
  if (Array.isArray(event.exception?.values)) {
    for (const exception of event.exception.values) {
      if (!exception || typeof exception !== 'object') continue;
      exception.value = sanitizeTelemetryUrl(exception.value);
      const frames = exception.stacktrace?.frames;
      if (Array.isArray(frames)) {
        for (const frame of frames) {
          if (!frame || typeof frame !== 'object') continue;
          frame.filename = sanitizeTelemetryUrl(frame.filename);
          frame.abs_path = sanitizeTelemetryUrl(frame.abs_path);
        }
      }
    }
  }
  if (event.logentry && typeof event.logentry === 'object') {
    event.logentry.message = sanitizeTelemetryUrl(event.logentry.message);
    event.logentry.formatted = sanitizeTelemetryUrl(event.logentry.formatted);
  }
  return event;
}

export function sentryTraceSampleRate(env = process.env) {
  const raw = env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.1;
}

export function privacySafeSentryOptions(dsn, env = process.env) {
  return {
    dsn: dsn || undefined,
    tracesSampleRate: sentryTraceSampleRate(env),
    enableLogs: false,
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
  };
}
