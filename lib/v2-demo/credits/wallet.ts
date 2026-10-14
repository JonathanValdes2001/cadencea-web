/**
 * Pure wallet rules from docs/v2/CREDITS-MODEL.md §4–§5, applied to the §10
 * wallet shape. No function mutates its input; each action returns a new wallet
 * plus the ledger entry it appended. Time is always passed in (the demo clock,
 * ../clock.ts), never read from the machine.
 */
import type { BoughtLot, IncludedLot, LedgerEntry, LotDraw, Wallet } from './types.ts';
import { CREDITS, topUpQuote } from './config.ts';
import { DEMO_NOW, addDays } from '../clock.ts';

export interface Balances {
  included: number;
  bought: number;
  total: number;
  totalEurCents: number;
  /** Welcome credits still usable (Cadencea Originals only). Part of `included`. */
  welcome: number;
  /** Included credits that count toward the rollover cap (welcome credits don't, §3). */
  monthly: number;
}

export interface SpendPreview {
  credits: number;
  included: number;
  bought: number;
  /** Positive draws per lot, in spend order. */
  lots: LotDraw[];
  /** Credits still missing; 0 when the wallet covers the price. */
  shortfall: number;
}

export interface PurchaseItem {
  id: string;
  title: string;
  kind: string;
  seller: string;
  first_party: boolean;
}

export type WalletError =
  | 'invalid_amount'
  | 'insufficient_credits'
  | 'over_cap'
  | 'not_found'
  | 'refund_window_closed'
  | 'nothing_to_refund'
  | 'already_returned'
  | 'downloaded'
  | 'return_window_closed'
  | 'included_in_pack';

export type WalletResult =
  | { ok: true; wallet: Wallet; entry: LedgerEntry }
  | { ok: false; error: WalletError; shortfall?: number };

const ms = (iso: string) => Date.parse(iso);
/** Negates without producing -0, so ledger splits compare and serialize cleanly. */
const neg = (n: number) => (n === 0 ? 0 : -n);

function includedLotUsable(lot: IncludedLot, now: string): boolean {
  if (lot.status === 'expired' || lot.remaining <= 0) return false;
  return lot.expires_at === null || ms(lot.expires_at) > ms(now);
}

function boughtLotUsable(lot: BoughtLot): boolean {
  return lot.status === 'active' && lot.remaining > 0;
}

export function balances(wallet: Wallet, now: string = DEMO_NOW): Balances {
  let welcome = 0;
  let monthly = 0;
  for (const lot of wallet.buckets.included.lots) {
    if (!includedLotUsable(lot, now)) continue;
    if (lot.source === 'welcome') welcome += lot.remaining;
    else monthly += lot.remaining;
  }
  const bought = wallet.buckets.bought.lots.reduce(
    (sum, lot) => sum + (boughtLotUsable(lot) ? lot.remaining : 0),
    0,
  );
  const included = welcome + monthly;
  const total = included + bought;
  return { included, bought, total, totalEurCents: total * CREDITS.eurCentsPerCredit, welcome, monthly };
}

/** At the rollover limit (§3): the next monthly grant would be capped. */
export function atCap(wallet: Wallet, now: string = DEMO_NOW): boolean {
  const cap = wallet.buckets.included.cap;
  return cap !== null && balances(wallet, now).monthly >= cap;
}

/**
 * Credits the next monthly grant actually adds (§3): a grant only tops the
 * monthly lots up to the rollover cap, so credits above the cap are not added.
 */
export function nextGrantAmount(wallet: Wallet, now: string = DEMO_NOW): number {
  const monthly = wallet.plan.monthly_credits;
  if (wallet.buckets.included.cap === null) return monthly;
  const room = wallet.buckets.included.cap - balances(wallet, now).monthly;
  return Math.max(0, Math.min(monthly, room));
}

