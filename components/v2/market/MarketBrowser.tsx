'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';
import { Filter, Search } from '@/components/ui/Icons';
import { CATEGORY_BY_KEY, type CategoryKey, type FilterField } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { parseView, serializeView, type ViewMode } from '@/lib/v2-demo/market/browse';
import { BROWSE_COPY, CARD_COPY, FILTER_COPY, MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
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
import CategoryNav from './CategoryNav';
import FilterBar from './FilterBar';
import FilterPanel, { availableFields } from './FilterPanel';
import FilterSheet from './FilterSheet';
import MarketGrid from './MarketGrid';
import MarketList from './MarketList';
import MarketSearch from './MarketSearch';
import SortSelect from './SortSelect';
import TagRow from './TagRow';
import ViewToggle from './ViewToggle';
import { useMarketListings } from './useMarketListings';

/** The fields "All results" filters on: no price, because categories price in different units. */
const ALL_RESULTS_FIELDS: readonly FilterField[] = ['bpm', 'key', 'genre', 'tags'];
const SEARCH_DELAY_MS = 300;

/** "Sample packs" → "sample packs" mid-sentence; "MIDI packs" keeps its capitals. */
const inSentence = (label: string) => (/^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1));

/**
 * A category view or the "All results" view (WEB-V2-SPEC §4.3), in the one
 * browse frame every Market page shares (the Splice pattern): the
 * category strip with compact search, a row of filter buttons
 * (a sheet below md), the tag row, active filter chips, the results bar with
 * sort and the grid/list switch, then the results. The URL is the state:
 * every change replaces the query string, so a copied link restores the same
 * results and view.
 */
export default function MarketBrowser({
  category,
  title,
}: {
  category: CategoryKey | null;
  title: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const view = useMemo(() => parseView(searchParams, category), [searchParams, category]);
  const listings = useMarketListings();
  const [query, setQuery] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const config = category ? CATEGORY_BY_KEY[category] : null;
  const fields = config?.filters ?? ALL_RESULTS_FIELDS;
  const priceUnit = config?.priceUnit ?? null;
  const pool = useMemo(
    () => listings.filter((l) => l.isPublic && (category === null || l.category === category)),
    [listings, category],
  );
  const results = useMemo(() => sortItems(filterItems(pool, filters), filters.sort), [pool, filters]);
  // Tags have their own row at every width, so the sheet and the filter buttons leave them out.
  const sheetFields = availableFields(fields, pool, priceUnit).filter((field) => field !== 'tags');

  // Reads the live URL rather than this render's filters, so a delayed search
  // never undoes a filter changed in the meantime.
  const update = useCallback(
    (patch: Partial<MarketFilters>, nextView?: ViewMode) => {
      const live = new URLSearchParams(window.location.search);
      const next = { ...parseFilters(live), ...patch };
      const search = [serializeFilters(next), serializeView(nextView ?? parseView(live, category), category)]
        .filter(Boolean)
        .join('&');
      window.history.replaceState(null, '', search ? `${pathname}?${search}` : pathname);
    },
    [pathname, category],
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
  const fieldProps = { filters, onChange: update, priceUnit, pool };

  const search = (
    <MarketSearch
      id="market-browser-search"
      label={category ? FILTER_COPY.searchLabel : FILTER_COPY.searchAllLabel}
      value={query}
      onChange={onQueryChange}
      placeholder={
        config
          ? fill(BROWSE_COPY.searchIn, { category: inSentence(config.label) })
          : MARKET_HOME_COPY.searchLabel
      }
      onSubmit={(e) => {
        e.preventDefault();
        cancelPendingSearch();
        update({ q: query.trim() });
      }}
    />
  );

  return (
    <>
      <h1 className="sr-only">{title}</h1>
      <CategoryNav current={category ?? 'all'} search={search} />

      <Container className="pb-16 pt-6 lg:pb-20 lg:pt-8">
        <h2 className="sr-only">{CARD_COPY.resultsHeading}</h2>

        {/* Filter buttons and tags: one row on phones (Filters, then the tags), two from md (Splice's layout). */}
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-4">
          {sheetFields.length > 0 && (
            <Button
              variant="secondary"
              iconLeft={<Filter size={16} />}
              onClick={() => setSheetOpen(true)}
              className="shrink-0 md:hidden"
              aria-haspopup="dialog"
            >
              {FILTER_COPY.filtersButton}
              {activeCount - filters.tags.length > 0 && (
                <span className="tabular-nums">({activeCount - filters.tags.length})</span>
              )}
            </Button>
          )}
          <FilterBar className="hidden md:flex" idPrefix="bar" fields={fields} {...fieldProps} />
          <TagRow
            filters={filters}
            onChange={update}
            pool={pool}
            className="-mr-6 min-w-0 flex-1 pr-6 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
          />
        </div>

        <ActiveFilters
          className="mt-4"
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

        <div className="mt-6 flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm font-semibold text-ink tabular-nums">
            {countText}
          </p>
          <div className="flex items-center gap-2">
            <SortSelect id="market-browser-sort" value={filters.sort} onChange={(sort) => update({ sort })} />
            <ViewToggle value={view} onChange={(next) => update({}, next)} />
          </div>
        </div>

        {count === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Search size={24} />}
            title={CARD_COPY.emptyTitle}
            body={CARD_COPY.emptyBody}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {CARD_COPY.emptyAction}
              </Button>
            }
          />
        ) : view === 'list' ? (
          <MarketList listings={results} showType={category === null} className="mt-3" />
        ) : (
          <MarketGrid listings={results} className="mt-4" />
        )}
      </Container>

      {sheetFields.length > 0 && (
        <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={count} onClear={clearFilters}>
          <FilterPanel idPrefix="sheet" fields={sheetFields} {...fieldProps} />
        </FilterSheet>
      )}
    </>
  );
}
