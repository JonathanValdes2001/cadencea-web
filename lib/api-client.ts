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

  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
  } catch (err) {
    const aborted =
      err instanceof DOMException && err.name === 'AbortError';
    throw new ApiError(
      aborted
        ? `Request timed out after ${timeoutMs / 1000}s. Is the API server running?`
        : err instanceof Error
          ? err.message
          : 'Network error',
      0
    );
  } finally {
    clearTimeout(timeoutId);
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

  patch: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'PATCH',
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

export interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  created: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export interface InvoicesResponse {
  invoices: InvoiceSummary[];
}

// ============================================================================
// ADR-0038: Account deletion + data export
// ============================================================================

export interface AccountDeletionRequestResponse {
  status: string; // 'confirmation_pending'
  email_sent_to: string; // masked
  expires_in_minutes: number;
}

export interface AccountDeletionStatusResponse {
  deletion_status: 'active' | 'pending_deletion' | 'purging' | 'purged';
  deletion_requested_at: string | null;
  scheduled_purge_at: string | null;
  can_cancel: boolean;
}

export interface DataExportResponse {
  export_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  requested_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  download_url: string | null;
  bytes: number | null;
  error_message: string | null;
}

export const accountDeletion = {
  request: (reason?: string) =>
    api.post<AccountDeletionRequestResponse>('/auth/me/deletion-request', {
      reason: reason || undefined,
    }),
  /** Magic-link confirm — the token is the credential. The endpoint
   *  ignores the Authorization header even when the browser still has a
   *  session, so we don't need to strip it. */
  confirm: (token: string) =>
    api.post<AccountDeletionStatusResponse>('/auth/me/deletion-confirm', {
      token,
    }),
  cancel: () =>
    api.post<AccountDeletionStatusResponse>('/auth/me/deletion-cancel'),
  getStatus: () =>
    api.get<AccountDeletionStatusResponse>('/auth/me/deletion-status'),
};

export const dataExport = {
  request: () => api.post<DataExportResponse>('/auth/me/export'),
  get: (exportId: string) =>
    api.get<DataExportResponse>(`/auth/me/export/${exportId}`),
};
