import React from 'react';
import Link from 'next/link';

/**
 * Stripe Checkout cancel landing page.
 *
 * Stripe redirects here when a user closes or cancels the hosted checkout
 * before completing payment. No charge has been made.
 */
export default function BillingCancelPage() {
  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          Checkout cancelled
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          No charge was made.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
          You cancelled checkout before completing your subscription. Your
          account has not been billed. You can return to the pricing page and
          try again whenever you&apos;re ready.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
          >
            Back to pricing
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-sm border border-ink px-6 text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
