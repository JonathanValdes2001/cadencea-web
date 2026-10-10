'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CreditsChip, { CreditsTotal } from '@/components/v2/common/CreditsChip';
import Button from '@/components/ui/Button';
import { Chevron, Close, Menu } from '@/components/ui/Icons';

const productionLinks = [
  { href: '/cadenceavault', label: 'Cadencea Vault' },
  { href: '/pricing', label: 'Pricing' },
];

const previewLinks = [
  { href: '/cadenceavault', label: 'Cadencea Vault' },
  { href: '/market', label: 'Market' },
  { href: '/stream', label: 'Stream' },
  { href: '/pricing', label: 'Pricing' },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * `showV2` comes from RootLayout's server-side preview check; the preview adds
 * the Market, Stream, the demo credits chip, Publish and the demo Studio and
 * Credits links. Production shows only Cadencea Vault and Pricing.
 */
const Navbar = ({ showV2 }: { showV2: boolean }) => {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname() ?? '';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const navLinks = showV2 ? previewLinks : productionLinks;

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setIsMenuOpen(false);
      setUserMenuOpen((open) => {
        if (open) userMenuButtonRef.current?.focus();
        return false;
      });
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

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

  const menuItem = 'block px-4 py-2.5 text-sm text-dark-text hover:bg-white/10';
  const mobileItem = 'rounded-sm px-3 py-3 text-base text-dark-text hover:bg-white/10';

  return (
    <nav
      aria-label="Main"
      className={`on-dark sticky top-0 z-50 bg-dark border-b border-white/10 transition-shadow ${
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
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 items-center border-b-2 pt-0.5 text-sm font-medium hover:text-brand-300 ${
                    active ? 'border-brand-400 text-dark-text' : 'border-transparent text-dark-text'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {showV2 && (
              <>
                <CreditsChip />
                <Button href="/publish" variant="onDarkOutline" size="sm">
                  Publish
                </Button>
              </>
            )}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-dark-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
                Loading
              </div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  ref={userMenuButtonRef}
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-dark-text hover:text-brand-300"
                  aria-expanded={userMenuOpen}
                  aria-controls="account-menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-canvas text-xs font-semibold text-ink">
                    {initial}
                  </span>
                  <span className="max-w-[12rem] truncate">{displayName}</span>
                  <Chevron size={16} />
                </button>

                {userMenuOpen && (
                  <div
                    id="account-menu"
                    className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-dark py-1 shadow-dropdown"
                  >
                    <Link href="/account/settings" className={menuItem}>
                      Account settings
                    </Link>
                    <Link href="/account/subscription" className={menuItem}>
                      Subscription
                    </Link>
                    {showV2 && (
                      <>
                        <div className="my-1 border-t border-white/10" />
                        <Link href="/studio" className={menuItem}>
                          Studio (demo)
                        </Link>
                        <Link href="/credits" className={menuItem}>
                          Credits (demo)
                        </Link>
                      </>
                    )}
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className={`${menuItem} w-full text-left`}
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
                  className="text-sm font-medium text-dark-text hover:text-brand-300"
                >
                  Sign in
                </Link>
                <Button href="/signup" size="sm" className="h-10">
                  Sign up free
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm text-dark-text hover:bg-white/10"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <Close size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`${mobileItem} font-medium ${active ? 'bg-white/10' : ''}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {showV2 && (
              <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
                <Link href="/studio" className={mobileItem}>
                  Studio (demo)
                </Link>
                <Link href="/credits" className={`${mobileItem} tabular-nums`}>
                  Credits · <CreditsTotal /> (demo)
                </Link>
                <Link href="/publish" className={mobileItem}>
                  Publish
                </Link>
              </div>
            )}

            <div className="mt-4 border-t border-white/10 pt-4">
              {loading ? (
                <div className="px-3 py-2 text-sm text-dark-muted">Loading…</div>
              ) : user ? (
                <div className="flex flex-col gap-1">
                  <div className="px-3 py-2 text-xs uppercase tracking-wider text-dark-muted">
                    {displayName}
                  </div>
                  <Link href="/account/settings" className={mobileItem}>
                    Account settings
                  </Link>
                  <Link href="/account/subscription" className={mobileItem}>
                    Subscription
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`${mobileItem} text-left`}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="rounded-sm border border-white/30 px-3 py-3 text-center text-sm font-semibold text-dark-text hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-sm bg-accent px-3 py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
                  >
                    Sign up free
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
