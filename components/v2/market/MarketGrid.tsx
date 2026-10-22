import React from 'react';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import MarketCard from './MarketCard';

/**
 * A responsive grid of MarketCards (WEB-V2-SPEC §3.6): the same columns as the
 * /market rails, so a card is the same size on the landing, in a category and
 * on a seller page.
 */
export default function MarketGrid({
  listings,
  headingLevel = 'h3',
  className = '',
}: {
  listings: readonly MarketListing[];
  headingLevel?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <ul className={`grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {listings.map((listing) => (
        <li key={listing.releaseId ?? listing.slug}>
          <MarketCard listing={listing} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
