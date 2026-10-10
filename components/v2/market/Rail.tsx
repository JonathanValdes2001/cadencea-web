import React, { useId } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight } from '@/components/ui/Icons';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import MarketCard from './MarketCard';

/** Which cards hide on smaller screens: 2 on mobile, 3 from md, 4 from lg. */
const VISIBILITY = ['', '', 'hidden md:block', 'hidden lg:block'];

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
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {listings.slice(0, 4).map((listing, index) => (
          <li key={listing.releaseId ?? listing.slug} className={VISIBILITY[index]}>
            <MarketCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  );
}
