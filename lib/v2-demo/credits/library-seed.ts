/**
 * Maya Lind's Market library, derived from the purchases in the CREDITS-MODEL §10
 * ledger (WEB-V2-SPEC §2.5, §6.1). Items are named by Market slug, so the slugs
 * here must match package B's `market/items.ts`.
 *
 * - Tape Drums Vol. 1 (led_003), Dusty Keys (led_005) and the single loop
 *   Midnight Rhodes 92 BPM from Copper Tape Loops (led_012) are downloaded.
 * - Velvet Pads (led_013, 7 Oct 2026) isn't, so it can still be returned.
 * - Analog Bass (led_007) was returned (led_008) and is kept only as history.
 */
import type { LeaseTierId, PaidPrice, SplitTerms } from '../release-lifecycle/types.ts';

export interface LibraryEntry {
  /** The slug, plus "#{fileId}" for a single file bought from a pack. At most one owned (not returned) entry per key. */
  key: string;
  slug: string;
  /** A single file from a pack; its item-page anchor is `#file-{fileId}`. */
  fileId: string | null;
  title: string;
  /** Set for listings linked to a Studio release (WEB-V2-SPEC §6.5). */
  releaseId: string | null;
  /** The version bought (RELEASE-LIFECYCLE §8 `Entitlement.version`). */
  version: number;
  pricePaid: PaidPrice;
  /** The wallet ledger entry of a credit purchase, used for returns. */
  purchaseLedgerId: string | null;
  leaseTier?: LeaseTierId;
  splitTerms?: SplitTerms;
  purchasedAt: string;
  downloaded: boolean;
  returnedAt: string | null;
}

export interface MarketLibrary {
  entries: LibraryEntry[];
}

export const LIBRARY_SEED: MarketLibrary = {
  entries: [
    {
      key: 'tape-drums-vol-1',
      slug: 'tape-drums-vol-1',
      fileId: null,
      title: 'Tape Drums Vol. 1',
      releaseId: null,
      version: 1,
      pricePaid: { kind: 'credits', credits: 20 },
      purchaseLedgerId: 'led_003',
      purchasedAt: '2026-08-05T20:31:00Z',
      downloaded: true,
      returnedAt: null,
    },
    {
      key: 'dusty-keys',
      slug: 'dusty-keys',
      fileId: null,
      title: 'Dusty Keys: Lo-fi Sample Pack',
      releaseId: null,
      version: 1,
      pricePaid: { kind: 'credits', credits: 120 },
      purchaseLedgerId: 'led_005',
      purchasedAt: '2026-08-21T21:02:00Z',
      downloaded: true,
      returnedAt: null,
    },
    {
      key: 'analog-bass',
      slug: 'analog-bass',
      fileId: null,
      title: 'Analog Bass (Serum 2)',
      releaseId: null,
      version: 1,
      pricePaid: { kind: 'credits', credits: 60 },
      purchaseLedgerId: 'led_007',
      purchasedAt: '2026-09-12T16:20:00Z',
      downloaded: false,
      returnedAt: '2026-09-14T09:05:00Z',
    },
    {
      key: 'copper-tape-loops#midnight-rhodes-92',
      slug: 'copper-tape-loops',
      fileId: 'midnight-rhodes-92',
      title: 'Midnight Rhodes 92 BPM',
      releaseId: null,
      version: 1,
      pricePaid: { kind: 'credits', credits: 1 },
      purchaseLedgerId: 'led_012',
      purchasedAt: '2026-10-06T22:47:00Z',
      downloaded: true,
      returnedAt: null,
    },
    {
      key: 'velvet-pads',
      slug: 'velvet-pads',
      fileId: null,
      title: 'Velvet Pads (Vital)',
      releaseId: null,
      version: 1,
      pricePaid: { kind: 'credits', credits: 30 },
      purchaseLedgerId: 'led_013',
      purchasedAt: '2026-10-07T19:15:00Z',
      downloaded: false,
      returnedAt: null,
    },
  ],
};

/** The entry Maya currently owns for a slug (or slug + file), ignoring returned ones. */
export function ownedEntry(library: MarketLibrary, slug: string, fileId: string | null = null): LibraryEntry | null {
  return (
    library.entries.find((e) => e.slug === slug && e.returnedAt === null && (e.fileId === fileId || (fileId !== null && e.fileId === null))) ?? null
  );
}

/** Credit valid purchases toward this pack version, counting each current file once. */
export function packCompletionPrice(
  library: MarketLibrary,
  args: { slug: string; version: number; credits: number; files: readonly { id: string; credits: number }[] },
): { credits: number; priorCredits: number; ownedCount: number } {
  const files = new Map(args.files.map((file) => [file.id, file.credits]));
  const owned = new Set<string>();
  let priorCredits = 0;
  for (const entry of library.entries) {
    if (entry.slug !== args.slug || entry.version !== args.version || entry.returnedAt !== null || entry.fileId === null || !files.has(entry.fileId) || owned.has(entry.fileId)) continue;
    owned.add(entry.fileId);
    if (entry.pricePaid.kind === 'credits') priorCredits += entry.pricePaid.credits;
  }
  const remainingFilesPrice = args.files.filter((file) => !owned.has(file.id)).reduce((sum, file) => sum + file.credits, 0);
  return {
    credits: owned.size ? Math.max(0, Math.min(args.credits - priorCredits, remainingFilesPrice)) : args.credits,
    priorCredits,
    ownedCount: owned.size,
  };
}
