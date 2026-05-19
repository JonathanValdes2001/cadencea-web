'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type SubscriptionStatusResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

/**
 * Stripe Checkout success landing page.
 *
 * Stripe redirects here after a completed payment. We poll
 * /billing/subscription-status a few times because the webhook that upgrades
 * the user's plan runs asynchronously and may lag the redirect.
 */
export default function BillingSuccessPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    const poll = async () => {
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        try {
          const res = await api.get<SubscriptionStatusResponse>(
            '/billing/subscription-status'
          );
          if (cancelled) return;
          setStatus(res);
          if (res.plan && res.plan !== 'free') {
            setChecking(false);
            return;
          }
        } catch (err) {
          console.warn('[billing/success] status poll failed:', err);
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setChecking(false);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const planName = status?.plan
    ? status.plan.charAt(0).toUpperCase() + status.plan.slice(1)
    : null;

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          Payment confirmed
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Welcome to Cadencea{planName && planName !== 'Free' ? ` ${planName}` : ''}.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
          Thank you for subscribing. Your new plan is being activated — this
          usually takes just a few seconds. A receipt will arrive in your
          inbox shortly.
        </p>

        {checking && (
          <p className="mt-6 text-sm text-ink-subtle">
            Activating your plan…
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account/subscription"
            className="inline-flex h-11 items-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
          >
            View my subscription
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-sm border border-ink px-6 text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
