/**
 * Display helpers for Market listings: labels, counts, prices and the rules
 * that decide what a pack can sell file by file. Pure, so pages, cards and
 * tests agree.
 */
import type { LeaseTierId, PitchClass, Price, ReleaseType, SplitTerms, Synth } from '../release-lifecycle/types.ts';
import { CREDITS } from '../credits/config.ts';
import type { PurchaseItem } from '../credits/wallet.ts';
import { fill, formatBytes, formatKey } from '../format.ts';
import { getSeller } from '../sellers.ts';
import { LEASE_RIGHTS } from './copy.ts';
import { countFiles } from './files.ts';
import type {
  FileSpec,
  MarketFile,
  MarketFileKind,
  MarketLeaseTier,
  MarketListing,
  PackBpm,
  PackKey,
  SongShape,
} from './types.ts';

/** The files a pack is priced by: a pack never costs more than these one by one (CREDITS-MODEL §6.1). */
export const PRICED_KINDS: Readonly<Partial<Record<ReleaseType, readonly MarketFileKind[]>>> = {
  sample_pack: ['one_shot', 'loop'],
  splits_pack: ['loop'],
  preset_pack: ['preset'],
  midi_pack: ['midi'],
};

/** Fixed single-item prices (CREDITS-MODEL §6.1). Demos aren't sold on their own. */
export const SINGLE_FILE_CREDITS: Readonly<Record<MarketFileKind, number | null>> = {
  one_shot: CREDITS.priceList.oneShot,
  loop: CREDITS.priceList.loop,
  midi: CREDITS.priceList.midiFile,
  preset: CREDITS.priceList.preset,
  demo: null,
};

/** Sample, preset and MIDI packs sell single files; Splits packs don't (WEB-V2-SPEC §7.2 #5). */
const SELLS_SINGLE_FILES: readonly ReleaseType[] = ['sample_pack', 'preset_pack', 'midi_pack'];

/** The credit price of one file from a pack, or null when it isn't sold on its own. */
export function singleFileCredits(type: ReleaseType, file: MarketFile): number | null {
  return SELLS_SINGLE_FILES.includes(type) ? SINGLE_FILE_CREDITS[file.kind] : null;
}

export function sellerName(handle: string): string {
  return getSeller(handle)?.displayName ?? handle;
}

export function isFirstParty(handle: string): boolean {
  return getSeller(handle)?.firstParty === true;
}

export function bpmLabel(bpm: PackBpm): string {
  if (bpm === 'various') return 'Various';
  return bpm === null ? '—' : String(bpm);
}

export function keyLabel(key: PackKey): string {
  if (key === 'various') return 'Various';
  return key === undefined ? '—' : formatKey(key);
}

export const SYNTH_LABEL: Readonly<Record<Synth, string>> = { serum2: 'Serum 2', vital: 'Vital' };

/** "Serum 2.0 or later" (RELEASE-LIFECYCLE §3.2 minimum synth version). */
export function synthVersionLabel(synth: Synth, minVersion: string | null): string {
  const name = synth === 'serum2' ? 'Serum' : 'Vital';
  return minVersion ? `${name} ${minVersion} or later` : SYNTH_LABEL[synth];
}

export function songFormatLabel(song: SongShape): string {
  if (song.format === 'single') return 'Single';
  const name = song.format === 'ep' ? 'EP' : 'Album';
  return `${name} · ${song.tracks} tracks`;
}

const GENRE_LABEL: Readonly<Record<string, string>> = { 'uk garage': 'UK garage', 'r&b': 'R&B' };

/** Genres are stored lowercase like tags; "uk garage" → "UK garage", "drill" → "Drill". */
export function genreLabel(genre: string): string {
  return GENRE_LABEL[genre] ?? genre.charAt(0).toUpperCase() + genre.slice(1);
}

/** The items a pack is priced by, or null for beats, songs and themes. */
export function itemCount(type: ReleaseType, files: FileSpec | null): number | null {
  const kinds = PRICED_KINDS[type];
  return kinds && files ? countFiles(files, kinds) : null;
}

/** The items a listing's live version is priced by: a newer Studio-demo version's files, else the seed contents. */
function listingItemCount(listing: MarketListing): number | null {
  const kinds = PRICED_KINDS[listing.type];
  if (!kinds || !listing.revisionFiles) return itemCount(listing.type, listing.files);
  return listing.revisionFiles.filter((f) => kinds.includes(f.kind)).length;
}

/** "76 files", "12 loops", "64 presets", "60 MIDI files". */
export function countLabel(listing: MarketListing): string | null {
  const n = listingItemCount(listing);
  if (n === null) return null;
  const unit = { sample_pack: 'files', splits_pack: 'loops', preset_pack: 'presets', midi_pack: 'MIDI files' }[
    listing.type as 'sample_pack' | 'splits_pack' | 'preset_pack' | 'midi_pack'
  ];
  return `${n} ${unit}`;
}

/** The card's meta row (WEB-V2-SPEC §4.2): "128 BPM · F# Minor · 48 files", whatever applies. */
export function cardMeta(listing: MarketListing): string[] {
  const parts: string[] = [];
  if (listing.type === 'theme') return ['Vault theme'];
  if (listing.song) parts.push(songFormatLabel(listing.song));
  if (listing.synth) parts.push(SYNTH_LABEL[listing.synth]);
  if (typeof listing.bpm === 'number') parts.push(`${listing.bpm} BPM`);
  if (listing.key && listing.key !== 'various') parts.push(formatKey(listing.key));
  const count = countLabel(listing);
  if (count) parts.push(count);
  return parts;
}

