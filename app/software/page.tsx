import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Product = {
  name: string;
  tagline: string;
  description: string;
  href: string;
  platforms: string[];
  status: 'available' | 'coming';
  statusLabel: string;
  image: string;
};

const products: Product[] = [
  {
    name: 'Cadencea Vault',
    tagline: 'Cadencea Vault',
    description:
      'Organize your music projects, back them up securely to the cloud, and collaborate with ease. Currently available for Windows — macOS and Linux coming soon.',
    href: '/cadenceavault',
    platforms: ['Windows'],
    status: 'available',
    statusLabel: 'Available now · Windows',
    image: '/logo/og-social-card.svg',
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
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <p className="text-[11px] uppercase tracking-widest text-dark-muted">
                      {p.platforms.join(' · ')}
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
          </div>
        </div>
      </section>
    </div>
  );
}
