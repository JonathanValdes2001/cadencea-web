'use client';

import React from 'react';
import { SelectField } from '@/components/ui/Field';
import { FILTER_COPY } from '@/lib/v2-demo/market/copy';
import { SORT_KEYS, type SortKey } from '@/lib/v2-demo/market/queries';

/** "Newest", "Price: low to high", "Price: high to low", "BPM: low to high", "Title A–Z" (WEB-V2-SPEC §4.3). */
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
    <div className={className}>
      <SelectField
        id={id}
        label={FILTER_COPY.sortLabel}
        value={value}
        options={FILTER_COPY.sortOptions}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if ((SORT_KEYS as readonly string[]).includes(next)) onChange(next as SortKey);
        }}
      />
    </div>
  );
}
