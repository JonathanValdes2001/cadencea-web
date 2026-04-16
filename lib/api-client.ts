/**
 * Authenticated API client for cadencea-api (FastAPI backend).
 *
 * Injects the current Supabase JWT as a Bearer token on every request so
 * the backend `get_current_user` dependency can validate the caller.
 *
 * Base URL comes from NEXT_PUBLIC_API_URL and is expected to already include
 * the `/api` suffix (e.g. http://localhost:8001/api, https://api.cadencea.app/api).
 * All paths passed to this client should be relative (e.g. '/billing/plans').
 */

import { supabase } from './supabase';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    console.warn('[api-client] Failed to read Supabase session:', err);
  }
  return {};
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...((init.headers as Record<string, string>) || {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0
    );
  }

  let data: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      // fall through with null data
    }
  }

  if (!response.ok) {
    const detail =
      (data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : null) || `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};

// Typed helpers for the billing endpoints used by the web app.

export interface BillingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  storage_gb: number;
  max_devices: number;
  features: string[];
  stripe_price_monthly?: string;
  stripe_price_annual?: string;
}

export interface BillingPlansResponse {
  plans: BillingPlan[];
  stripe_configured: boolean;
}

export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface SubscriptionStatusResponse {
  plan: string;
  status: string;
  current_period_end: string | null;
  storage_quota_bytes: number;
  storage_used_bytes: number;
  max_devices: number;
  stripe_customer_id: string | null;
}
