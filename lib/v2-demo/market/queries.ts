/**
 * Search, filters, sorting and "similar sounds" for the Market (WEB-V2-SPEC
 * §1.2, §4.3, §4.4). Filters live in the query string so a copied link shows
 * the same results:
 *   ?q=&bpm=120-140&half=1&key=F%23m,Am&tag=dark,808&genre=drill&max=100&synth=vital&lic=stems&sort=new
 * `bpm` is "min-max", "min-" or "-max" (inclusive). `max` is in credits (at
 * most); `maxEur` is for beats (the cheapest lease costs less than it).
 */
import type { KeyValue, Synth } from '../release-lifecycle/types.ts';
import { decodeKey, encodeKey, PITCH_CLASSES } from '../format.ts';
import { getSeller } from '../sellers.ts';
import { comparablePriceCents, creditPrice, fromEurCents, STEM_TIERS } from './display.ts';
import type { MarketListing } from './types.ts';

/** Every query key the Market reads; any of them on /market shows the "All results" view. */
export const FILTER_PARAM_KEYS = ['q', 'bpm', 'half', 'key', 'tag', 'genre', 'max', 'maxEur', 'synth', 'lic', 'sort'] as const;

export const SORT_KEYS = ['new', 'price-asc', 'price-desc', 'bpm-asc', 'title'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const LICENSE_FILTERS = ['stems', 'exclusive'] as const;
export type LicenseFilter = (typeof LICENSE_FILTERS)[number];

const SYNTHS: readonly Synth[] = ['serum2', 'vital'];

export interface MarketFilters {
  q: string;
  bpmMin: number | null;
  bpmMax: number | null;
  /** Also match half and double the tempo (Detect's metrical alternates). */
  half: boolean;
  /** Key codes: "F#m", "A", "none" for No key. Any of them matches. */
  keys: readonly string[];
  /** Every tag must match. */
  tags: readonly string[];
  /** Any genre matches. */
  genres: readonly string[];
  /** Credits, at most. */
  max: number | null;
  /** Beats: the cheapest lease costs less than this many euros. */
  maxEur: number | null;
  synths: readonly Synth[];
  /** Every license feature must be offered. */
  license: readonly LicenseFilter[];
  sort: SortKey;
}

export const EMPTY_FILTERS: MarketFilters = {
  q: '',
  bpmMin: null,
  bpmMax: null,
  half: false,
  keys: [],
  tags: [],
  genres: [],
  max: null,
  maxEur: null,
  synths: [],
  license: [],
  sort: 'new',
};

/** Next's `searchParams` object or a URLSearchParams. */
export type ParamSource = { get(name: string): string | null } | Record<string, string | string[] | undefined>;

function reader(source: ParamSource): (name: string) => string {
  if (typeof (source as { get?: unknown }).get === 'function') {
    return (name) => (source as { get(name: string): string | null }).get(name) ?? '';
  }
  return (name) => {
    const value = (source as Record<string, string | string[] | undefined>)[name];
    return (Array.isArray(value) ? value[0] : value) ?? '';
  };
}

const list = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const unique = <T>(values: readonly T[]) => [...new Set(values)];

function wholeNumber(value: string, max: number): number | null {
  if (!/^\d{1,4}$/.test(value)) return null;
  const n = Number(value);
  return n <= max ? n : null;
}

export function parseFilters(source: ParamSource): MarketFilters {
  const get = reader(source);
  const [minText = '', maxText = ''] = get('bpm').split('-');
  const sort = get('sort') as SortKey;
  return {
    q: get('q').trim(),
    bpmMin: wholeNumber(minText, 999),
    bpmMax: wholeNumber(maxText, 999),
    half: get('half') === '1',
    keys: unique(list(get('key')).filter((code) => decodeKey(code) !== undefined)),
    tags: unique(list(get('tag').toLowerCase())),
    genres: unique(list(get('genre').toLowerCase())),
    max: wholeNumber(get('max'), 9999),
    maxEur: wholeNumber(get('maxEur'), 9999),
    synths: unique(list(get('synth')).filter((s): s is Synth => (SYNTHS as readonly string[]).includes(s))),
    license: unique(
      list(get('lic')).filter((l): l is LicenseFilter => (LICENSE_FILTERS as readonly string[]).includes(l)),
    ),
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? sort : 'new',
  };
}

const encodeList = (values: readonly string[]) => values.map(encodeURIComponent).join(',');

/** The query string for `filters`, without "?", omitting defaults. parseFilters(serializeFilters(f)) equals f. */
export function serializeFilters(filters: MarketFilters): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`q=${encodeURIComponent(filters.q)}`);
  if (filters.bpmMin !== null || filters.bpmMax !== null) {
    parts.push(`bpm=${filters.bpmMin ?? ''}-${filters.bpmMax ?? ''}`);
  }
  if (filters.half) parts.push('half=1');
  if (filters.keys.length) parts.push(`key=${encodeList(filters.keys)}`);
  if (filters.tags.length) parts.push(`tag=${encodeList(filters.tags)}`);
  if (filters.genres.length) parts.push(`genre=${encodeList(filters.genres)}`);
  if (filters.max !== null) parts.push(`max=${filters.max}`);
  if (filters.maxEur !== null) parts.push(`maxEur=${filters.maxEur}`);
  if (filters.synths.length) parts.push(`synth=${encodeList(filters.synths)}`);
  if (filters.license.length) parts.push(`lic=${encodeList(filters.license)}`);
  if (filters.sort !== 'new') parts.push(`sort=${filters.sort}`);
  return parts.join('&');
}

