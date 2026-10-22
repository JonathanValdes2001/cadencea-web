'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';

/** The navbar's cart link with the item count. Only rendered while the plugin store is open. */
export default function CartButton({ active = false, onNavigate }: { active?: boolean; onNavigate?: () => void }) {
  const { items, ready } = useCart();
  const count = ready ? items.length : 0;
  const label = count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  return (
    <Link
      href="/cart"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-sm text-dark-text hover:bg-white/10 hover:text-brand-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 4h2.2l2.1 10.2a1 1 0 001 .8h8.9a1 1 0 001-.8L20 7.5H6" />
        <circle cx="9.5" cy="19" r="1.25" />
        <circle cx="16.5" cy="19" r="1.25" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-400 px-1 text-[11px] font-semibold tabular-nums text-ink"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
