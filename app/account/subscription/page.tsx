'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  api,
  ApiError,
  type InvoicesResponse,
  type InvoiceSummary,
  type PortalSessionResponse,
  type SubscriptionStatusResponse,
} from '@/lib/api-client';

const PLAN_COPY: Record<
  string,
  { name: string; tagline: string; priceMonthly: string }
> = {
  free: {
    name: 'Free',
    tagline: '5 GB cloud storage',
    priceMonthly: '€0',
  },
  basic: {
    name: 'Basic',
    tagline: '50 GB cloud storage',
    priceMonthly: '€4.99',
  },
  standard: {
    name: 'Standard',
    tagline: '250 GB cloud storage · Priority support',
    priceMonthly: '€14.99',
  },
  pro: {
    name: 'Pro',
    tagline: '500 GB cloud storage · Priority support',
    priceMonthly: '€24.99',
  },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatInvoiceDate(value: number | null): string {
  if (!value) return '—';
  try {
    return new Date(value * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatCurrency(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format((amountMinor || 0) / 100);
  } catch {
    return `${((amountMinor || 0) / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, exp);
  return `${value.toFixed(exp >= 3 ? 1 : 0)} ${units[exp]}`;
}

export default function Subscription() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/login?redirect=${encodeURIComponent('/account/subscription')}`
      );
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setInvoicesLoading(true);
    setInvoicesError(null);

    api
      .get<SubscriptionStatusResponse>('/billing/subscription-status')
      .then((res) => {
        if (!cancelled) setStatus(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load subscription details.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    api
      .get<InvoicesResponse>('/billing/invoices?limit=10')
      .then((res) => {
        if (!cancelled) setInvoices(res.invoices || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setInvoicesError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load invoices.'
        );
        setInvoices([]);
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const openPortal = async () => {
    setError(null);
    try {
      setPortalLoading(true);
      const res = await api.post<PortalSessionResponse>(
        '/billing/create-portal-session'
      );
      window.location.href = res.url;
    } catch (err) {
      setPortalLoading(false);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not open the billing portal. Please try again.'
      );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-sm text-ink-muted">
        Loading subscription…
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-sm text-ink">
        {error || 'Unable to load subscription details.'}
      </div>
    );
  }


  const planKey = (status.plan || 'free').toLowerCase();
  const copy = PLAN_COPY[planKey] || {
    name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
    tagline: '',
    priceMonthly: '',
  };
  const isPaid = planKey !== 'free';
  const usedBytes = status.storage_used_bytes || 0;
  const quotaBytes = status.storage_quota_bytes || 0;
  const usagePct =
    quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Subscription.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Manage your recurring subscriptions and billing.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="space-y-8">
          <section className="rounded-md border border-line bg-canvas">
            <header className="border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
                Current plan
              </h2>
            </header>
            <div className="px-6 py-6">
              <div className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-ink">
                    Cadencea {copy.name}
                  </h3>
                  {copy.tagline && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {copy.tagline}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Status: {status.status}
                  </p>
                </div>
                {copy.priceMonthly && (
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-bold tracking-tight text-ink">
                      {copy.priceMonthly}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-subtle">
                      per month
                    </p>
                  </div>
                )}
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    {isPaid ? 'Next billing date' : 'Plan renews'}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {isPaid ? formatDate(status.current_period_end) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Storage
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
                  </dd>
                  <div className="mt-2 h-1.5 w-full rounded-sm bg-elevated">
                    <div
                      className="h-full rounded-sm bg-accent"
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex h-10 items-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
                >
                  Upgrade plan
                </Link>
                {isPaid && (
                  <button
                    type="button"
                    onClick={openPortal}
                    disabled={portalLoading}
                    aria-busy={portalLoading}
                    className="inline-flex h-10 items-center rounded-sm border border-ink px-6 text-sm font-semibold tracking-wide text-ink hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {portalLoading ? 'Opening portal…' : 'Cancel plan'}
                  </button>
                )}
              </div>

              {isPaid && (
                <p className="mt-6 text-xs text-ink-subtle">
                  Cancellation, payment methods, and invoices are handled
                  securely through the Stripe customer portal.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-line bg-canvas">
            <header className="border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
                Recent invoices
              </h2>
            </header>
            <div className="px-6 py-6">
              {invoicesLoading ? (
                <p className="text-sm text-ink-muted">Loading invoices…</p>
              ) : invoicesError ? (
                <p className="text-sm text-ink-muted">{invoicesError}</p>
              ) : !invoices || invoices.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No invoices yet. Subscription payment history will appear here
                  once you upgrade to a paid plan.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {invoices.map((inv) => {
                    const amount =
                      inv.amount_paid && inv.amount_paid > 0
                        ? inv.amount_paid
                        : inv.amount_due;
                    return (
                      <li
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {inv.number || inv.id}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {formatInvoiceDate(inv.created)}
                            {inv.status ? ` · ${inv.status}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-ink">
                            {formatCurrency(amount, inv.currency)}
                          </p>
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-accent hover:text-accent-hover"
                            >
                              View
                            </a>
                          )}
                          {inv.invoice_pdf && (
                            <a
                              href={inv.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-ink-muted hover:text-ink"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
