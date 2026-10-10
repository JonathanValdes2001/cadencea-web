/**
 * The demo wallet and Market library, persisted per browser (WEB-V2-SPEC §2.5).
 *
 * Read them in client components with `useWallet()` and `useMarketLibrary()`.
 * Change them only through the actions below (from event handlers, after the
 * DemoConfirm dialog), so the wallet ledger and the library never disagree.
 * The /credits page (package A) and the Market buy box (package B) share this
 * one module.
 */
import { useMemo } from 'react';
import type { LeaseTierId, Money, SplitTerms } from '../release-lifecycle/types.ts';
import { nextDemoTime } from '../clock.ts';
import { createDemoStore, DEMO_STORAGE_KEYS } from '../storage.ts';
import { useDemoStore } from '../use-demo-store.ts';
import { LIBRARY_SEED, ownedEntry } from './library-seed.ts';
import type { LibraryEntry, MarketLibrary } from './library-seed.ts';
import type { Wallet } from './types.ts';
import { WALLET_SEED } from './wallet-seed.ts';
import { balances, refundTopUp, returnItem, spend, topUp } from './wallet.ts';
import type { Balances, PurchaseItem, WalletError } from './wallet.ts';

/** Bump when CREDITS-MODEL §10 or the library seed changes, so stored demo data reseeds. */
const STORE_VERSION = 'credits-model-2026-10-10';

export const walletStore = createDemoStore<Wallet>({
  key: DEMO_STORAGE_KEYS.credits,
  version: STORE_VERSION,
  seed: WALLET_SEED,
});

export const marketLibraryStore = createDemoStore<MarketLibrary>({
  key: DEMO_STORAGE_KEYS.market,
  version: STORE_VERSION,
  seed: LIBRARY_SEED,
});

export function useWallet(): { wallet: Wallet; balances: Balances } {
  const wallet = useDemoStore(walletStore);
  const current = useMemo(() => balances(wallet), [wallet]);
  return { wallet, balances: current };
}

export function useMarketLibrary(): MarketLibrary {
  return useDemoStore(marketLibraryStore);
}

export type DemoActionResult =
  | { ok: true }
  | { ok: false; error: WalletError | 'already_owned' | 'not_owned'; shortfall?: number };

/** The next demo timestamp, after everything already stored in either store. */
function nextTime(): string {
  const ledger = walletStore.getSnapshot().ledger;
  const entries = marketLibraryStore.getSnapshot().entries;
  const latest = [ledger[ledger.length - 1]?.at, ...entries.map((e) => e.returnedAt ?? e.purchasedAt)]
    .filter((at): at is string => Boolean(at))
    .sort()
    .pop();
  return nextDemoTime(latest);
}

function addEntry(entry: LibraryEntry) {
  marketLibraryStore.update((library) => ({ entries: [...library.entries, entry] }));
}

function updateOwned(key: string, change: (entry: LibraryEntry) => LibraryEntry) {
  marketLibraryStore.update((library) => ({
    entries: library.entries.map((e) => (e.key === key && e.returnedAt === null ? change(e) : e)),
  }));
}

function findOwned(key: string): LibraryEntry | null {
  return marketLibraryStore.getSnapshot().entries.find((e) => e.key === key && e.returnedAt === null) ?? null;
}

interface ListingRef {
  slug: string;
  /** A single file from a pack ("midnight-rhodes-92"). */
  fileId?: string | null;
  title: string;
  /** The Studio release behind a lifecycle-linked listing. */
  releaseId?: string | null;
  /** The live version at the time of purchase. */
  version: number;
}

const entryKey = (slug: string, fileId?: string | null) => (fileId ? `${slug}#${fileId}` : slug);

/**
 * Buys with credits in the CREDITS-MODEL §5.1 spend order and adds the item to the
 * library. A 0-credit Splits pack moves no credits.
 */
