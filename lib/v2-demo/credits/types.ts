/**
 * The wallet shape of docs/v2/CREDITS-MODEL.md §10 ("cadencea.credits.wallet.v1"),
 * typed as written there (snake_case keys, signed integer credits, integer euro
 * cents, ISO 8601 UTC timestamps).
 */

export type LedgerType = 'topup' | 'monthly_grant' | 'purchase' | 'refund' | 'expiry' | 'platform_adjust';
export type WalletName = 'included' | 'bought';

export interface IncludedLot {
  lot_id: string;
  source: 'welcome' | 'monthly_grant';
  scope: 'cadencea_originals' | 'all';
  granted: number;
  remaining: number;
  granted_at: string;
  expires_at: string | null;
  status: 'active' | 'spent' | 'expired';
}

export interface BoughtLot {
  lot_id: string;
  source: 'topup';
  credits: number;
  paid_eur_cents: number;
  remaining: number;
  purchased_at: string;
  refundable_until: string;
  expires_at: null;
  status: 'active' | 'spent' | 'refunded';
}

export interface LotDraw {
  lot_id: string;
  credits: number;
}

export interface LedgerItem {
  id: string;
  title: string;
  kind: string;
  seller: string;
  first_party: boolean;
  price_credits: number;
  seller_earns_eur_cents: number;
}

export interface LedgerEntry {
  id: string;
  at: string;
  type: LedgerType;
  reason?: string;
  wallet?: WalletName;
  credits: number;
  eur_cents: number;
  paid_eur_cents?: number;
  split?: { included: number; bought: number };
  lots: LotDraw[];
  item?: LedgerItem;
  ref?: Record<string, string>;
  refund_of?: string;
  seller_reversal_eur_cents?: number;
  balance_after: { included: number; bought: number };
  memo: string;
}

export interface Wallet {
  schema: 'cadencea.credits.wallet.v1';
  preview: true;
  as_of: string;
  user: { id: string; display_name: string };
  unit: { currency: 'EUR'; eur_cents_per_credit: number; vat_included: boolean };
  plan: {
    id: 'free' | 'basic' | 'standard' | 'pro';
    name: string;
    billing: 'monthly' | 'yearly';
    monthly_credits: number;
    rollover_cap: number;
    next_grant_at: string;
    introductory: boolean;
  };
  balances: { included: number; bought: number; total: number; total_eur_cents: number };
  buckets: {
    included: { label: string; cap: number; cap_counts: 'monthly_grant'; lots: IncludedLot[] };
    bought: { label: string; cap: number; lots: BoughtLot[] };
  };
  ledger: LedgerEntry[];
}
