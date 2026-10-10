'use client';

import React, { useMemo } from 'react';
import Container from '@/components/ui/Container';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import { CATEGORIES, type CategoryKey } from '@/lib/v2-demo/categories';
import { CATEGORY_NAV_LABEL, MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { useMarketListings } from './useMarketListings';

/**
 * All · Samples · Splits · Presets · MIDI · Beats · Songs · Themes, each with
 * the number of listings on sale (WEB-V2-SPEC §4.2). Sticky under the navbar
 * from md.
 */
export default function CategoryNav({ current }: { current: CategoryKey | 'all' }) {
  const listings = useMarketListings();
  const items = useMemo<TabItem[]>(() => {
    const onSale = listings.filter((l) => l.isPublic);
    return [
      { id: 'all', label: MARKET_HOME_COPY.allLabel, count: onSale.length, href: '/market' },
      ...CATEGORIES.map((c) => ({
        id: c.key,
        label: CATEGORY_NAV_LABEL[c.key],
        count: onSale.filter((l) => l.category === c.key).length,
        href: `/market/${c.key}`,
      })),
    ];
  }, [listings]);

  return (
    <div className="z-30 bg-canvas md:sticky md:top-16">
      <Container>
        <Tabs items={items} value={current} label={MARKET_HOME_COPY.categoryNavLabel} />
      </Container>
    </div>
  );
}