export function buyWithCredits(
  args: ListingRef & { credits: number; item: PurchaseItem; splitTerms?: SplitTerms },
): DemoActionResult {
  const library = marketLibraryStore.getSnapshot();
  if (ownedEntry(library, args.slug, args.fileId ?? null)) return { ok: false, error: 'already_owned' };
  const at = nextTime();
  let purchaseLedgerId: string | null = null;
  if (args.credits > 0) {
    const result = spend(walletStore.getSnapshot(), { credits: args.credits, item: args.item, at });
    if (!result.ok) return { ok: false, error: result.error, shortfall: result.shortfall };
    walletStore.update(() => result.wallet);
    purchaseLedgerId = result.entry.id;
  }
  addEntry({
    key: entryKey(args.slug, args.fileId),
    slug: args.slug,
    fileId: args.fileId ?? null,
    title: args.title,
    releaseId: args.releaseId ?? null,
    version: args.version,
    pricePaid: args.credits > 0 ? { kind: 'credits', credits: args.credits } : { kind: 'free' },
    purchaseLedgerId,
    splitTerms: args.splitTerms,
    purchasedAt: at,
    downloaded: false,
    returnedAt: null,
  });
  return { ok: true };
}

/** Records a card purchase (beats). No payment is taken and the wallet doesn't change. */
export function recordCardPurchase(
  args: ListingRef & { amount: Money; leaseTier?: LeaseTierId },
): DemoActionResult {
  const library = marketLibraryStore.getSnapshot();
  if (ownedEntry(library, args.slug, args.fileId ?? null)) return { ok: false, error: 'already_owned' };
  addEntry({
    key: entryKey(args.slug, args.fileId),
    slug: args.slug,
    fileId: args.fileId ?? null,
    title: args.title,
    releaseId: args.releaseId ?? null,
    version: args.version,
    pricePaid: { kind: 'card', amount: args.amount },
    purchaseLedgerId: null,
    leaseTier: args.leaseTier,
    purchasedAt: nextTime(),
    downloaded: false,
    returnedAt: null,
  });
  return { ok: true };
}

/** The download starts: the 14-day right to cancel ends (CREDITS-MODEL §5.3). */
export function markDownloaded(key: string): DemoActionResult {
  if (!findOwned(key)) return { ok: false, error: 'not_owned' };
  updateOwned(key, (entry) => ({ ...entry, downloaded: true }));
  return { ok: true };
}

/** Returns an item that wasn't downloaded within 14 days; the credits go back to their lots. */
export function returnPurchase(key: string): DemoActionResult {
  const entry = findOwned(key);
  if (!entry) return { ok: false, error: 'not_owned' };
  const at = nextTime();
  if (entry.purchaseLedgerId) {
    const result = returnItem(walletStore.getSnapshot(), {
      purchaseId: entry.purchaseLedgerId,
      downloaded: entry.downloaded,
      at,
    });
    if (!result.ok) return { ok: false, error: result.error };
    walletStore.update(() => result.wallet);
  } else if (entry.downloaded) {
    return { ok: false, error: 'downloaded' };
  }
  updateOwned(key, (e) => ({ ...e, returnedAt: at }));
  return { ok: true };
}

export function addTopUp(eurCents: number): DemoActionResult {
  const result = topUp(walletStore.getSnapshot(), { eurCents, at: nextTime() });
  if (!result.ok) return { ok: false, error: result.error };
  walletStore.update(() => result.wallet);
  return { ok: true };
}

export function refundTopUpLot(lotId: string): DemoActionResult {
  const result = refundTopUp(walletStore.getSnapshot(), { lotId, at: nextTime() });
  if (!result.ok) return { ok: false, error: result.error };
  walletStore.update(() => result.wallet);
  return { ok: true };
}

/** "Reset demo wallet": CREDITS-MODEL §10 and Maya's seeded library again. */
export function resetWalletDemo(): void {
  walletStore.reset();
  marketLibraryStore.reset();
}
