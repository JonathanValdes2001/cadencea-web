'use client';

import { useMemo } from 'react';
import { useCurrentReleases, usePublicReleases } from '@/lib/v2-demo/release-lifecycle/public';
import { LINKED_RELEASE_IDS } from '@/lib/v2-demo/market/linked';
import { buildListings } from '@/lib/v2-demo/market/resolve';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/**
 * Every Market listing with the lifecycle store applied (WEB-V2-SPEC §4.2,
 * §4.4): Nightjar's linked releases show their current approved revision, and
 * releases approved in this browser's Studio demo join the grids. The server
 * render and hydration use the seed state.
 */
export function useMarketListings(): readonly MarketListing[] {
  const views = useCurrentReleases(LINKED_RELEASE_IDS);
  const publicReleases = usePublicReleases();
  return useMemo(() => buildListings(views, publicReleases), [views, publicReleases]);
}
