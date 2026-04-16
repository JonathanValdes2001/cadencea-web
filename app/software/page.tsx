import React from 'react';
import Link from 'next/link';

type Product = {
  name: string;
  tagline: string;
  description: string;
  href: string;
  platforms: string[];
  status: 'available' | 'coming';
  statusLabel: string;
};

const products: Product[] = [
  {
    name: 'Cadencea Vault',
    tagline: 'Professional Music Project Manager',
    description:
      'Organize your music projects, back them up securely to the cloud, and access them from any device. Designed to fit seamlessly into your existing DAW workflow — no migration required.',
    href: '/cadenceavault',
    platforms: ['macOS', 'Windows', 'Linux'],
    status: 'available',
    statusLabel: 'Available now',
  },
];

export default function SoftwarePage() {
  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Products
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Software.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Tools built specifically for music creators. Download, install, and
            get back to making music — each product is designed to stay out of
            your way and elevate your workflow.
          </p>
        </div>
      </section>

      {/* Product grid */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-x-6 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group flex flex-col overflow-hidden rounded-md border border-line bg-canvas hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/9] w-full bg-dark">
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-sm bg-price px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                      {p.statusLabel}
                    </span>
                    <p className="text-[11px] uppercase tracking-widest text-dark-muted">
                      {p.platforms.join(' · ')}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-dark-text">
                      {p.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    {p.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {p.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-accent">
                    Learn more
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}

            {/* Coming-soon placeholders */}
            {['Instruments', 'Effects'].map((category) => (
              <div
                key={category}
                className="flex flex-col overflow-hidden rounded-md border border-dashed border-line bg-elevated"
              >
                <div className="relative aspect-[16/9] w-full bg-inset">
                  <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-sm bg-canvas px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                      Coming soon
                    </span>
                    <p className="text-2xl font-bold tracking-tight text-ink">
                      {category}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    In development
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    We’re building the next generation of virtual{' '}
                    {category.toLowerCase()}. Sign up to be the first to know
                    when they ship.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
