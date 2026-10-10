import React from 'react';
import { Alert } from '@/components/ui/Icons';
import { suggestedTopUpEurCents } from '@/lib/v2-demo/credits/wallet';
import { fill } from '@/lib/v2-demo/format';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { PERSONA } from '@/lib/v2-demo/sellers';

/** Maya is Nightjar (DECISIONS.md D1), so Nightjar's listings are her own. */
export function isOwnListing(listing: MarketListing): boolean {
  return listing.sellerHandle === PERSONA.sellerHandle;
}

/**
 * "Demo only: the real Market doesn't let you buy your own release…" (DECISIONS.md D12).
 * Render it only when `isOwnListing`, so other buy dialogs get no empty body.
 */
export function OwnListingNote() {
  return (
    <p className="flex gap-2 rounded-sm bg-tone-info-bg px-3 py-2 text-sm text-tone-info">
      <Alert size={16} className="mt-0.5 shrink-0" />
      {ITEM_COPY.ownListing}
    </p>
  );
}

/** "Checkout suggests the smallest top-up that covers it: €15." (CREDITS-MODEL §4). */
export function TopUpHint({ shortfall }: { shortfall: number }) {
  const cents = suggestedTopUpEurCents(shortfall);
  return (
    <p className="mt-2 text-sm text-ink-muted">
      {cents === null ? ITEM_COPY.topUpSteps : fill(ITEM_COPY.topUpSuggestion, { amount: cents / 100 })}
    </p>
  );
}