/** The active welcome lot, if any (for the "{n} welcome credits … until {date}" hint). */
export function welcomeLot(wallet: Wallet, now: string = DEMO_NOW): IncludedLot | null {
  return (
    wallet.buckets.included.lots.find((lot) => lot.source === 'welcome' && includedLotUsable(lot, now)) ??
    null
  );
}

/** Bought lots that still have unspent credits inside their 14-day refund window. */
export function refundableLots(wallet: Wallet, now: string = DEMO_NOW): BoughtLot[] {
  return wallet.buckets.bought.lots.filter(
    (lot) => boughtLotUsable(lot) && ms(now) <= ms(lot.refundable_until),
  );
}

/**
 * The spend order of §5.1: included first (soonest-expiring eligible lot first,
 * so welcome credits go first on Cadencea Originals; monthly lots oldest first),
 * then bought, oldest top-up first. Welcome credits only count for first-party items.
 */
export function previewSpend(
  wallet: Wallet,
  credits: number,
  opts: { firstParty?: boolean; now?: string } = {},
): SpendPreview {
  const now = opts.now ?? DEMO_NOW;
  const included = wallet.buckets.included.lots
    .filter((lot) => includedLotUsable(lot, now))
    .filter((lot) => lot.scope === 'all' || opts.firstParty === true)
    .sort((a, b) => {
      if (a.expires_at !== b.expires_at) {
        if (a.expires_at === null) return 1;
        if (b.expires_at === null) return -1;
        return ms(a.expires_at) - ms(b.expires_at);
      }
      return ms(a.granted_at) - ms(b.granted_at);
    });
  const bought = wallet.buckets.bought.lots
    .filter(boughtLotUsable)
    .sort((a, b) => ms(a.purchased_at) - ms(b.purchased_at));

  const lots: LotDraw[] = [];
  let left = credits;
  let fromIncluded = 0;
  let fromBought = 0;
  for (const lot of included) {
    if (left === 0) break;
    const take = Math.min(left, lot.remaining);
    lots.push({ lot_id: lot.lot_id, credits: take });
    fromIncluded += take;
    left -= take;
  }
  for (const lot of bought) {
    if (left === 0) break;
    const take = Math.min(left, lot.remaining);
    lots.push({ lot_id: lot.lot_id, credits: take });
    fromBought += take;
    left -= take;
  }
  return { credits, included: fromIncluded, bought: fromBought, lots, shortfall: left };
}

/**
 * "Checkout suggests the smallest top-up that covers it" (§4, WEB-V2-SPEC §4.4):
 * the shortfall rounded up to the next 50 credits, at least 100,
 * then priced with the bulk discount. Null when more than 1,000 credits are missing ("Top up in more than one step").
 */
export function suggestedTopUpEurCents(shortfallCredits: number): number | null {
  const { minCredits, maxCredits, stepCredits } = CREDITS.topUp.exact;
  const rounded = Math.max(minCredits, Math.ceil(shortfallCredits / stepCredits) * stepCredits);
  return rounded > maxCredits ? null : topUpQuote(rounded).eurCents;
}

/** Why a top-up of this many credits isn't allowed, or null when it is. */
export function topUpError(wallet: Wallet, credits: number): WalletError | null {
  const { minCredits, maxCredits, stepCredits } = CREDITS.topUp.exact;
  const validAmount =
    Number.isInteger(credits) &&
    credits >= minCredits &&
    credits <= maxCredits &&
    (credits - minCredits) % stepCredits === 0;
  if (!validAmount) return 'invalid_amount';
  if (balances(wallet).bought + credits > CREDITS.boughtCap) return 'over_cap';
  return null;
}

function nextLedgerId(wallet: Wallet): string {
  return `led_${String(wallet.ledger.length + 1).padStart(3, '0')}`;
}

