/**
 * Browser client for the plugin licensing API (`/v1/access/*` on cadencea-api,
 * branch feat/access-licensing; contract: cadencea-access
 * `packages/protocol/src/api.ts`). Sends the current Supabase access token as a
 * Bearer token, like lib/api-client.ts, and maps the API's error envelope
 * `{ error: { code, message } }` to AccessApiError.
 *
 * The public store list is read on the server instead (lib/plugins/store-products.ts).
 */

import { supabase } from '../supabase/client';
import { accessApiOrigin } from './access-origin';

export const ACCESS_API_ORIGIN = accessApiOrigin({
  NEXT_PUBLIC_ACCESS_API_URL: process.env.NEXT_PUBLIC_ACCESS_API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

const TIMEOUT_MS = 15000;

/* Contract types ----------------------------------------------------------- */

export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended' | (string & {});
export type MachinePlatform = 'windows' | 'macos' | 'linux' | (string & {});

export interface Activation {
  id: string;
  licenseId: string;
  machineFingerprint: string;
  machineName: string;
  platform: MachinePlatform;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface License {
  id: string;
  productId: string;
  edition: string;
  kind: string;
  status: LicenseStatus;
  source: string;
  maxActivations: number;
  activations: Activation[];
  createdAt: string;
  startsAt: string | null;
  expiresAt: string | null;
  serialHint: string | null;
  parentLicenseId: string | null;
  subscription: unknown;
  maxMajor: number | null;
}

export interface Entitlements {
  serverTime: string;
  licenses: License[];
  trialsAvailable: unknown[];
}

/* Errors ------------------------------------------------------------------- */

/**
 * `code` is the API's contract code (`unauthorized`, `not_found`,
 * `serial_invalid`, …) or one of ours: `network` (no answer: offline, CORS, or
 * the API isn't deployed), `unavailable` (an answer that isn't the licensing
 * API, e.g. a 404 from an API without /v1/access) and `invalid_response`.
 */
export class AccessApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AccessApiError';
    this.code = code;
    this.status = status;
  }
}

/** Whether the failure means "the licensing service isn't there", not "you did something wrong". */
export function isServiceUnavailable(error: unknown): boolean {
  if (!(error instanceof AccessApiError)) return true;
  return ['network', 'unavailable', 'invalid_response', 'internal'].includes(error.code) || error.status >= 500;
}

/** A sentence for the page. The API's own messages are written for people, so they're shown as they are. */
export function accessErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof AccessApiError)) return fallback;
  switch (error.code) {
    case 'network':
    case 'unavailable':
    case 'invalid_response':
      return 'The plugin service isn’t reachable right now. Please try again later.';
    case 'internal':
      return 'The plugin service is unavailable right now. Please try again later.';
    case 'unauthorized':
      return 'Your session has expired. Sign in again.';
    case 'rate_limited':
      return 'Too many attempts. Wait a minute and try again.';
    default:
      return error.message || fallback;
  }
}

/* Requests ----------------------------------------------------------------- */

async function accessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function accessFetch<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const token = await accessToken();
  if (!token) throw new AccessApiError('unauthorized', 'Sign in to continue.', 401);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  init.signal?.addEventListener('abort', onAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(`${ACCESS_API_ORIGIN}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new AccessApiError('network', 'The plugin service didn’t answer.', 0);
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', onAbort);
  }

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  if ((response.headers.get('content-type') || '').includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const envelope = data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined;
    if (envelope && typeof envelope === 'object') {
      const { code, message } = envelope as { code?: unknown; message?: unknown };
      if (typeof code === 'string') {
        throw new AccessApiError(code, typeof message === 'string' ? message : '', response.status);
      }
    }
    // No contract envelope: not the licensing API (yet).
    throw new AccessApiError(response.status === 429 ? 'rate_limited' : 'unavailable', `Request failed with status ${response.status}`, response.status);
  }
  if (data === null) throw new AccessApiError('invalid_response', 'The plugin service sent an unexpected answer.', response.status);
  return data as T;
}

function isLicense(value: unknown): value is License {
  if (!value || typeof value !== 'object') return false;
  const license = value as Partial<License>;
  return typeof license.id === 'string' && typeof license.productId === 'string' && Array.isArray(license.activations);
}

/** Licenses on this account, each with the computers holding its seats. */
export async function getEntitlements(signal?: AbortSignal): Promise<Entitlements> {
  const data = await accessFetch<Entitlements>('/v1/access/entitlements', { signal });
  if (!data || !Array.isArray(data.licenses) || !data.licenses.every(isLicense)) {
    throw new AccessApiError('invalid_response', 'The plugin service sent an unexpected answer.', 200);
  }
  return data;
}

/** Frees a seat. The computer stops using it the next time Cadencea Vault checks in. */
export async function deactivateActivation(activationId: string): Promise<void> {
  await accessFetch<void>(`/v1/access/activations/${encodeURIComponent(activationId)}`, { method: 'DELETE' });
}

/** "Get for free": adds a free product's license to the account. Idempotent. */
export async function claimFreeProduct(productId: string): Promise<License> {
  const data = await accessFetch<{ license: License }>(`/v1/access/products/${encodeURIComponent(productId)}/claim`, {
    method: 'POST',
  });
  if (!isLicense(data?.license)) throw new AccessApiError('invalid_response', 'The plugin service sent an unexpected answer.', 200);
  return data.license;
}

export async function redeemSerial(serial: string): Promise<License> {
  const data = await accessFetch<{ license: License }>('/v1/access/serials/redeem', {
    method: 'POST',
    body: { serial },
  });
  if (!isLicense(data?.license)) throw new AccessApiError('invalid_response', 'The plugin service sent an unexpected answer.', 200);
  return data.license;
}

/**
 * Starts a Stripe Checkout for paid plugins. Only product ids go to the API: it
 * prices them. Returns the hosted Checkout URL.
 */
export async function createPluginCheckout(productIds: readonly string[]): Promise<string> {
  const data = await accessFetch<{ url: string }>('/v1/access/checkout', { method: 'POST', body: { productIds } });
  return checkoutUrl(data);
}

/** Starts a Stripe Checkout for the All Plugins subscription. Returns the hosted Checkout URL. */
export async function createAllPluginsCheckout(): Promise<string> {
  const data = await accessFetch<{ url: string }>('/v1/access/checkout/all-plugins', { method: 'POST' });
  return checkoutUrl(data);
}

/** Only ever follow a redirect to Stripe's own hosted pages. */
export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'checkout.stripe.com' || url.hostname.endsWith('.stripe.com'));
  } catch {
    return false;
  }
}

function checkoutUrl(data: { url?: unknown } | undefined): string {
  if (!isStripeCheckoutUrl(data?.url)) {
    throw new AccessApiError('invalid_response', 'The plugin service sent an unexpected answer.', 200);
  }
  return data.url;
}

/** Licenses that are in force now: the ones that make a product "yours". */
export function activeLicenseFor(licenses: readonly License[], productId: string): License | undefined {
  return licenses.find((license) => license.productId === productId && license.status === 'active');
}
