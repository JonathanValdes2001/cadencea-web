'use client';

import React from 'react';
import { BROWSE_COPY } from '@/lib/v2-demo/market/copy';
import type { MarketFilters } from '@/lib/v2-demo/market/queries';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { filterChipClass, useTagOptions } from './FilterPanel';

/**
 * The most used tags in view as one row of toggles (Splice's tag cloud). One
 * tap narrows the results; the row scrolls sideways on small screens.
 */
export default function TagRow({
  filters,
  onChange,
  pool,
  className = '',
}: {
  filters: MarketFilters;
  onChange: (patch: Partial<MarketFilters>) => void;
  pool: readonly MarketListing[];
  className?: string;
}) {
  const tags = useTagOptions(pool, filters.tags);
  if (!tags.length) return null;
  return (
    <div className={`scroll-fade-x scrollbar-none -mx-6 overflow-x-auto px-6 lg:-mx-8 lg:px-8 ${className}`}>
      <div role="group" aria-label={BROWSE_COPY.tagRowLabel} className="flex w-max gap-2 pr-6">
        {tags.map((tag) => {
          const pressed = filters.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                onChange({ tags: pressed ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag] })
              }
              // Quiet like the tags on cards until chosen; then the same violet as every other choice.
              className={
                pressed
                  ? filterChipClass(true, 'px-2.5')
                  : 'inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-sm border border-transparent bg-elevated px-2.5 text-sm text-ink-muted hover:bg-inset hover:text-ink pointer-coarse:h-11'
              }
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