function finish(next: Wallet, entry: Omit<LedgerEntry, 'balance_after'>, at: string): WalletResult {
  const b = balances(next, at);
  const full: LedgerEntry = { ...entry, balance_after: { included: b.included, bought: b.bought } };
  next.ledger.push(full);
  next.balances = { included: b.included, bought: b.bought, total: b.total, total_eur_cents: b.totalEurCents };
  next.as_of = at;
  return { ok: true, wallet: next, entry: full };
}

/** Pays `credits` for one item in the §5.1 order and appends a `purchase` entry. */
export function spend(
  wallet: Wallet,
  args: { credits: number; item: PurchaseItem; at: string },
): WalletResult {
  const { credits, item, at } = args;
  if (!Number.isInteger(credits) || credits <= 0) return { ok: false, error: 'invalid_amount' };
  const plan = previewSpend(wallet, credits, { firstParty: item.first_party, now: at });
  if (plan.shortfall > 0) return { ok: false, error: 'insufficient_credits', shortfall: plan.shortfall };

  const next = structuredClone(wallet);
  for (const draw of plan.lots) {
    const lot =
      next.buckets.included.lots.find((l) => l.lot_id === draw.lot_id) ??
      next.buckets.bought.lots.find((l) => l.lot_id === draw.lot_id);
    if (!lot) continue;
    lot.remaining -= draw.credits;
    if (lot.remaining === 0) lot.status = 'spent';
  }
  return finish(
    next,
    {
      id: nextLedgerId(wallet),
      at,
      type: 'purchase',
      credits: -credits,
      eur_cents: -credits * CREDITS.eurCentsPerCredit,
      split: { included: neg(plan.included), bought: neg(plan.bought) },
      lots: plan.lots.map((d) => ({ lot_id: d.lot_id, credits: -d.credits })),
      item: {
        ...item,
        price_credits: credits,
        seller_earns_eur_cents: item.first_party ? 0 : credits * CREDITS.sellerEurCentsPerCredit,
      },
      memo: item.title,
    },
    at,
  );
}

/** Adds a top-up to the Bought wallet, refundable for 14 days (§4, §5.3). */
export function topUp(wallet: Wallet, args: { credits: number; at: string }): WalletResult {
  const { credits, at } = args;
  const error = topUpError(wallet, credits);
  if (error) return { ok: false, error };
  const { eurCents } = topUpQuote(credits);
  const next = structuredClone(wallet);
  const lotId = `buy_demo_${next.buckets.bought.lots.length + 1}`;
  next.buckets.bought.lots.push({
    lot_id: lotId,
    source: 'topup',
    credits,
    paid_eur_cents: eurCents,
    remaining: credits,
    purchased_at: at,
    refundable_until: addDays(at, CREDITS.refundDays.topUp),
    expires_at: null,
    status: 'active',
  });
  return finish(
    next,
    {
      id: nextLedgerId(wallet),
      at,
      type: 'topup',
      wallet: 'bought',
      credits,
      eur_cents: credits * CREDITS.eurCentsPerCredit,
      paid_eur_cents: eurCents,
      lots: [{ lot_id: lotId, credits }],
      ref: { checkout: `cs_demo_${lotId}` },
      memo: `Top-up ${credits} credits for €${(eurCents / 100).toFixed(2)}`,
    },
    at,
  );
}

/** Refund at the lot's actual purchase rate, never more than the original payment. */
export function topUpRefundEurCents(lot: BoughtLot): number {
  return Math.max(0, Math.min(
    Math.round(lot.remaining * lot.paid_eur_cents / lot.credits),
    lot.paid_eur_cents - (lot.refunded_eur_cents ?? 0),
  ));
}

/** Why a top-up lot can't be refunded now, or null when it can. */
export function refundError(wallet: Wallet, lotId: string, now: string = DEMO_NOW): WalletError | null {
  const lot = wallet.buckets.bought.lots.find((l) => l.lot_id === lotId);
  if (!lot) return 'not_found';
  if (ms(now) > ms(lot.refundable_until)) return 'refund_window_closed';
  if (!boughtLotUsable(lot)) return 'nothing_to_refund';
  return null;
}

