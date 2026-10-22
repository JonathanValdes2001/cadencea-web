'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/v2-demo/credits/store';
import { Diamond } from '@/components/ui/Icons';

/**
 * The demo wallet total in the navbar (WEB-V2-SPEC §1.3), linking to /credits.
 * Labelled "Demo" so a signed-out visitor doesn't read it as their own balance.
 * Server rendering shows the seed total; the stored balance replaces it after
 * hydration.
 */
export default function CreditsChip({ className = '' }: { className?: string }) {
  const { balances } = useWallet();
  return (
    <Link
      href="/credits"
      aria-label={`Demo credits balance: ${balances.total} credits`}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-800 bg-brand-950 px-3 text-sm font-semibold tabular-nums text-brand-200 hover:border-brand-300 hover:text-brand-50 ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-300">Demo</span>
      <Diamond size={16} className="text-brand-300" />
      {balances.total.toLocaleString('en-US')}
    </Link>
  );
}

/** The demo total as plain text, for the mobile menu's "Credits · 289 (demo)". */
export function CreditsTotal() {
  const { balances } = useWallet();
  return <>{balances.total.toLocaleString('en-US')}</>;
}
