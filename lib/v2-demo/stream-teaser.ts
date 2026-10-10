/**
 * Data for the /stream teaser (WEB-V2-SPEC §4.9, §6.7).
 *
 * The phone mocks show three releases from the Stream demo's own listener
 * catalogue (STREAM-SPEC §4.1–§4.4, copied from cadencea-stream's seed when this
 * file was written), so the teaser and the demo show the same artists. Nightjar's
 * songs aren't in that catalogue, so none appear here. Listeners see only the
 * review date, the DAW and the stem count (RELEASE-LIFECYCLE §9.1, DECISIONS.md D9).
 *
 * PAYOUT_EXAMPLE is STREAM-SPEC §2.7's golden case "Supporter monthly, NOK 49,
 * 900 min, 12% model", which the Stream demo's Money screen shows.
 */
import type { PaletteName } from './cover.ts';
import type { KeyValue } from './release-lifecycle/types.ts';
import { DEMO_NOW, addDays } from './clock.ts';

export interface TeaserTrack {
  title: string;
  bpm: number;
  key: KeyValue;
}

export interface TeaserRelease {
  /** STREAM-SPEC release id. */
  id: string;
  title: string;
  artist: string;
  home: string;
  genre: string;
  kind: 'Single' | 'EP' | 'Album';
  daw: string;
  stems: number;
  /** The current version's approval: "Reviewed by Cadencea on {date}". STREAM-SPEC dates count back from demo today. */
  reviewedAt: string;
  /** Written by the artist at publish time; not review data. */
  linerNote: string;
  palette: PaletteName;
  tracks: readonly TeaserTrack[];
}

const daysAgo = (days: number) => addDays(DEMO_NOW, -days);

export const TEASER_RELEASES: readonly TeaserRelease[] = [
  {
    id: 'r07',
    title: 'Heather & Stone',
    artist: 'Lyngheia',
    home: 'Bø i Telemark',
    genre: 'Indie folk',
    kind: 'Album',
    daw: 'Reaper',
    stems: 72,
    reviewedAt: daysAgo(99),
    linerNote: '120 days in the making: we tracked the fiddles in the kitchen.',
    palette: 'moss',
    tracks: [
      { title: 'Heather & Stone', bpm: 96, key: { root: 'D', mode: 'Major' } },
      { title: 'Telemark Lullaby', bpm: 70, key: { root: 'A', mode: 'Minor' } },
      { title: 'Stavkirke', bpm: 88, key: { root: 'E', mode: 'Minor' } },
      { title: 'Summer Pasture', bpm: 104, key: { root: 'G', mode: 'Major' } },
      { title: 'When the Lake Freezes', bpm: 80, key: { root: 'B', mode: 'Minor' } },
    ],
  },
  {
    id: 'r08',
    title: 'Low Tide Tapes',
    artist: 'Tidevann',
    home: 'Stavanger',
    genre: 'Instrumental hip-hop',
    kind: 'EP',
    daw: 'FL Studio',
    stems: 24,
    reviewedAt: daysAgo(44),
    linerNote: '35 days of dusty keys and harbour field notes.',
    palette: 'tide',
    tracks: [
      { title: 'Low Tide', bpm: 88, key: { root: 'A', mode: 'Minor' } },
      { title: 'Breakwater', bpm: 92, key: { root: 'D', mode: 'Minor' } },
      { title: 'Harbour Cranes', bpm: 84, key: { root: 'F#', mode: 'Major' } },
    ],
  },
  {
    id: 'r01',
    title: 'Polar Glass',
    artist: 'Saga Elvenes',
    home: 'Tromsø',
    genre: 'Art-pop',
    kind: 'EP',
    daw: 'Ableton Live 12',
    stems: 46,
    reviewedAt: daysAgo(37),
    linerNote: '63 days in the making: the strings went down in one take on a snowy Sunday.',
    palette: 'ice',
    tracks: [
      { title: 'Polar Glass', bpm: 96, key: { root: 'F#', mode: 'Minor' } },
      { title: 'Midnight Sun Is a Liar', bpm: 104, key: { root: 'A', mode: 'Major' } },
      { title: 'Kvitøya', bpm: 88, key: { root: 'C#', mode: 'Minor' } },
    ],
  },
];

export function teaserRelease(id: string): TeaserRelease {
  const release = TEASER_RELEASES.find((r) => r.id === id);
  if (!release) throw new Error(`Unknown teaser release ${id}`);
  return release;
}

/** The Discover hero (STREAM-SPEC §4.5 editorial: r07), the release-page mock (r08) and the rail, newest review first. */
export const DISCOVER_HERO_ID = 'r07';
export const RELEASE_PAGE_ID = 'r08';
export const NEW_VERIFIED_IDS = [...TEASER_RELEASES]
  .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))
  .map((r) => r.id);

export type PayoutRowKind = 'price' | 'deduction' | 'net' | 'share';

export interface PayoutRow {
  id: 'price' | 'vat' | 'card' | 'songwriters' | 'delivery' | 'net' | 'artists' | 'cadencea';
  label: string;
  /** Integer øre; deductions are negative. */
  ore: number;
  kind: PayoutRowKind;
}

export interface PayoutExample {
  plan: string;
  billing: 'monthly' | 'yearly';
  listenedMinutes: number;
  /** STREAM-SPEC's display rate, for the "about €" approximations. */
  nokPerEur: number;
  rows: readonly PayoutRow[];
}

export const PAYOUT_EXAMPLE: PayoutExample = {
  plan: 'Supporter',
  billing: 'monthly',
  listenedMinutes: 900,
  nokPerEur: 11.7,
  rows: [
    { id: 'price', label: 'Price', ore: 4900, kind: 'price' },
    { id: 'vat', label: 'VAT (25%)', ore: -980, kind: 'deduction' },
    { id: 'card', label: 'Card fees', ore: -376, kind: 'deduction' },
    { id: 'songwriters', label: 'Songwriters (TONO, 12%)', ore: -470, kind: 'deduction' },
    { id: 'delivery', label: 'Delivery (15 hours of lossless streaming)', ore: -63, kind: 'deduction' },
    { id: 'net', label: 'Net', ore: 3011, kind: 'net' },
    { id: 'artists', label: 'Artists you played (75%)', ore: 2258, kind: 'share' },
    { id: 'cadencea', label: 'Cadencea (25%)', ore: 753, kind: 'share' },
  ],
};

export function payoutRow(id: PayoutRow['id']): PayoutRow {
  const row = PAYOUT_EXAMPLE.rows.find((r) => r.id === id);
  if (!row) throw new Error(`Unknown payout row ${id}`);
  return row;
}

/** Euro cents for an øre amount at NOK_PER_EUR, rounded: 4900 øre → 419 (about €4.19). */
export function oreToEurCents(ore: number): number {
  return Math.round(ore / PAYOUT_EXAMPLE.nokPerEur);
}
