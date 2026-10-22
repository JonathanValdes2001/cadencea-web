import React from 'react';
import Link from 'next/link';
import Logo from './ui/Logo';
import { navLinksFor } from '../lib/nav-links.mjs';

type Col = { title: string; links: { href: string; label: string }[] };

/**
 * `showStore` comes from RootLayout's server-side check that the plugin store
 * is open; Product lists the header links (Plugins among them while the store
 * is open) and Software. Parked features are not linked from here.
 */
function columnsFor(showStore: boolean): Col[] {
  return [
    {
      title: 'Product',
      links: [...navLinksFor(showStore), { href: '/software', label: 'Software' }],
    },
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

const Footer = ({ showStore }: { showStore: boolean }) => {
  const columns = columnsFor(showStore);
  return (
    <footer className="on-dark bg-dark text-dark-muted">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center" aria-label="Cadencea home">
              <Logo tone="onDark" />
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
          <p className="text-xs text-dark-muted">Prices in euros.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