/** Refunds a top-up's unspent credits within 14 days (§5.3, reason `topup_14_day`). */
export function refundTopUp(wallet: Wallet, args: { lotId: string; at: string }): WalletResult {
  const { lotId, at } = args;
  const error = refundError(wallet, lotId, at);
  if (error) return { ok: false, error };
  const next = structuredClone(wallet);
  const lot = next.buckets.bought.lots.find((l) => l.lot_id === lotId) as BoughtLot;
  const credits = lot.remaining;
  const refundedEurCents = topUpRefundEurCents(lot);
  lot.refunded_eur_cents = (lot.refunded_eur_cents ?? 0) + refundedEurCents;
  lot.remaining = 0;
  lot.status = 'refunded';
  return finish(
    next,
    {
      id: nextLedgerId(wallet),
      at,
      type: 'refund',
      reason: 'topup_14_day',
      wallet: 'bought',
      credits: -credits,
      eur_cents: -credits * CREDITS.eurCentsPerCredit,
      paid_eur_cents: refundedEurCents,
      lots: [{ lot_id: lotId, credits: -credits }],
      memo: `Refunded: ${credits} unspent top-up credits`,
    },
    at,
  );
}

/** Why a purchase can't be returned now, or null when it can (§5.3: not downloaded, within 14 days). */
export function returnError(
  wallet: Wallet,
  purchaseId: string,
  opts: { downloaded: boolean; now?: string },
): WalletError | null {
  const now = opts.now ?? DEMO_NOW;
  const purchase = wallet.ledger.find((e) => e.id === purchaseId && e.type === 'purchase');
  if (!purchase) return 'not_found';
  if (wallet.ledger.some((e) => e.type === 'refund' && e.refund_of === purchaseId)) return 'already_returned';
  if (opts.downloaded) return 'downloaded';
  if (ms(now) > ms(addDays(purchase.at, CREDITS.refundDays.undownloadedItem))) return 'return_window_closed';
  return null;
}

/**
 * Returns an item that wasn't downloaded. The credits go back to the lots they
 * came from (§5.2), and returned included credits get at least 30 days' validity.
 */
export function returnItem(
  wallet: Wallet,
  args: { purchaseId: string; downloaded: boolean; at: string },
): WalletResult {
  const { purchaseId, downloaded, at } = args;
  const error = returnError(wallet, purchaseId, { downloaded, now: at });
  if (error) return { ok: false, error };
  const purchase = wallet.ledger.find((e) => e.id === purchaseId) as LedgerEntry;
  const next = structuredClone(wallet);
  const minValidUntil = addDays(at, 30);
  for (const draw of purchase.lots) {
    const back = -draw.credits;
    const included = next.buckets.included.lots.find((l) => l.lot_id === draw.lot_id);
    if (included) {
      included.remaining += back;
      included.status = 'active';
      if (included.expires_at !== null && ms(included.expires_at) < ms(minValidUntil)) {
        included.expires_at = minValidUntil;
      }
      continue;
    }
    const bought = next.buckets.bought.lots.find((l) => l.lot_id === draw.lot_id);
    if (bought) {
      bought.remaining += back;
      bought.status = 'active';
    }
  }
  const split = purchase.split ?? { included: 0, bought: 0 };
  return finish(
    next,
    {
      id: nextLedgerId(wallet),
      at,
      type: 'refund',
      reason: 'not_downloaded_within_14_days',
      refund_of: purchaseId,
      credits: -purchase.credits,
      eur_cents: -purchase.eur_cents,
      split: { included: neg(split.included), bought: neg(split.bought) },
      lots: purchase.lots.map((d) => ({ lot_id: d.lot_id, credits: -d.credits })),
      seller_reversal_eur_cents: -(purchase.item?.seller_earns_eur_cents ?? 0),
      memo: `Returned: ${purchase.item?.title ?? purchase.memo} (not downloaded)`,
    },
    at,
  );
}
