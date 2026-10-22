/**
 * How the /credits history reads a CREDITS-MODEL §10 ledger entry (WEB-V2-SPEC
 * §4.8): its tab, its wallet column and its signed change. Pure and type-only
 * imports, so tests/v2-wallet-actions.test.mjs can load it.
 */
import type { LedgerEntry } from '@/lib/v2-demo/credits/types';

export type LedgerTab = 'all' | 'spent' | 'added' | 'refunds';

export const LEDGER_TABS: readonly { id: LedgerTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'spent', label: 'Spent' },
  { id: 'added', label: 'Added' },
  { id: 'refunds', label: 'Refunds & expiry' },
];

/** Purchases are "Spent"; grants, top-ups and welcome credits "Added"; returns, refunds, expiry and revocations "Refunds & expiry". */
export function ledgerTab(entry: LedgerEntry): Exclude<LedgerTab, 'all'> {
  switch (entry.type) {
    case 'purchase':
      return 'spent';
    case 'topup':
    case 'monthly_grant':
      return 'added';
    case 'refund':
    case 'expiry':
      return 'refunds';
    case 'platform_adjust':
      return entry.credits >= 0 ? 'added' : 'refunds';
  }
}

export function inLedgerTab(entry: LedgerEntry, tab: LedgerTab): boolean {
  return tab === 'all' || ledgerTab(entry) === tab;
}

/** The credits each wallet gained or lost in this entry (negative when spent). */
export function walletSplit(entry: LedgerEntry): { included: number; bought: number } {
  if (entry.split) return entry.split;
  return entry.wallet === 'bought'
    ? { included: 0, bought: entry.credits }
    : { included: entry.credits, bought: 0 };
}

/** "Included", "Bought" or "Included + Bought", with the split for the last. */
export function walletLabel(entry: LedgerEntry): { label: string; detail: string | null } {
  const { included, bought } = walletSplit(entry);
  if (included !== 0 && bought !== 0) {
    return { label: 'Included + Bought', detail: `${Math.abs(included)} + ${Math.abs(bought)}` };
  }
  return { label: bought !== 0 ? 'Bought' : 'Included', detail: null };
}

/** "+30", "−120" (a true minus sign) and "0", with thousands separators. */
export function signedCredits(credits: number): string {
  const digits = Math.abs(credits).toLocaleString('en-US');
  if (credits > 0) return `+${digits}`;
  if (credits < 0) return `−${digits}`;
  return digits;
}
