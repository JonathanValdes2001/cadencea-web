import React from 'react';
import Link from 'next/link';

const categories = [
  {
    name: 'Reverbs & delays',
    desc: 'Classic and modern reverb algorithms with pristine delays for spatial enhancement.',
    items: ['Hall Reverbs', 'Vintage Delays', 'Creative Spaces'],
  },
  {
    name: 'EQs & filters',
    desc: 'Precision equalizers and creative filters for perfect frequency sculpting.',
    items: ['Parametric EQs', 'Vintage Filters', 'Creative Filtering'],
  },
  {
    name: 'Compressors & dynamics',
    desc: 'Professional dynamics processing for perfect mix control and punch.',
    items: ['Vintage Compressors', 'Multiband Dynamics', 'Gates & Expanders'],
  },
];

export default function Effects() {
  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-subtle">
              <li>
                <Link href="/software" className="hover:text-accent">
                  Software
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink">Effects</li>
            </ol>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Coming soon
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Effects.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Professional audio effects and plugins for your music production
            workflow — from vintage emulations to cutting-edge processors.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex flex-col border-t border-line pt-6"
              >
                <span className="inline-flex w-fit items-center rounded-sm bg-elevated px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                  Coming soon
                </span>
                <h2 className="mt-4 text-xl font-semibold text-ink">
                  {cat.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {cat.desc}
                </p>
                <ul className="mt-6 space-y-2 text-sm text-ink">
                  {cat.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 rounded-full bg-ink"
                      />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notify banner */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                In development
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Professional audio effects, coming soon.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted">
                A comprehensive suite that combines the warmth of vintage
                hardware with modern digital precision — designed for everyday
                studio work.
              </p>
              <button
                type="button"
                className="mt-8 inline-flex h-12 items-center rounded-sm bg-accent px-8 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
              >
                Get notified
              </button>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FeatureGroup
                  title="Premium processing"
                  items={[
                    'High-quality audio algorithms',
                    'Vintage hardware modeling',
                    'Zero-latency processing',
                    'Intuitive interfaces',
                  ]}
                />
                <FeatureGroup
                  title="Studio ready"
                  items={[
                    'Professional audio quality',
                    'Optimized CPU performance',
                    'Full automation support',
                    'Preset management',
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-line pt-8">
            <Link
              href="/software"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to all software
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t border-line pt-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-ink-muted">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