const KIND_LABEL: Readonly<Record<MarketFileKind, [string, string]>> = {
  one_shot: ['one-shot', 'one-shots'],
  loop: ['loop', 'loops'],
  preset: ['preset', 'presets'],
  midi: ['MIDI file', 'MIDI files'],
  demo: ['audio demo', 'audio demos'],
};

/** "64 one-shots · 12 loops", "40 presets · 1 audio demo". */
export function contentsSummary(files: readonly MarketFile[]): string {
  const order: MarketFileKind[] = ['one_shot', 'loop', 'preset', 'midi', 'demo'];
  return order
    .map((kind) => [kind, files.filter((f) => f.kind === kind).length] as const)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${n} ${KIND_LABEL[kind][n === 1 ? 0 : 1]}`)
    .join(' · ');
}

/** What PreviewPlayer needs from a listing or a file: one tempo and one key, or none. */
export function playerTuning(
  bpm: PackBpm,
  key: PackKey,
): { bpm: number | null; keyRoot: PitchClass | null; keyMode: 'Major' | 'Minor' | null } {
  const tonal = key !== undefined && key !== 'various' && key !== null ? key : null;
  return {
    bpm: typeof bpm === 'number' ? bpm : null,
    keyRoot: tonal?.root ?? null,
    keyMode: tonal?.mode ?? null,
  };
}

/** Credits for a credit or 0-credit price; null for card, per-tier and stream-only prices. */
export function creditPrice(price: Price): number | null {
  if (price.kind === 'credits') return price.credits;
  return price.kind === 'free' ? 0 : null;
}

/** The cheapest enabled lease ("From €30"). */
export function fromEurCents(tiers: readonly MarketLeaseTier[]): number | null {
  return tiers.length ? Math.min(...tiers.map((t) => t.priceEurCents)) : null;
}

/** One euro-cent figure per listing, so prices of every kind sort together; null when there is no price. */
export function comparablePriceCents(listing: MarketListing): number | null {
  const credits = creditPrice(listing.price);
  if (credits !== null) return credits * CREDITS.eurCentsPerCredit;
  if (listing.price.kind === 'card') return listing.price.amount.amountMinor;
  if (listing.price.kind === 'per_tier') return fromEurCents(listing.leaseTiers);
  return null;
}

/** The Splits terms the Price component prints after the price (DECISIONS.md D2). */
export function priceTerms(listing: MarketListing): { publishing: number; advance: number } | undefined {
  const terms = listing.splitTerms;
  return terms ? { publishing: terms.publishingSharePct, advance: terms.advanceSharePct } : undefined;
}

/** "€12.00" without the sign, for templates that already carry "€{eur}". */
export function eurDigits(eurCents: number): string {
  return (eurCents / 100).toFixed(2);
}

/** "1.2 GB · WAV", "2.4 MB · Vital presets", "180 KB · MIDI". */
export function sizeAndFormat(files: readonly MarketFile[], synth: Synth | null): string {
  const bytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const kinds = new Set(files.map((f) => f.kind));
  let format = 'WAV';
  if (kinds.has('preset')) format = `${SYNTH_LABEL[synth ?? 'serum2']} presets${kinds.has('demo') ? ' + WAV demo' : ''}`;
  else if (kinds.has('midi')) format = `MIDI${kinds.has('demo') ? ' + WAV demo' : ''}`;
  return `${formatBytes(bytes)} · ${format}`;
}

/** The `cadencea_splits_v1` terms of a pack, with the default credit line (RELEASE-LIFECYCLE §3.4). */
export function splitTermsFor(
  publishing: 25 | 50,
  advance: 0 | 25 | 50,
  sellerHandle: string,
): SplitTerms {
  return {
    templateId: 'cadencea_splits_v1',
    termsVersion: '1',
    publishingSharePct: publishing,
    advanceSharePct: advance,
    creditLine: `co-prod. by ${sellerName(sellerHandle)}`,
  };
}

const streams = new Intl.NumberFormat('en-US');

/** "WAV, up to 500,000 streams" (WEB-V2-SPEC §4.4 tier table, CREDITS-MODEL §6.2 caps). */
export function leaseRightsLine(tier: LeaseTierId): string {
  const cap = CREDITS.beatTiers[tier].streams;
  return fill(LEASE_RIGHTS[tier], { streams: cap === null ? '' : streams.format(cap) });
}

export function leaseLabel(tier: LeaseTierId): string {
  return CREDITS.beatTiers[tier].label;
}

/** Tiers that deliver stems: Stems, Unlimited and Exclusive (the whole project). */
export const STEM_TIERS: readonly LeaseTierId[] = ['stems', 'unlimited', 'exclusive'];

/** The ledger's description of a purchase: the whole listing, or one file from a pack. */
export function purchaseItemFor(listing: MarketListing, file?: MarketFile): PurchaseItem {
  const id = `mk_${listing.slug}${file ? `_${file.id}` : ''}`.replace(/-/g, '_');
  return {
    id,
    title: file ? file.name.replace(/\.[^.]+$/, '') : listing.title,
    kind: file ? file.kind : listing.type,
    seller: sellerName(listing.sellerHandle),
    first_party: isFirstParty(listing.sellerHandle),
  };
}
