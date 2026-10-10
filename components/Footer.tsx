import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Col = { title: string; links: { href: string; label: string }[] };

/**
 * `showV2` comes from RootLayout's server-side isPreviewSite(): the preview adds
 * Market, Stream and Credits to Product and a Creators column.
 */
function columnsFor(showV2: boolean): Col[] {
  return [
    {
      title: 'Product',
      links: [
        { href: '/cadenceavault', label: 'Cadencea Vault' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/software', label: 'Software' },
        ...(showV2
          ? [
              { href: '/market', label: 'Market' },
              { href: '/stream', label: 'Stream' },
              { href: '/credits', label: 'Credits' },
            ]
          : []),
      ],
    },
    ...(showV2
      ? [
          {
            title: 'Creators',
            links: [
              { href: '/publish', label: 'Publish' },
              { href: '/studio', label: 'Studio' },
            ],
          },
        ]
      : []),
    {
      title: 'Company',
      links: [
        { href: '/', label: 'Home' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: 'Terms of Service' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/cookies', label: 'Cookie Notice' },
      ],
    },
  ];
}

const Footer = ({ showV2 }: { showV2: boolean }) => {
  const columns = columnsFor(showV2);
  return (
    <footer className="on-dark bg-dark text-dark-muted">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div
          className={`grid grid-cols-2 gap-12 ${showV2 ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-4'}`}
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="Cadencea home"
            >
              <Image
                src="/logo/cadencea-mark-grayscale.svg"
                alt=""
                width={32}
                height={32}
                className="h-7 w-7"
              />
              <Image
                src="/logo/cadencea-text-only.svg"
                alt="Cadencea"
                width={460}
                height={80}
                className="h-4 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Lossless project vault for music producers.
            </p>
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-dark-text">
                {col.title}
              </h2>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-dark-muted hover:text-dark-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-dark-muted">
            &copy; {new Date().getFullYear()} Cadencea. All rights reserved.
          </p>
          <p className="text-xs text-dark-muted">Prices in euros, including VAT.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
