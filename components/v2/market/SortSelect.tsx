'use client';

import React from 'react';
import { Chevron } from '@/components/ui/Icons';
import { FILTER_COPY } from '@/lib/v2-demo/market/copy';
import { SORT_KEYS, type SortKey } from '@/lib/v2-demo/market/queries';

/**
 * "Newest", "Price: low to high", "Price: high to low", "BPM: low to high",
 * "Title A–Z" (WEB-V2-SPEC §4.3), as a compact select for the results bar. The
 * "Sort by" label stays visible from sm and is read out below it.
 */
export default function SortSelect({
  id,
  value,
  onChange,
  className = '',
}: {
  id: string;
  value: SortKey;
  onChange: (sort: SortKey) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only whitespace-nowrap text-sm text-ink-muted sm:not-sr-only">
        {FILTER_COPY.sortLabel}
      </label>
      <div className="relative min-w-0">
        <select
          id={id}
          value={value}
          onChange={(e) => {
            const next = e.currentTarget.value;
            if ((SORT_KEYS as readonly string[]).includes(next)) onChange(next as SortKey);
          }}
          className="h-10 w-full cursor-pointer appearance-none rounded-sm border border-line bg-canvas pl-3 pr-9 text-sm font-medium text-ink hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 pointer-coarse:h-11"
        >
          {FILTER_COPY.sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Chevron size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
      </div>
    </div>
  );
}
