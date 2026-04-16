'use client';

import React, { useState, useMemo } from 'react';

type Product = {
  id: number;
  name: string;
  category: 'instruments' | 'effects' | 'sounds';
  type: string;
  price: number;
  description: string;
  comingSoon: boolean;
  featured: boolean;
};

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Cadencea Synth Pro',
    category: 'instruments',
    type: 'Synthesizer',
    price: 199,
    description:
      'Professional wavetable synthesizer with advanced modulation capabilities.',
    comingSoon: true,
    featured: true,
  },
  {
    id: 2,
    name: 'Vintage Reverb Suite',
    category: 'effects',
    type: 'Reverb',
    price: 89,
    description:
      'Collection of classic reverb algorithms from the golden age of digital audio.',
    comingSoon: true,
    featured: false,
  },
  {
    id: 3,
    name: 'Analog Drum Collection',
    category: 'sounds',
    type: 'Sample Pack',
    price: 49,
    description:
      'High-quality analog drum samples recorded through vintage hardware.',
    comingSoon: true,
    featured: false,
  },
  {
    id: 4,
    name: 'Bass Engine',
    category: 'instruments',
    type: 'Bass Synthesizer',
    price: 129,
    description:
      'Powerful bass synthesizer with deep sub-bass capabilities.',
    comingSoon: true,
    featured: true,
  },
  {
    id: 5,
    name: 'Cinematic Strings',
    category: 'sounds',
    type: 'Sample Library',
    price: 299,
    description:
      'Orchestra-quality string samples for film and game scoring.',
    comingSoon: true,
    featured: false,
  },
  {
    id: 6,
    name: 'Spectral Compressor',
    category: 'effects',
    type: 'Dynamics',
    price: 149,
    description:
      'AI-powered spectral compressor for transparent dynamic control.',
    comingSoon: true,
    featured: true,
  },
];

const categories = [
  { id: 'all', name: 'All' },
  { id: 'instruments', name: 'Instruments' },
  { id: 'effects', name: 'Effects' },
  { id: 'free', name: 'Free' },
] as const;

const sortOptions = [
  { id: 'most-relevant', name: 'Most relevant' },
  { id: 'most-recent', name: 'Most recent' },
  { id: 'lowest-price', name: 'Lowest price' },
  { id: 'highest-price', name: 'Highest price' },
];

type CategoryId = (typeof categories)[number]['id'];

export default function SoftwareAndSounds() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most-relevant');
  const [hideOwnedProducts, setHideOwnedProducts] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts.filter(
      (p) => p.category === 'instruments' || p.category === 'effects'
    );

    if (activeCategory === 'instruments' || activeCategory === 'effects') {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'lowest-price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'highest-price':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'most-recent':
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return filtered;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-20 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Catalog
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Software &amp; sounds.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Instruments, effects, and sample libraries from Cadencea.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Category tabs */}
          <nav aria-label="Category filters">
            <ul className="-mx-2 flex flex-wrap gap-1 overflow-x-auto">
              {categories.map((c) => {
                const active = c.id === activeCategory;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`inline-flex h-10 items-center rounded-sm px-4 text-sm font-semibold tracking-wide ${
                        active
                          ? 'bg-ink text-canvas'
                          : 'text-ink hover:bg-elevated'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Search + sort */}
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block h-11 w-full rounded-sm border border-line bg-elevated pl-10 pr-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={hideOwnedProducts}
                  onChange={(e) => setHideOwnedProducts(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-line text-accent focus:ring-accent"
                />
                <span>Hide owned products</span>
              </label>

              <div>
                <label
                  htmlFor="sort"
                  className="mr-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle"
                >
                  Sort
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 rounded-sm border border-line bg-elevated px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {sortOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-widest text-ink-subtle">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'result' : 'results'}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-16 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-md border border-line bg-canvas transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
                >
                  <div className="relative aspect-[3/2] w-full bg-dark">
                    {p.comingSoon && (
                      <span className="absolute left-4 top-4 inline-flex items-center rounded-sm bg-canvas px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink">
                        Coming soon
                      </span>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <p className="text-[11px] uppercase tracking-widest text-dark-muted">
                        {p.type}
                      </p>
                      <p className="mt-1 text-xl font-bold tracking-tight text-dark-text">
                        {p.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-semibold text-ink">
                      {p.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                      {p.description}
                    </p>

                    <div className="mt-auto pt-5">
                      <div className="flex items-baseline justify-between text-sm">
                        <div>
                          <span className="text-xs uppercase tracking-widest text-ink-subtle">
                            Update
                          </span>
                          <span className="ml-2 font-bold text-ink">
                            €{p.price}.00
                          </span>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-widest text-ink-subtle">
                            Full
                          </span>
                          <span className="ml-2 font-bold text-ink">
                            €{Math.round(p.price * 1.5)}.00
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={p.comingSoon}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-wide text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-inset disabled:text-ink-muted"
                      >
                        {p.comingSoon ? 'Coming soon' : 'Add to cart'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-line bg-canvas p-12 text-center">
              <h3 className="text-xl font-semibold text-ink">
                No products found
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
