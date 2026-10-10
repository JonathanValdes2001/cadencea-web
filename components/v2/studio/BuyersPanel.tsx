import React from 'react';
import { formatEurCents } from '@/lib/v2-demo/format';
import { demoEarnings } from '@/lib/v2-demo/release-lifecycle/earnings';
import type { Release, Revision } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

/** Demo numbers for the buyers and listeners panel (RL §6.3), labelled as fictional. */
export default function BuyersPanel({ release, revisions }: { release: Release; revisions: readonly Revision[] }) {
  const stats = release.demoStats;
  const approved = revisions.filter((r) => r.version !== null);
  // A song that was never sold for download has listeners, not buyers.
  const streamOnly =
    release.type === 'song' && approved.every((r) => r.payload.kind === 'song' && r.payload.price.kind === 'stream_only');
  const owners = !streamOnly && stats?.ownersByVersion ? Object.entries(stats.ownersByVersion) : [];
  const showSales = !streamOnly && stats?.sales !== undefined;
  const soldExclusive = release.unpublished?.cause === 'exclusive_sold';
  const hasNumbers = Boolean(stats && approved.length > 0 && (showSales || stats.playsThisMonth !== undefined));
  return (
    <section aria-labelledby="buyers-heading" className="rounded-md border border-line p-4">
      <h2 id="buyers-heading" className="text-base font-semibold text-ink">
        {DETAIL_UI.buyers}
      </h2>
      <p className="mt-0.5 text-xs text-ink-subtle">{DETAIL_UI.fictional}</p>
      {stats && hasNumbers ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {showSales && (
            <div>
              <dt className="text-ink-subtle">{DETAIL_UI.sales}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">
                {stats.sales}
                {soldExclusive && <span className="block text-xs font-normal text-ink-muted">{DETAIL_UI.plusExclusive}</span>}
              </dd>
            </div>
          )}
          {showSales && (
            <div>
              <dt className="text-ink-subtle">{DETAIL_UI.earnings}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatEurCents(demoEarnings(release, revisions))}</dd>
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