/** How many filters are set (search and sort excluded). */
export function activeFilterCount(filters: MarketFilters): number {
  return (
    (filters.bpmMin !== null || filters.bpmMax !== null ? 1 : 0) +
    filters.keys.length +
    filters.tags.length +
    filters.genres.length +
    (filters.max !== null ? 1 : 0) +
    (filters.maxEur !== null ? 1 : 0) +
    filters.synths.length +
    filters.license.length
  );
}

/** Everything a search term can match: title, seller, tags, genre and type. */
function haystack(listing: MarketListing): string {
  const seller = getSeller(listing.sellerHandle);
  return [listing.title, seller?.displayName, listing.sellerHandle, listing.genre, ...listing.tags, listing.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesBpm(listing: MarketListing, filters: MarketFilters): boolean {
  if (filters.bpmMin === null && filters.bpmMax === null) return true;
  if (typeof listing.bpm !== 'number') return false;
  const min = filters.bpmMin ?? 0;
  const max = filters.bpmMax ?? Infinity;
  const tempos = filters.half ? [listing.bpm, listing.bpm / 2, listing.bpm * 2] : [listing.bpm];
  return tempos.some((t) => t >= min && t <= max);
}

function matchesKey(listing: MarketListing, keys: readonly string[]): boolean {
  if (!keys.length) return true;
  if (listing.key === undefined || listing.key === 'various') return false;
  return keys.includes(encodeKey(listing.key));
}

/** Applies every filter except the sort. */
export function filterItems(listings: readonly MarketListing[], filters: MarketFilters): MarketListing[] {
  const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
  return listings.filter((listing) => {
    if (words.length) {
      const text = haystack(listing);
      if (!words.every((word) => text.includes(word))) return false;
    }
    if (!matchesBpm(listing, filters)) return false;
    if (!matchesKey(listing, filters.keys)) return false;
    if (filters.tags.length) {
      const tags = listing.tags.map((t) => t.toLowerCase());
      if (!filters.tags.every((t) => tags.includes(t.toLowerCase()))) return false;
    }
    if (filters.genres.length) {
      const genre = listing.genre?.toLowerCase();
      if (!genre || !filters.genres.some((g) => g.toLowerCase() === genre)) return false;
    }
    if (filters.max !== null) {
      const credits = creditPrice(listing.price);
      if (credits === null || credits > filters.max) return false;
    }
    if (filters.maxEur !== null) {
      const from = fromEurCents(listing.leaseTiers);
      if (from === null || from >= filters.maxEur * 100) return false;
    }
    if (filters.synths.length && !(listing.synth && filters.synths.includes(listing.synth))) return false;
    if (filters.license.includes('stems') && !listing.leaseTiers.some((t) => STEM_TIERS.includes(t.tier))) {
      return false;
    }
    if (filters.license.includes('exclusive') && !listing.leaseTiers.some((t) => t.tier === 'exclusive')) {
      return false;
    }
    return true;
  });
}

const byTitle = (a: MarketListing, b: MarketListing) =>
  a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });

