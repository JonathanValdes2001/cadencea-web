import React from 'react';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import MarketCard from './MarketCard';

const COLUMNS = {
  /** WEB-V2-SPEC §3.6: the full-width Market grid. */
  full: 'md:grid-cols-3 lg:grid-cols-4',
  /** Beside the filter sidebar, which takes 16rem from lg. */
  withSidebar: 'md:grid-cols-3 xl:grid-cols-4',
} as const;

/** A responsive grid of MarketCards. */
export default function MarketGrid({
  listings,
  layout = 'full',
  headingLevel = 'h3',
  className = '',
}: {
  listings: readonly MarketListing[];
  layout?: keyof typeof COLUMNS;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <ul className={`grid grid-cols-2 gap-4 sm:gap-6 ${COLUMNS[layout]} ${className}`}>
      {listings.map((listing) => (
        <li key={listing.releaseId ?? listing.slug}>
          <MarketCard listing={listing} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
