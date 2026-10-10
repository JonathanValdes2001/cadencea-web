/**
 * Market data types (WEB-V2-SPEC §4.2–§4.5, §6.4).
 *
 * A `MarketItem` is one row of the seed in items.ts: either a listing with its
 * own data, or one of Nightjar's releases whose data lives in the lifecycle
 * store. A `MarketListing` is what the pages render: either kind resolved
 * against the store (resolve.ts), plus releases approved in this browser's
 * Studio demo that have no Market row.
 */
import type { CategoryKey } from '../categories.ts';
import type { Motif, PaletteName } from '../cover.ts';
import type {
  IsoDateTime,
  KeyValue,
  LeaseTierId,
  Price,
  ReleaseStatus,
  ReleaseType,
  SplitTerms,
  Synth,
} from '../release-lifecycle/types.ts';

/** Pack-level tempo: a BPM, 'various' when it differs per file, or null when there is none (foley, one-shots). */
export type PackBpm = number | 'various' | null;

/**
 * Pack-level key: a key, or null for "No key"; 'various' when it differs per
 * file or track; undefined where keys don't apply (themes).
 */
export type PackKey = KeyValue | 'various' | undefined;

export type MarketFileKind = 'one_shot' | 'loop' | 'preset' | 'midi' | 'demo';

/** A run of generated files; files.ts turns it into names, lengths and sizes. */
export interface FileGroup {
  kind: MarketFileKind;
  count: number;
  /** Cycled through; each repeat of a name gets the next number. */
  names: readonly string[];
  /** Name template with {prefix}, {name}, {n} (two digits), {bpm} and {key}. Default "{prefix}_{name}_{n}". */
  pattern?: string;
  /** Per-file tempos, cycled. Default: the pack BPM for loops, MIDI and demos; none for one-shots. */
  bpms?: readonly number[];
  /** Per-file key codes (WEB-V2-SPEC §1.2 encoding), cycled. Default: the pack key for loops, MIDI and demos; "No key" for one-shots. */
  keys?: readonly string[];
}

export interface FileSpec {
  /** Short code that starts generated file names ("DD1" → DD1_Kick_Round_01.wav). */
  prefix: string;
  groups: readonly FileGroup[];
}

export interface MarketFile {
  /** Anchor on the item page (`#file-{id}`) and the single-file purchase id. */
  id: string;
  name: string;
  kind: MarketFileKind;
  bytes: number;
  /** null for presets. */
  durationMs: number | null;
  bpm: number | null;
  /** undefined for presets. */
  key: KeyValue | undefined;
}

export interface VersionEntry {
  version: number;
  date: IsoDateTime;
  /** The change note ("What's new in version {n}"). */
  note: string;
}

/** A beat lease on sale (CREDITS-MODEL §6.2, RELEASE-LIFECYCLE §3.3): enabled tiers only. */
export interface MarketLeaseTier {
  tier: LeaseTierId;
  priceEurCents: number;
}

export interface SongShape {
  format: 'single' | 'ep' | 'album';
  tracks: number;
}

interface ItemBase {
  /** Never a category key or "u" (WEB-V2-SPEC §1.1). */
  slug: string;
  title: string;
  type: ReleaseType;
  /** Seller handle (sellers.ts). */
  seller: string;
}

/** A listing whose data lives in items.ts. */
export interface SeedItem extends ItemBase {
  source: 'seed';
  /** One of the editorial "Featured by Cadencea" cards on /market. */
  featured?: boolean;
  bpm: PackBpm;
  key: PackKey;
  genre: string | null;
  tags: readonly string[];
  price: Price;
  /** Beats: the enabled lease tiers. */
  leaseTiers?: readonly MarketLeaseTier[];
  /** Splits packs: `cadencea_splits_v1` values; the credit line is "co-prod. by {seller}" (RL §3.4). */
  splits?: { publishing: 25 | 50; advance: 0 | 25 | 50 };
  synth?: Synth;
  /** "2.0" → "Serum 2.0 or later". */
  minSynthVersion?: string;
  song?: SongShape;
  description: string;
  publishedAt: IsoDateTime;
  /** Oldest first; the last entry is the live version. */
  versions: readonly VersionEntry[];
  files?: FileSpec;
  cover?: { palette?: PaletteName; motif?: Motif };
}

/**
 * One of Nightjar's releases (RELEASE-LIFECYCLE §7.4, WEB-V2-SPEC §6.5). It has
 * no BPM, key, tags, price or contents here: they come from the release's
 * current revision.
 */
export interface LinkedItem extends ItemBase {
  source: 'lifecycle';
  releaseId: string;
}

export type MarketItem = SeedItem | LinkedItem;

/** Everything a card, grid or item page shows for one listing. */
export interface MarketListing {
  slug: string;
  /** The item page, or `/studio/{releaseId}` for a demo release (WEB-V2-SPEC §4.2). */
  href: string;
  title: string;
  type: ReleaseType;
  category: CategoryKey;
  sellerHandle: string;
  /** The Studio release behind the listing; null for seed rows. */
  releaseId: string | null;
  /** Approved in this browser's Studio demo, with no Market row ("Your demo release"). */
  demoRelease: boolean;
  /** On sale: shown in grids and buyable. Off-sale linked releases keep an item page. */
  isPublic: boolean;
  status: ReleaseStatus;
  featured: boolean;
  bpm: PackBpm;
  key: PackKey;
  genre: string | null;
  tags: readonly string[];
  price: Price;
  leaseTiers: readonly MarketLeaseTier[];
  splitTerms: SplitTerms | null;
  synth: Synth | null;
  minSynthVersion: string | null;
  song: SongShape | null;
  description: string;
  publishedAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** The live (approved) version. */
  version: number;
  /** The change note of the live version; null for a first release. */
  whatsNew: string | null;
  versions: readonly VersionEntry[];
  coverSeed: string;
  cover: { palette?: PaletteName; motif?: Motif };
  files: FileSpec | null;
}
