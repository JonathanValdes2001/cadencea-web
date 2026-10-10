'use client';

import React, { useMemo, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import Tabs, { tabIds, type TabItem } from '@/components/ui/Tabs';
import { CATEGORIES } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { CATEGORY_NAV_LABEL, MARKET_HOME_COPY, SELLER_COPY } from '@/lib/v2-demo/market/copy';
import { itemsBySeller } from '@/lib/v2-demo/market/queries';
import MarketGrid from './MarketGrid';
import { useMarketListings } from './useMarketListings';

function useSellerListings(handle: string) {
  const listings = useMarketListings();
  return useMemo(() => itemsBySeller(handle, listings), [handle, listings]);
}

/** "{n} releases" in the seller header; it follows Studio demo changes for Nightjar. */
export function SellerReleaseCount({ handle }: { handle: string }) {
  const n = useSellerListings(handle).length;
  return <>{n === 1 ? SELLER_COPY.oneRelease : fill(SELLER_COPY.releases, { n })}</>;
}

/** The seller's listings, with pill tabs for All plus each category they sell in (WEB-V2-SPEC §4.5). */
export default function SellerCatalog({ handle }: { handle: string }) {
  const listings = useSellerListings(handle);
  const [tab, setTab] = useState('all');

  const items = useMemo<TabItem[]>(
    () => [
      { id: 'all', label: MARKET_HOME_COPY.allLabel, count: listings.length },
      ...CATEGORIES.map((c) => ({
        id: c.key,
        label: CATEGORY_NAV_LABEL[c.key],
        count: listings.filter((l) => l.category === c.key).length,
      })).filter((item) => item.count > 0),
    ],
    [listings],
  );
  const current = items.some((item) => item.id === tab) ? tab : 'all';
  const shown = current === 'all' ? listings : listings.filter((l) => l.category === current);
  const { tabId, panelId } = tabIds('seller', current);

  if (!listings.length) {
    return <EmptyState title={SELLER_COPY.emptyTitle} body={SELLER_COPY.emptyBody} />;
  }
  return (
    <div>
      <Tabs
        items={items}
        value={current}
        onChange={setTab}
        variant="pill"
        label={SELLER_COPY.tabsLabel}
        idPrefix="seller"
      />
      <div role="tabpanel" id={panelId} aria-labelledby={tabId} className="mt-8">
        <MarketGrid listings={shown} />
      </div>
    </div>
  );
}
