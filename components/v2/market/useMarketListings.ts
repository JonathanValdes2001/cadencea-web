'use client';

import { useMemo } from 'react';
import { useCurrentRelease, usePublicReleases } from '@/lib/v2-demo/release-lifecycle/public';
import { buildListings } from '@/lib/v2-demo/market/resolve';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/**
 * Every Market listing with the lifecycle store applied (WEB-V2-SPEC §4.2,
 * §4.4): Nightjar's linked releases show their current approved revision, and
 * releases approved in this browser's Studio demo join the grids. The server
 * render and hydration use the seed state.
 */
export function useMarketListings(): readonly MarketListing[] {
  // One call per release in LINKED_RELEASE_IDS (market/linked.ts), in a fixed
  // order: hooks can't run in a loop.
  const r01 = useCurrentRelease('demo-r01');
  const r02 = useCurrentRelease('demo-r02');
  const r07 = useCurrentRelease('demo-r07');
  const r08 = useCurrentRelease('demo-r08');
  const r09 = useCurrentRelease('demo-r09');
  const r10 = useCurrentRelease('demo-r10');
  const r11 = useCurrentRelease('demo-r11');
  const r13 = useCurrentRelease('demo-r13');
  const r14 = useCurrentRelease('demo-r14');
  const r15 = useCurrentRelease('demo-r15');
  const publicReleases = usePublicReleases();

  return useMemo(
    () =>
      buildListings(
        {
          'demo-r01': r01,
          'demo-r02': r02,
          'demo-r07': r07,
          'demo-r08': r08,
          'demo-r09': r09,
          'demo-r10': r10,
          'demo-r11': r11,
          'demo-r13': r13,
          'demo-r14': r14,
          'demo-r15': r15,
        },
        publicReleases,
      ),
    [r01, r02, r07, r08, r09, r10, r11, r13, r14, r15, publicReleases],
  );
}
