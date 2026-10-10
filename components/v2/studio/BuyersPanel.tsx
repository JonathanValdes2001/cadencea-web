import React from 'react';
import { cardSellerEarnsEurCents, sellerEarnsEurCents } from '@/lib/v2-demo/credits/config';
import { formatEurCents } from '@/lib/v2-demo/format';
import type { Release, ReleasePayload } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

/** Seller earnings for one sale of the live version (CREDITS-MODEL §6.2, §7), in euro cents. */
function earningsPerSale(payload: ReleasePayload): number {
  if (payload.kind === 'beat') {
    // Leases are priced per tier; the demo counts every sale at the first enabled tier.
    const tier = payload.tiers.find((t) => t.enabled);
    return tier ? cardSellerEarnsEurCents(tier.price.amountMinor) : 0;
  }
  const price = payload.price;
  if (price.kind === 'credits') return sellerEarnsEurCents(price.credits);
  if (price.kind === 'card') return cardSellerEarnsEurCents(price.amount.amountMinor);
  return 0;
}

/** Demo numbers for the buyers and listeners panel (RL §6.3), labelled as fictional. */
export default function BuyersPanel({ release, payload }: { release: Release; payload: ReleasePayload | null }) {
  const stats = release.demoStats;
  const owners = stats?.ownersByVersion ? Object.entries(stats.ownersByVersion) : [];
  return (
    <section aria-labelledby="buyers-heading" className="rounded-md border border-line p-4">
      <h2 id="buyers-heading" className="text-base font-semibold text-ink">
        {DETAIL_UI.buyers}
      </h2>
      <p className="mt-0.5 text-xs text-ink-subtle">{DETAIL_UI.fictional}</p>
      {stats && payload ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {stats.sales !== undefined && (
            <div>
              <dt className="text-ink-subtle">{DETAIL_UI.sales}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{stats.sales}</dd>
            </div>
          )}
          {stats.sales !== undefined && (
            <div>
              <dt className="text-ink-subtle">{DETAIL_UI.earnings}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatEurCents(stats.sales * earningsPerSale(payload))}</dd>
            </div>
          )}
          {owners.length > 0 && (
            <div className="col-span-2">
              <dt className="text-ink-subtle">{DETAIL_UI.ownersByVersion}</dt>
              <dd className="tabular-nums text-ink">{owners.map(([v, count]) => `v${v} · ${count}`).join(', ')}</dd>
            </div>
          )}
          {stats.playsThisMonth !== undefined && (
            <div className="col-span-2">
              <dt className="text-ink-subtle">{DETAIL_UI.playsThisMonth}</dt>
              <dd className="tabular-nums text-ink">{stats.playsThisMonth.toLocaleString('en-US')}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{DETAIL_UI.noNumbers}</p>
      )}
    </section>
  );
}
