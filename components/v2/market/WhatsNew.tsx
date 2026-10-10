import React from 'react';
import { Chevron } from '@/components/ui/Icons';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { PUBLIC_COPY } from '@/lib/v2-demo/release-lifecycle/copy';

/**
 * "What's new in version {n}" and the version history (WEB-V2-SPEC §4.4 item 8).
 * Only approved versions show; pending updates never do.
 */
export default function WhatsNew({ listing }: { listing: MarketListing }) {
  const history = [...listing.versions].reverse();
  return (
    <section aria-labelledby="whats-new" className="border-t border-line pt-8">
      <h2 id="whats-new" className="text-lg font-semibold tracking-tight text-ink">
        {fill(PUBLIC_COPY.whatsNew, { n: listing.version })}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{listing.whatsNew ?? ITEM_COPY.firstRelease}</p>
      {history.length > 1 && (
        <details className="group mt-4 rounded-md border border-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {ITEM_COPY.versionsSummary}
            <Chevron size={16} className="shrink-0 text-ink-subtle group-open:rotate-180" />
          </summary>
          <ol className="divide-y divide-line border-t border-line">
            {history.map((v) => (
              <li key={v.version} className="px-4 py-3">
                <p className="text-sm font-medium text-ink tabular-nums">
                  {fill(ITEM_COPY.versionLine, { n: v.version, date: formatDate(v.date) })}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{v.note}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
      <p className="mt-3 text-xs text-ink-subtle">{ITEM_COPY.versionsCaption}</p>
    </section>
  );
}
