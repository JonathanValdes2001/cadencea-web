import React from 'react';
import CoverArt from '@/components/ui/CoverArt';
import { Diamond } from '@/components/ui/Icons';
import { RELEASE_TYPE_LABEL } from '@/lib/v2-demo/categories';
import { creditsToEurCents, formatEurCents } from '@/lib/v2-demo/format';
import { creditPrice } from '@/lib/v2-demo/market/display';
import { SEED_LISTINGS } from '@/lib/v2-demo/market/resolve';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/** The editorial picks first, then one listing of each type they don't cover, from the static seed. */
function mosaicListings(): MarketListing[] {
  const onSale = SEED_LISTINGS.filter((l) => l.isPublic);
  const picks = onSale.filter((l) => l.featured).slice(0, 3);
  for (const listing of onSale) {
    if (picks.length >= 6) break;
    if (!picks.some((p) => p.type === listing.type)) picks.push(listing);
  }
  for (const listing of onSale) {
    if (picks.length >= 6) break;
    if (!picks.includes(listing)) picks.push(listing);
  }
  return picks.slice(0, 6);
}

function Label({ listing }: { listing: MarketListing }) {
  const credits = creditPrice(listing.price);
  return (
    <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-sm bg-black/45 px-2 py-1.5 backdrop-blur-sm">
      <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-dark-text">
        {RELEASE_TYPE_LABEL[listing.type]}
      </span>
      {credits !== null && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-brand-100">
          <Diamond size={16} className="h-3 w-3 text-brand-300" />
          {credits} credits ({formatEurCents(creditsToEurCents(credits))})
        </span>
      )}
    </span>
  );
}

/**
 * A tilted mosaic of generated Market covers for the /market hero (WEB-V2-SPEC
 * §4.2). Inline SVG from the static seed, so it fetches nothing and passes the
 * CSP. A picture, not navigation: the same listings are linked just below.
 */
export default function CoverMosaic({ className = '', label = true }: { className?: string; label?: boolean }) {
  const [hero, ...rest] = mosaicListings();
  if (!hero) return null;
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      <div className="grid -rotate-3 grid-cols-3 gap-3">
        <div className="relative col-span-2 row-span-2 overflow-hidden rounded-md shadow-brand-glow ring-1 ring-white/10">
          <CoverArt seed={hero.coverSeed} kind={hero.type} palette={hero.cover.palette} motif={hero.cover.motif} decorative rounded="none" />
          {label && <Label listing={hero} />}
        </div>
        {rest.map((listing) => (
          <div key={listing.slug} className="relative overflow-hidden rounded-md shadow-brand-glow ring-1 ring-white/10">
            <CoverArt
              seed={listing.coverSeed}
              kind={listing.type}
              palette={listing.cover.palette}
              motif={listing.cover.motif}
              decorative
              rounded="none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
