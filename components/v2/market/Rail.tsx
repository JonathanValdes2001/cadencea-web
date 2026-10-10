import React, { useId } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight } from '@/components/ui/Icons';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import MarketCard from './MarketCard';

/** Phones scroll all four sideways; md shows three in a row and lg four. */
const VISIBILITY = ['', '', '', 'md:hidden lg:block'];

/**
 * Below md a rail is a sideways strip of cards that snaps, bleeding to the page
 * edge, so eight rails don't stack into a page ten screens long; from md it's a
 * grid row (four columns from lg, or three for the larger featured cards).
 */
export function railListClass({ featured = false }: { featured?: boolean } = {}): string {
  const strip = featured ? 'auto-cols-[72%] sm:auto-cols-[46%]' : 'auto-cols-[58%] sm:auto-cols-[40%]';
  const columns = featured ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4';
  return `scrollbar-none scroll-fade-x -mx-6 grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto scroll-px-6 px-6 pb-1 ${strip} md:mx-0 md:grid-flow-row md:auto-cols-auto md:gap-6 md:overflow-visible md:px-0 md:pb-0 md:[mask-image:none] ${columns}`;
}

/** A titled row of up to four cards with an optional "See all" link (WEB-V2-SPEC §4.2, §4.4). */
export default function Rail({
  title,
  subtitle,
  listings,
  seeAll,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  listings: readonly MarketListing[];
  seeAll?: { href: string; label: string };
  className?: string;
}) {
  const headingId = useId();
  if (!listings.length) return null;
  return (
    <section aria-labelledby={headingId} className={className}>
      <SectionHeader
        size="sm"
        title={<span id={headingId}>{title}</span>}
        subtitle={subtitle}
        action={
          seeAll && (
            <Link
              href={seeAll.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-ink hover:text-accent-hover"
            >
              {seeAll.label}
              <ArrowRight size={16} />
            </Link>
          )
        }
      />
      <ul className={`mt-5 ${railListClass()}`}>
        {listings.slice(0, 4).map((listing, index) => (
          <li key={listing.releaseId ?? listing.slug} className={`snap-start ${VISIBILITY[index]}`}>
            <MarketCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  );
}
