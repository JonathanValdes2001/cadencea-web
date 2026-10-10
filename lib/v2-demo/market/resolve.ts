/**
 * Turns the seed rows into the listings the pages render (WEB-V2-SPEC §4.2,
 * §4.4, §6.4–§6.5).
 *
 * - Seed rows render as written.
 * - Nightjar's linked rows take title, price, version, cover, lease tiers,
 *   Splits terms and "What's new" from the release's current revision
 *   (`useCurrentRelease`), and BPM, key and tags from `usePublicReleases` while
 *   the release is public. Pending revisions never show (RELEASE-LIFECYCLE §6.7).
 * - Releases approved in this browser's Studio demo that have no Market row
 *   become "Your demo release" listings that link to Studio.
 *
 * `buildListings({}, [])` is the seed state the server renders.
 */
import type { PublicReleaseListing, PublicReleaseView } from '../release-lifecycle/public.ts';
import type { BpmString, LeaseTier } from '../release-lifecycle/types.ts';
import { categoryForType } from '../categories.ts';
import { ITEM_COPY } from './copy.ts';
import { splitTermsFor } from './display.ts';
import { MARKET_ITEMS } from './items.ts';
import { LINKED_DETAILS, linkedSeedView } from './linked.ts';
import type { LinkedItem, MarketLeaseTier, MarketListing, PackBpm, SeedItem, VersionEntry } from './types.ts';

function toBpm(bpm: BpmString | null): PackBpm {
  if (bpm === null || bpm === '') return null;
  const n = Number(bpm);
  return Number.isFinite(n) ? n : null;
}

function marketTiers(tiers: readonly LeaseTier[] | undefined): MarketLeaseTier[] {
  return (tiers ?? [])
    .filter((t) => t.enabled)
    .map((t) => ({ tier: t.tier, priceEurCents: t.price.amountMinor }));
}

/** A version history that ends at the live version, adding the live one when the store is ahead. */
function historyUpTo(history: readonly VersionEntry[], view: PublicReleaseView): VersionEntry[] {
  const known = history.filter((v) => v.version < view.version);
  const live = history.find((v) => v.version === view.version);
  return [
    ...known,
    { version: view.version, date: view.updatedAt, note: view.whatsNew ?? live?.note ?? ITEM_COPY.firstRelease },
  ];
}

export function resolveSeedItem(item: SeedItem): MarketListing {
  const live = item.versions[item.versions.length - 1];
  return {
    slug: item.slug,
    href: `/market/${item.slug}`,
    title: item.title,
    type: item.type,
    category: categoryForType(item.type).key,
    sellerHandle: item.seller,
    releaseId: null,
    demoRelease: false,
    isPublic: true,
    status: 'live',
    featured: item.featured === true,
    bpm: item.bpm,
    key: item.key,
    genre: item.genre,
    tags: item.tags,
    price: item.price,
    leaseTiers: item.leaseTiers ?? [],
    splitTerms: item.splits ? splitTermsFor(item.splits.publishing, item.splits.advance, item.seller) : null,
    synth: item.synth ?? null,
    minSynthVersion: item.minSynthVersion ?? null,
    song: item.song ?? null,
    description: item.description,
    publishedAt: item.publishedAt,
    updatedAt: live.date,
    version: live.version,
    whatsNew: live.version > 1 ? live.note : null,
    versions: item.versions,
    coverSeed: item.slug,
    cover: item.cover ?? {},
    files: item.files ?? null,
  };
}

/** The musical fields a grid filters on. */
type MusicFields = Pick<MarketListing, 'bpm' | 'key' | 'tags'>;

/**
 * A Nightjar release as buyers see it. `view` is the store's current revision
 * (or the seed view); `fields` are the store's BPM, key and tags, or the seed's.
 * Songs show no download price in this build (WEB-V2-SPEC §7.2 #2), so a song
 * with a card download sale still reads "On Cadencea Stream".
 */
