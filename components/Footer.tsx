import React from 'react';
import Link from 'next/link';

type Col = { title: string; links: { href: string; label: string }[] };

const columns: Col[] = [
  {
    title: 'Products',
    links: [
      { href: '/software', label: 'Software' },
      { href: '/cadenceavault', label: 'Cadencea Vault' },
      { href: '/pricing', label: 'Pricing' },
    ],
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

const Footer = () => {
  return (
    <footer className="bg-dark text-dark-muted">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-dark-text hover:text-dark-text"
              aria-label="Cadencea home"
            >
              <span
                className="inline-block h-4 w-4 bg-dark-text"
                aria-hidden="true"
              />
              <span className="text-base font-bold tracking-tight">
                CADENCEA
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Innovative software and technology for music creators.
            </p>
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-dark-text">
                {col.title}
              </h4>
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
