import React from 'react';
import Link from 'next/link';

export default function Cart() {
  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Checkout
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Shopping cart.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Your selected items and purchases.
          </p>
        </header>

        {/* Empty state */}
        <section className="rounded-md border border-line bg-canvas p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Your cart is empty.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-muted">
            Browse our effects and software to start building your audio
            toolkit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/software"
              className="inline-flex h-12 items-center rounded-sm bg-accent px-8 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
            >
              Browse software
            </Link>
            <Link
              href="/cadenceavault"
              className="inline-flex h-12 items-center rounded-sm border border-ink px-8 text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
            >
              Download Vault
            </Link>
          </div>
        </section>

        {/* Summary */}
        <section className="mt-8 rounded-md border border-line bg-canvas">
          <header className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
              Order summary
            </h2>
          </header>
          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between px-6 py-3 text-sm">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="font-medium text-ink">$0.00</dd>
            </div>
            <div className="flex items-center justify-between px-6 py-3 text-sm">
              <dt className="text-ink-muted">Tax</dt>
              <dd className="font-medium text-ink">$0.00</dd>
            </div>
            <div className="flex items-center justify-between px-6 py-4 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="text-lg font-bold text-ink">$0.00</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
