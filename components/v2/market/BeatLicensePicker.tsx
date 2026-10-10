'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { ownedEntry } from '@/lib/v2-demo/credits/library-seed';
import { recordCardPurchase, useMarketLibrary } from '@/lib/v2-demo/credits/store';
import { fill, formatEurCents } from '@/lib/v2-demo/format';
import { ITEM_COPY, RESULT_COPY } from '@/lib/v2-demo/market/copy';
import { fromEurCents, leaseLabel, leaseRightsLine } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import type { LeaseTierId } from '@/lib/v2-demo/release-lifecycle/types';
import { isOwnListing, OwnListingNote } from './BuyNotes';
import OwnedPanel from './OwnedPanel';

const euros = (cents: number) => formatEurCents(cents, { trimZeros: true });

/**
 * Beats: one radio card per enabled lease tier, paid by card (WEB-V2-SPEC §4.4,
 * CREDITS-MODEL §6.2). The demo records the purchase and leaves the wallet as
 * it is; buying Exclusive here doesn't retire the beat.
 */
export default function BeatLicensePicker({ listing }: { listing: MarketListing }) {
  const toast = useToast();
  const library = useMarketLibrary();
  const [selected, setSelected] = useState<LeaseTierId | undefined>(listing.leaseTiers[0]?.tier);
  const [confirming, setConfirming] = useState(false);
  const owned = ownedEntry(library, listing.slug);
  const tier = listing.leaseTiers.find((t) => t.tier === selected) ?? listing.leaseTiers[0];
  const from = fromEurCents(listing.leaseTiers);

  if (owned) {
    return (
      <div className="space-y-4">
        <Price price={listing.price} fromEurCents={from ?? undefined} size="lg" />
        <OwnedPanel listing={listing} entry={owned} />
      </div>
    );
  }
  if (!tier) return null;

  const buy = () => {
    setConfirming(false);
    const result = recordCardPurchase({
      slug: listing.slug,
      title: listing.title,
      releaseId: listing.releaseId,
      version: listing.version,
      amount: { amountMinor: tier.priceEurCents, currency: 'EUR' },
      leaseTier: tier.tier,
    });
    toast.show(
      result.ok
        ? fill(ITEM_COPY.boughtToast, { title: `${leaseLabel(tier.tier)} · ${listing.title}` })
        : (RESULT_COPY[result.error] ?? RESULT_COPY.fallback),
    );
  };

  return (
    <div className="space-y-4">
      <Price price={listing.price} fromEurCents={from ?? undefined} size="lg" />
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{ITEM_COPY.beatsLegend}</legend>
        <div className="space-y-2">
          {listing.leaseTiers.map((option) => {
            const id = `lease-${option.tier}`;
            return (
              <label
                key={option.tier}
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-4 hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input
                  id={id}
                  type="radio"
                  name="lease-tier"
                  value={option.tier}
                  checked={option.tier === tier.tier}
                  onChange={() => setSelected(option.tier)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold text-ink">{leaseLabel(option.tier)}</span>
                    <span className="font-semibold tabular-nums text-ink">{euros(option.priceEurCents)}</span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">{leaseRightsLine(option.tier)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="text-sm text-ink-muted">{ITEM_COPY.beatsNote}</p>
      <Button fullWidth size="lg" onClick={() => setConfirming(true)}>
        {fill(ITEM_COPY.buyTier, { tier: leaseLabel(tier.tier), price: euros(tier.priceEurCents) })}
      </Button>
      <DemoConfirm
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={buy}
        title={fill(ITEM_COPY.buyTierTitle, { tier: leaseLabel(tier.tier), title: listing.title })}
        body={ITEM_COPY.cardBody}
        confirmLabel={ITEM_COPY.buyConfirm}
      >
        {isOwnListing(listing) && <OwnListingNote />}
      </DemoConfirm>
    </div>
  );
}
