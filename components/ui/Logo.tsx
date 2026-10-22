import React from 'react';
import Image from 'next/image';

/**
 * The one Cadencea lockup: the violet arc mark and the CADENCEA wordmark.
 * The wordmark is live text in Inter (loaded with next/font), not the old
 * SVG <text>, which drew in whatever system font a visitor had, so it now
 * looks the same on Windows, macOS and phones. Navbar, footer and the auth
 * pages all use it.
 */
export default function Logo({
  tone = 'onDark',
  size = 'md',
  priority = false,
  className = '',
}: {
  tone?: 'onDark' | 'onLight';
  size?: 'md' | 'lg';
  priority?: boolean;
  className?: string;
}) {
  const mark = size === 'lg' ? 'h-8 w-8' : 'h-7 w-7';
  const word = size === 'lg' ? 'text-lg' : 'text-[15px]';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/logo/cadencea-mark-transparent.svg" alt="" width={32} height={32} priority={priority} className={mark} />
      <span
        className={`${word} font-bold uppercase leading-none tracking-[0.14em] ${
          tone === 'onDark' ? 'text-dark-text' : 'text-ink'
        }`}
      >
        Cadencea
      </span>
    </span>
  );
}