export function resolveLinkedItem(item: LinkedItem, view: PublicReleaseView, fields: MusicFields): MarketListing {
  const detail = LINKED_DETAILS[item.releaseId];
  return {
    slug: item.slug,
    href: `/market/${item.slug}`,
    title: view.title,
    type: item.type,
    category: categoryForType(item.type).key,
    sellerHandle: item.seller,
    releaseId: item.releaseId,
    demoRelease: false,
    isPublic: view.isPublic,
    status: view.status,
    featured: false,
    bpm: fields.bpm,
    key: fields.key,
    genre: detail?.genre ?? null,
    tags: fields.tags,
    price: item.type === 'song' ? { kind: 'stream_only' } : view.price,
    leaseTiers: marketTiers(view.leaseTiers),
    splitTerms: view.splitTerms ?? null,
    synth: detail?.synth ?? null,
    minSynthVersion: detail?.minSynthVersion ?? null,
    song: detail?.song ?? null,
    description: detail?.description ?? '',
    publishedAt: detail?.publishedAt ?? view.updatedAt,
    updatedAt: view.updatedAt,
    version: view.version,
    whatsNew: view.whatsNew,
    versions: historyUpTo(detail?.history ?? [], view),
    coverSeed: view.coverSeed,
    cover: {},
    files: detail?.files ?? null,
  };
}

/** A release approved in the Studio demo with no Market row: its card links to Studio (WEB-V2-SPEC §4.2). */
export function demoReleaseListing(release: PublicReleaseListing): MarketListing {
  return {
    slug: release.slug,
    href: `/studio/${release.releaseId}`,
    title: release.title,
    type: release.type,
    category: categoryForType(release.type).key,
    sellerHandle: release.sellerHandle,
    releaseId: release.releaseId,
    demoRelease: true,
    isPublic: release.isPublic,
    status: release.status,
    featured: false,
    bpm: toBpm(release.bpm),
    key: release.key,
    genre: null,
    tags: release.tags,
    price: release.type === 'song' ? { kind: 'stream_only' } : release.price,
    leaseTiers: marketTiers(release.leaseTiers),
    splitTerms: release.splitTerms ?? null,
    synth: null,
    minSynthVersion: null,
    song: null,
    description: '',
    publishedAt: release.updatedAt,
    updatedAt: release.updatedAt,
    version: release.version,
    whatsNew: release.whatsNew,
    versions: historyUpTo([], release),
    coverSeed: release.coverSeed,
    cover: {},
    files: null,
  };
}

/**
 * Every listing: the 50 seed rows (linked ones resolved against `views`, with
 * their seed view as the fallback) plus public demo releases. Off-sale rows are
 * included with `isPublic: false`, so item pages can explain them.
 */
export function buildListings(
  views: Readonly<Record<string, PublicReleaseView | null | undefined>>,
  publicReleases: readonly PublicReleaseListing[],
): MarketListing[] {
  const linkedIds = new Set<string>();
  const listings = MARKET_ITEMS.map((item) => {
    if (item.source === 'seed') return resolveSeedItem(item);
    linkedIds.add(item.releaseId);
    const view = views[item.releaseId] ?? linkedSeedView(item.releaseId);
    if (!view) throw new Error(`No public view for ${item.releaseId}`);
    const listed = publicReleases.find((r) => r.releaseId === item.releaseId);
    const detail = LINKED_DETAILS[item.releaseId];
    const fields: MusicFields = listed
      ? { bpm: toBpm(listed.bpm), key: listed.key, tags: listed.tags }
      : { bpm: detail.bpm, key: detail.key, tags: detail.tags };
    return resolveLinkedItem(item, view, fields);
  });
  const demo = publicReleases
    .filter((r) => r.isPublic && !linkedIds.has(r.releaseId))
    .map(demoReleaseListing);
  return [...listings, ...demo];
}

/** The listings as the server renders them (no browser state). */
export const SEED_LISTINGS: readonly MarketListing[] = buildListings({}, []);

export function seedListing(slug: string): MarketListing | null {
  return SEED_LISTINGS.find((l) => l.slug === slug) ?? null;
}
