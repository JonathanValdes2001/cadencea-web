'use client';

import React, { useMemo } from 'react';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { CATEGORIES } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { CATEGORY_TINT } from '@/lib/v2-demo/market/browse';
import { MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { sortItems } from '@/lib/v2-demo/market/queries';
import CategoryNav from './CategoryNav';
import MarketCard from './MarketCard';
import Rail, { railListClass } from './Rail';
import { useMarketListings } from './useMarketListings';

/**
 * The browsing half of /market (WEB-V2-SPEC §4.2): category nav, the three
 * editorial picks and one rail per category, newest first. Client-side because
 * Studio demo approvals change what is on sale.
 */
export default function MarketLanding() {
  const listings = useMarketListings();
  const onSale = useMemo(() => sortItems(listings.filter((l) => l.isPublic), 'new'), [listings]);
  // Editorial picks keep the seed's order rather than the newest-first order of the rails.
  const featured = listings.filter((l) => l.featured && l.isPublic).slice(0, 3);

  return (
    <>
      <CategoryNav current="all" />
      <Container className="space-y-12 py-12 lg:space-y-16 lg:py-16">
        {featured.length > 0 && (
          <section aria-labelledby="market-featured">
            <SectionHeader size="sm" title={<span id="market-featured">{MARKET_HOME_COPY.featuredTitle}</span>} />
            <ul className={`mt-5 ${railListClass({ featured: true })}`}>
              {featured.map((listing) => (
                <li key={listing.slug} className="snap-start">
                  <MarketCard listing={listing} featured />
                </li>
              ))}
            </ul>
          </section>
        )}
        {CATEGORIES.map((category) => {
          const items = onSale.filter((l) => l.category === category.key);
          return (
            <Rail
              key={category.key}
              title={category.label}
              subtitle={category.description}
              listings={items}
              tint={CATEGORY_TINT[category.key].solid}
              seeAll={{ href: `/market/${category.key}`, label: fill(MARKET_HOME_COPY.seeAll, { n: items.length }) }}
            />
          );
        })}
      </Container>
    </>
  );
}
