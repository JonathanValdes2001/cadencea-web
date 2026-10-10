import React from 'react';
import { fill } from '@/lib/v2-demo/format';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import { sellerName } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/** The pack's split terms, shown before anyone can get it (WEB-V2-SPEC §4.4, RELEASE-LIFECYCLE §3.4). */
export default function SplitTermsPanel({ listing }: { listing: MarketListing }) {
  const terms = listing.splitTerms;
  if (!terms) return null;
  return (
    <div className="rounded-md border border-tone-warning bg-tone-warning-bg p-4">
      <h3 className="text-sm font-semibold text-ink">{ITEM_COPY.splitTermsTitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {fill(ITEM_COPY.splitTermsBody, {
          seller: sellerName(listing.sellerHandle),
          publishing: terms.publishingSharePct,
          advance: terms.advanceSharePct,
          creditLine: terms.creditLine,
        })}
      </p>
    </div>
  );
}