/** Missing values sort last in either direction. */
function compareNullable(a: number | null, b: number | null, direction: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
}

/** Returns a sorted copy; ties fall back to the title. */
export function sortItems(listings: readonly MarketListing[], sort: SortKey): MarketListing[] {
  const compare: Record<SortKey, (a: MarketListing, b: MarketListing) => number> = {
    new: (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    'price-asc': (a, b) => compareNullable(comparablePriceCents(a), comparablePriceCents(b), 1),
    'price-desc': (a, b) => compareNullable(comparablePriceCents(a), comparablePriceCents(b), -1),
    'bpm-asc': (a, b) =>
      compareNullable(typeof a.bpm === 'number' ? a.bpm : null, typeof b.bpm === 'number' ? b.bpm : null, 1),
    title: () => 0,
  };
  return [...listings].sort((a, b) => compare[sort](a, b) || byTitle(a, b));
}

const semitone = (key: Exclude<KeyValue, null>) => PITCH_CLASSES.indexOf(key.root);

/**
 * Keys that sound related (WEB-V2-SPEC §4.4): the same key, its relative major
 * or minor, or a neighbor on the circle of fifths in the same mode. Two
 * "No key" listings count as the same key.
 */
export function isRelatedKey(a: KeyValue, b: KeyValue): boolean {
  if (a === null || b === null) return a === b;
  const interval = (semitone(b) - semitone(a) + 12) % 12;
  if (a.mode === b.mode) return interval === 0 || interval === 5 || interval === 7;
  // The relative major sits three semitones above the minor.
  return a.mode === 'Minor' ? interval === 3 : interval === 9;
}

/**
 * "Similar sounds": public listings in the same category with a BPM within ±8
 * or a related key, closest BPM first, at most `limit`.
 */
export function similarItems(
  listing: MarketListing,
  listings: readonly MarketListing[],
  limit = 4,
): MarketListing[] {
  const bpm = typeof listing.bpm === 'number' ? listing.bpm : null;
  const distance = (other: MarketListing) =>
    bpm !== null && typeof other.bpm === 'number' ? Math.abs(other.bpm - bpm) : null;
  const keyed = (key: MarketListing['key']): key is KeyValue => key !== undefined && key !== 'various';
  return listings
    .filter((other) => {
      if (other.slug === listing.slug || !other.isPublic || other.category !== listing.category) return false;
      const d = distance(other);
      if (d !== null && d <= 8) return true;
      return keyed(listing.key) && keyed(other.key) && isRelatedKey(listing.key, other.key);
    })
    .sort((a, b) => compareNullable(distance(a), distance(b), 1) || byTitle(a, b))
    .slice(0, limit);
}

/** A seller's public listings, newest first. */
export function itemsBySeller(handle: string, listings: readonly MarketListing[]): MarketListing[] {
  return sortItems(
    listings.filter((l) => l.sellerHandle === handle && l.isPublic),
    'new',
  );
}

/** The most used tags in `listings`, most frequent first (ties alphabetical). */
export function topTags(listings: readonly MarketListing[], count = 12): string[] {
  const counts = new Map<string, number>();
  for (const listing of listings) {
    for (const tag of listing.tags) counts.set(tag.toLowerCase(), (counts.get(tag.toLowerCase()) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
    .slice(0, count)
    .map(([tag]) => tag);
}

/** The genres present in `listings`, alphabetical. */
export function genresOf(listings: readonly MarketListing[]): string[] {
  return unique(listings.map((l) => l.genre?.toLowerCase()).filter((g): g is string => Boolean(g))).sort((a, b) =>
    a.localeCompare(b, 'en'),
  );
}
