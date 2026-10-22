'use client';

import React, { useMemo, useState } from 'react';
import type { ListedProduct } from '@/lib/plugins/catalog';
import type { PluginProduct } from '@/lib/plugins/products';
import ProductCard from './ProductCard';

/** Filters appear once the store has more plugins than this (founder: always show them). */
export const FILTERS_FROM = 0;

type Price = 'all' | 'free' | 'paid';

const isFree = (listing: ListedProduct) => listing.isFree || listing.priceMinor === 0;

/**
 * The store's product grid, with Price (All · Free · Paid) and Type filters
 * once there are enough plugins for filtering to help.
 */
export default function StoreGrid({ cards }: { cards: { product: PluginProduct; listing: ListedProduct }[] }) {
  const [price, setPrice] = useState<Price>('all');
  const [type, setType] = useState<string>('all');
  const types = useMemo(() => [...new Set(cards.map(({ product }) => product.category))].sort(), [cards]);
  const showFilters = cards.length > FILTERS_FROM;

  const shown = cards.filter(
    ({ product, listing }) =>
      (price === 'all' || (price === 'free') === isFree(listing)) && (type === 'all' || product.category === type),
  );

  return (
    <div>
      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          <FilterGroup
            label="Price"
            value={price}
            options={[
              { value: 'all', label: 'All' },
              { value: 'free', label: 'Free' },
              { value: 'paid', label: 'Paid' },
            ]}
            onChange={(value) => setPrice(value as Price)}
          />
          {types.length > 1 && (
            <FilterGroup
              label="Type"
              value={type}
              options={[{ value: 'all', label: 'All' }, ...types.map((t) => ({ value: t, label: t }))]}
              onChange={setType}
            />
          )}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map(({ product, listing }) => (
          <ProductCard key={product.id} product={product} listing={listing} />
        ))}
      </ul>
      {shown.length === 0 && <p className="text-sm text-ink-muted">No plugins match these filters.</p>}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-ink-muted">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            value === option.value ? 'border-ink bg-ink text-canvas' : 'border-line text-ink hover:border-line-strong'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
