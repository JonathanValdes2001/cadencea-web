'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';
import { Filter, Search } from '@/components/ui/Icons';
import { CATEGORY_BY_KEY, type CategoryKey, type FilterField } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { CARD_COPY, FILTER_COPY } from '@/lib/v2-demo/market/copy';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filterItems,
  parseFilters,
  serializeFilters,
  sortItems,
  type MarketFilters,
} from '@/lib/v2-demo/market/queries';
import ActiveFilters from './ActiveFilters';
import FilterPanel from './FilterPanel';
import FilterSheet from './FilterSheet';
import MarketGrid from './MarketGrid';
import SortSelect from './SortSelect';
import { useMarketListings } from './useMarketListings';

/** The fields "All results" filters on: no price, because categories price in different units. */
const ALL_RESULTS_FIELDS: readonly FilterField[] = ['bpm', 'key', 'genre', 'tags'];
const SEARCH_DELAY_MS = 300;

/**
 * Search, filters, sort and results for a category view or the "All results"
 * view (WEB-V2-SPEC §4.3). The URL is the state: every change replaces the
 * query string, so a copied link restores the same results.
 */
export default function MarketBrowser({ category }: { category: CategoryKey | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const listings = useMarketListings();
  const [query, setQuery] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const config = category ? CATEGORY_BY_KEY[category] : null;
  const fields = config?.filters ?? ALL_RESULTS_FIELDS;
  const pool = useMemo(
    () => listings.filter((l) => l.isPublic && (category === null || l.category === category)),
    [listings, category],
  );
  const results = useMemo(() => sortItems(filterItems(pool, filters), filters.sort), [pool, filters]);

  // Reads the live URL rather than this render's filters, so a delayed search
  // never undoes a filter changed in the meantime.
  const update = useCallback(
    (patch: Partial<MarketFilters>) => {
      const next = { ...parseFilters(new URLSearchParams(window.location.search)), ...patch };
      const search = serializeFilters(next);
      window.history.replaceState(null, '', search ? `${pathname}?${search}` : pathname);
    },
    [pathname],
  );

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  // A navigation that changes ?q from outside the box (a category tab, a chip,
  // the back button) keeps this component mounted, so the box follows the URL.
  // While a typed search is still waiting to be written, the box leads instead.
  const searchPending = useRef(false);
  useEffect(() => {
    if (searchPending.current) return;
    setQuery((current) => (current.trim() === filters.q ? current : filters.q));
  }, [filters.q]);

  const cancelPendingSearch = () => {
    clearTimeout(searchTimer.current);
    searchPending.current = false;
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(searchTimer.current);
    searchPending.current = true;
    searchTimer.current = setTimeout(() => {
      searchPending.current = false;
      update({ q: value.trim() });
    }, SEARCH_DELAY_MS);
  };

  const clearFilters = () => {
    cancelPendingSearch();
    setQuery('');
    update({ ...EMPTY_FILTERS, sort: filters.sort });
  };

  const count = results.length;
  const countText = count === 1 ? CARD_COPY.oneResult : fill(CARD_COPY.results, { n: count });
  const activeCount = activeFilterCount(filters);
  const panel = (idPrefix: string) => (
    <FilterPanel
      idPrefix={idPrefix}
      filters={filters}
      onChange={update}
      fields={fields}
      priceUnit={config?.priceUnit ?? null}
      pool={pool}
    />
  );

  return (
    <Container className="py-10 lg:py-14">
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <aside aria-label={FILTER_COPY.panelTitle} className="hidden lg:block">
          <div className="scrollbar-none sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-6 pr-1">
            <h2 className="mb-5 text-base font-semibold text-ink">{FILTER_COPY.panelTitle}</h2>
            {panel('sidebar')}
          </div>
        </aside>

        <div className="min-w-0">
          <h2 className="sr-only">{CARD_COPY.resultsHeading}</h2>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              cancelPendingSearch();
              update({ q: query.trim() });
            }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="relative flex-1">
              <label htmlFor="market-browser-search" className="mb-1.5 block text-sm font-medium text-ink">
                {category ? FILTER_COPY.searchLabel : FILTER_COPY.searchAllLabel}
              </label>
              <Search size={20} className="pointer-events-none absolute bottom-3 left-3 text-ink-subtle" />
              <input
                id="market-browser-search"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.currentTarget.value)}
                className="h-11 w-full rounded-sm border border-line bg-elevated pl-10 pr-3 text-base text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
              />
            </div>
            <div className="flex items-end gap-3">
              <SortSelect
                id="market-browser-sort"
                value={filters.sort}
                onChange={(sort) => update({ sort })}
                className="flex-1 sm:w-52"
              />
              <Button
                variant="secondary"
                iconLeft={<Filter size={16} />}
                onClick={() => setSheetOpen(true)}
                className="lg:hidden"
                aria-haspopup="dialog"
              >
                {FILTER_COPY.filtersButton}
                {activeCount > 0 && <span className="tabular-nums">({activeCount})</span>}
              </Button>
            </div>
          </form>

          <p aria-live="polite" className="mt-6 text-sm text-ink-muted tabular-nums">
            {countText}
          </p>
          <ActiveFilters
            filters={filters}
            onChange={(patch) => {
              if (patch.q === '') {
                cancelPendingSearch();
                setQuery('');
              }
              update(patch);
            }}
            onClear={clearFilters}
          />

          {count > 0 ? (
            <MarketGrid listings={results} layout="withSidebar" className="mt-6" />
          ) : (
            <EmptyState
              className="mt-6"
              icon={<Search size={24} />}
              title={CARD_COPY.emptyTitle}
              body={CARD_COPY.emptyBody}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {CARD_COPY.emptyAction}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={count} onClear={clearFilters}>
        {panel('sheet')}
      </FilterSheet>
    </Container>
  );
}
