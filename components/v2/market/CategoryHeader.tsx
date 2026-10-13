import React from 'react';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import type { CategoryKey } from '@/lib/v2-demo/categories';
import { CATEGORY_TINT } from '@/lib/v2-demo/market/browse';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import Breadcrumb from './Breadcrumb';

const FAN = [
  { left: '0%', rotate: -8, z: 1 },
  { left: '24%', rotate: 0, z: 3 },
  { left: '48%', rotate: 8, z: 2 },
] as const;

/** Three of the category's covers, fanned out: a picture of what's inside, not navigation (the grid links them). */
function CoverFan({ covers, className = '' }: { covers: readonly MarketListing[]; className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-52 w-80 shrink-0 ${className}`}>
      {covers.slice(0, FAN.length).map((listing, i) => (
        <div
          key={listing.releaseId ?? listing.slug}
          style={{ left: FAN[i].left, zIndex: FAN[i].z, transform: `translateY(-50%) rotate(${FAN[i].rotate}deg)` }}
          className="absolute top-1/2 w-40 overflow-hidden rounded-md shadow-brand-glow ring-1 ring-white/15"
        >
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
  );
}

/**
 * The header band of a category view and of "All results" (WEB-V2-SPEC §4.3):
 * the /market hero's showroom surface, smaller, lit in the category's tint.
 * Breadcrumb "Market / {Category}", the H1 and lead, the search box, and a fan
 * of the category's covers from lg. The category nav strip follows it.
 */
export default function CategoryHeader({
  title,
  lead,
  tint,
  search,
  covers = [],
}: {
  title: string;
  lead: string;
  tint: CategoryKey | 'all';
  search?: React.ReactNode;
  covers?: readonly MarketListing[];
}) {
  const { glow } = CATEGORY_TINT[tint];
  return (
    <header className="on-dark relative isolate overflow-hidden bg-showroom text-dark-text">
      <ShowroomGlow />
      <div
        aria-hidden="true"
        style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }}
        className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[30rem] w-[44rem] -translate-y-1/2 rounded-full blur-3xl"
      />
      <Container className="flex items-center justify-between gap-12 py-8 md:py-10 lg:py-12">
        <div className="min-w-0 max-w-2xl flex-1">
          <Breadcrumb onDark trail={[{ label: ITEM_COPY.market, href: '/market' }, { label: title }]} />
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-dark-muted sm:text-base">{lead}</p>
          {search && <div className="mt-6 max-w-xl">{search}</div>}
        </div>
        {covers.length >= FAN.length && <CoverFan covers={covers} className="mr-4 hidden lg:block" />}
      </Container>
    </header>
  );
}
