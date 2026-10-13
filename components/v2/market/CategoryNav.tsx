'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { CATEGORIES, type CategoryKey } from '@/lib/v2-demo/categories';
import { CATEGORY_TINT } from '@/lib/v2-demo/market/browse';
import { CATEGORY_NAV_LABEL, MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { useMarketListings } from './useMarketListings';

interface NavItem {
  id: CategoryKey | 'all';
  label: string;
  count: number;
  href: string;
}

/**
 * All · Samples · Splits · Presets · MIDI · Beats · Songs · Themes, each with
 * the number of listings on sale (WEB-V2-SPEC §4.2). A dark strip under the
 * showroom header, the same on /market, every category and "All results"
 * (and on item pages, marking the item's category); sticky under the navbar
 * from md. Each category carries its tint as a dot and, when current, as the
 * underline.
 */
export default function CategoryNav({
  current,
  currentIsPage = true,
}: {
  current: CategoryKey | 'all';
  /** False on item pages: the category is where the page lives, not the page itself. */
  currentIsPage?: boolean;
}) {
  const listings = useMarketListings();
  const items = useMemo<NavItem[]>(() => {
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

  // On a phone the strip scrolls sideways; start it with the current tab in view (no page scroll, no animation).
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = scroller.current;
    const link = row?.querySelector<HTMLElement>('[aria-current]');
    if (!row || !link || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2;
  }, [current]);

  return (
    <div className="on-dark z-30 border-y border-white/10 bg-showroom-to md:sticky md:top-16">
      <Container>
        <nav aria-label={MARKET_HOME_COPY.categoryNavLabel}>
          <div ref={scroller} className="scroll-fade-x scrollbar-none relative -mx-6 overflow-x-auto px-6 lg:-mx-8 lg:px-8">
            <ul className="flex w-max min-w-full gap-1 pr-6">
              {items.map((item) => {
                const active = item.id === current;
                const tint = CATEGORY_TINT[item.id].onDark;
                return (
                  <li key={item.id} className="first:-ml-3">
                    <Link
                      href={item.href}
                      aria-current={active ? (currentIsPage ? 'page' : 'true') : undefined}
                      style={{ '--tint': tint } as React.CSSProperties}
                      className={`relative inline-flex h-12 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium focus-visible:outline-offset-[-2px] ${
                        active ? 'text-dark-text' : 'text-dark-muted hover:text-dark-text'
                      }`}
                    >
                      {item.id !== 'all' && (
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tint)]" />
                      )}
                      {item.label}
                      <span className={`tabular-nums ${active ? 'text-[var(--tint)]' : 'text-dark-muted/80'}`}>
                        {item.count}
                      </span>
                      {active && (
                        <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 rounded-sm bg-[var(--tint)]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </Container>
    </div>
  );
}
