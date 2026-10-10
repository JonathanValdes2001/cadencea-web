'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { ownedEntry } from '@/lib/v2-demo/credits/library-seed';
import { useMarketLibrary } from '@/lib/v2-demo/credits/store';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import { creditPrice, fromEurCents, priceTerms } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/**
 * The buy box pinned to the bottom of the screen below lg (WEB-V2-SPEC §3.6):
 * the price and one button that brings the full buy box into view. It hides
 * while the buy box itself is on screen, and sits under the cookie banner.
 */
export default function MobileBuyBar({ listing, targetId }: { listing: MarketListing; targetId: string }) {
  const library = useMarketLibrary();
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const owned = ownedEntry(library, listing.slug) !== null;
  let label: string;
  if (listing.type === 'song') label = ITEM_COPY.listen;
  else if (owned) label = ITEM_COPY.barOwned;
  else if (listing.type === 'beat') label = ITEM_COPY.barChoose;
  else label = creditPrice(listing.price) === 0 ? ITEM_COPY.barGet : ITEM_COPY.barBuy;

  const goToBuyBox = () => {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  };

  const from = fromEurCents(listing.leaseTiers);
  return (
    <div
      aria-hidden={targetVisible || undefined}
      inert={targetVisible || undefined}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas shadow-dropdown transition-transform lg:hidden ${
        targetVisible ? 'translate-y-full' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Price
          price={listing.price}
          fromEurCents={from ?? undefined}
          splitTerms={priceTerms(listing)}
          size="sm"
          className="min-w-0"
        />
        {listing.type === 'song' ? (
          <Button href="/stream" size="md">
            {label}
          </Button>
        ) : (
          <Button size="md" onClick={goToBuyBox}>
            {label}
          </Button>
        )}
      </div>
    </div>
  );
}
