/**
 * Where the plugin licensing API (`/v1/access/*`) lives.
 *
 * The licensing API is mounted at the API ROOT (https://api.cadencea.app/v1/access/…),
 * not under `/api` like the billing and account endpoints that lib/api-client.ts
 * calls. So the origin is, in order:
 *   1. NEXT_PUBLIC_ACCESS_API_URL, when set to an http(s) URL;
 *   2. NEXT_PUBLIC_API_URL with a trailing `/api` removed;
 *   3. https://api.cadencea.app.
 *
 * Pure and dependency-free so tests/plugins-store.test.mjs can import it.
 * Callers in the browser must pass the variables as literal
 * `process.env.NEXT_PUBLIC_…` reads (see lib/plugins/access-client.ts): Next only
 * inlines public variables it can see written out.
 */

export const DEFAULT_ACCESS_API_ORIGIN = 'https://api.cadencea.app';

export interface AccessOriginEnv {
  NEXT_PUBLIC_ACCESS_API_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
}

/** An http(s) URL without its query, hash or trailing slashes; null when unusable. */
function normalizeBase(value: string | undefined): string | null {
  const text = (value ?? '').trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path}`;
}

export function accessApiOrigin(env: AccessOriginEnv): string {
  const explicit = normalizeBase(env.NEXT_PUBLIC_ACCESS_API_URL);
  if (explicit) return explicit;
  const api = normalizeBase(env.NEXT_PUBLIC_API_URL);
  if (api) return api.replace(/\/api$/i, '');
  return DEFAULT_ACCESS_API_ORIGIN;
}
