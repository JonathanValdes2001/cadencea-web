'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

const navLinks = [
  { href: '/software', label: 'Software' },
  { href: '/pricing', label: 'Pricing' },
];

const Navbar = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : user?.email ?? '';
  const initial =
    profile?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?';

  return (
    <nav
      className={`sticky top-0 z-50 bg-dark border-b border-white/10 transition-shadow ${
        scrolled ? 'shadow-nav' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Cadencea home"
          >
            <Image
              src="/logo/cadencea-mark-grayscale.svg"
              alt=""
              width={32}
              height={32}
              priority
              className="h-7 w-7"
            />
            <Image
              src="/logo/cadencea-text-only.svg"
              alt="Cadencea"
              width={460}
              height={80}
              priority
              className="h-4 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-dark-text hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-dark-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
                Loading
              </div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-dark-text hover:text-accent"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-canvas text-xs font-semibold text-ink">
                    {initial}
                  </span>
                  <span className="max-w-[12rem] truncate">{displayName}</span>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-dark py-1 shadow-dropdown"
                  >
                    <Link
                      href="/account/settings"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-dark-text hover:bg-white/10"
                    >
                      Account settings
                    </Link>
                    <Link
                      href="/account/subscription"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-dark-text hover:bg-white/10"
                    >
                      Subscription
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-sm text-dark-text hover:bg-white/10"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-dark-text hover:text-accent"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-sm text-dark-text hover:bg-white/10"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-sm px-3 py-3 text-base font-medium text-dark-text hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {loading ? (
                <div className="px-3 py-2 text-sm text-dark-muted">Loading…</div>
              ) : user ? (
                <div className="flex flex-col gap-1">
                  <div className="px-3 py-2 text-xs uppercase tracking-wider text-dark-muted">
                    {displayName}
                  </div>
                  <Link
                    href="/account/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-sm px-3 py-3 text-base text-dark-text hover:bg-white/10"
                  >
                    Account settings
                  </Link>
                  <Link
                    href="/account/subscription"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-sm px-3 py-3 text-base text-dark-text hover:bg-white/10"
                  >
                    Subscription
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-sm px-3 py-3 text-left text-base text-dark-text hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-sm border border-white/30 px-3 py-3 text-center text-sm font-semibold text-dark-text hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-sm bg-accent px-3 py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
