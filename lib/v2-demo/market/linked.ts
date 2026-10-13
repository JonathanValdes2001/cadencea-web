/**
 * Nightjar's seven Market-linked releases (WEB-V2-SPEC §6.5, RELEASE-LIFECYCLE §7.4).
 * Her songs aren't here: songs are on Cadencea Stream only (DECISIONS.md D19).
 *
 * The Market reads them through `useCurrentRelease` and `usePublicReleases`
 * (release-lifecycle/public.ts) in the browser, and through `seedPublicView`
 * (release-lifecycle/seeds.ts) for the server render. A public view carries
 * title, price, version, cover, lease tiers, Splits terms and "What's new";
 * `LINKED_DETAILS` adds what it doesn't: description, genre, contents, synth,
 * the version history up to the seed, and the seed's BPM, key and tags (the store supplies those instead while the release is public). The
 * details mirror the seeds in seeds.ts; tests/v2-market-data.test.mjs checks
 * that they still agree.
 */
import type { PublicReleaseView } from '../release-lifecycle/public.ts';
import type { KeyValue, Synth } from '../release-lifecycle/types.ts';
import { seedPublicView } from '../release-lifecycle/seeds.ts';
import { ITEM_COPY } from './copy.ts';
import type { FileGroup, FileSpec, VersionEntry } from './types.ts';

/** The release ids behind Market rows, in RELEASE-LIFECYCLE seed order. */
export const LINKED_RELEASE_IDS: readonly string[] = [
  'demo-r02',
  'demo-r07',
  'demo-r09',
  'demo-r10',
  'demo-r11',
  'demo-r13',
  'demo-r15',
];

/** A linked release as buyers see it before any demo action, or null when it was never approved. */
export function linkedSeedView(releaseId: string): PublicReleaseView | null {
  return seedPublicView(releaseId);
}

export interface LinkedDetail {
  description: string;
  genre: string | null;
  /** First went live. */
  publishedAt: string;
  /** Approved versions up to the seed's live one, oldest first. */
  history: readonly VersionEntry[];
  bpm: number | null;
  key: KeyValue;
  tags: readonly string[];
  files?: FileSpec;
  synth?: Synth;
  minSynthVersion?: string;
}

const first = (date: string): VersionEntry => ({ version: 1, date, note: ITEM_COPY.firstRelease });

/** One group per sound, numbered from 01 like the seeds' files ("Tidewater Kick 01.wav"). */
const run = (kind: FileGroup['kind'], count: number, name: string): FileGroup => ({
  kind,
  count,
  names: [name],
  pattern: '{prefix} {name} {n}',
});

export const LINKED_DETAILS: Readonly<Record<string, LinkedDetail>> = {
  'demo-r02': {
    description:
      'Drums recorded in a boathouse at low tide: big wooden kicks, tight snares, toms and shakers, with a few loops to start from.',
    genre: 'downtempo',
    publishedAt: '2026-06-15T13:00:00Z',
    history: [
      first('2026-06-15T13:00:00Z'),
      { version: 2, date: '2026-07-30T12:00:00Z', note: 'Added 16 rim and clap one-shots.' },
    ],
    bpm: 96,
    key: null,
    tags: ['drums', 'organic', 'tape'],
    files: {
      prefix: 'Tidewater',
      groups: [
        run('one_shot', 12, 'Kick'),
        run('one_shot', 12, 'Snare'),
        run('one_shot', 8, 'Tom'),
        run('one_shot', 8, 'Shaker'),
        run('one_shot', 8, 'Rim'),
        run('one_shot', 8, 'Clap'),
        run('loop', 8, 'Loop'),
      ],
    },
  },
  'demo-r07': {
    description: 'A heavy, slow-rolling beat for night drives: detuned 808s, a frozen choir pad and sparse hats.',
    genre: 'trap',
    publishedAt: '2026-08-20T12:00:00Z',
    history: [first('2026-08-20T12:00:00Z')],
    bpm: 140,
    key: { root: 'G', mode: 'Minor' },
    tags: ['dark', '808', 'cinematic'],
  },
  'demo-r09': {
    description: 'Thirty Vital presets that recreate the leads, basses and keys of an old family synth.',
    genre: 'synthwave',
    publishedAt: '2026-06-25T11:00:00Z',
    history: [first('2026-06-25T11:00:00Z')],
    bpm: null,
    key: null,
    tags: ['retro', 'leads', 'vital'],
    synth: 'vital',
    minSynthVersion: '1.5',
    files: {
      prefix: 'OSM',
      groups: [
        run('preset', 10, 'Lead'),
        run('preset', 10, 'Bass'),
        run('preset', 10, 'Keys'),
        { kind: 'demo', count: 1, names: ['Old Synth Memories demo'], pattern: '{name}' },
      ],
    },
  },
  'demo-r10': {
    description: 'Forty hits played on copper pots, pipes and a cymbal from a flea market, recorded close and dry.',
    genre: 'electronic',
    publishedAt: '2026-07-08T12:00:00Z',
    history: [first('2026-07-08T12:00:00Z')],
    bpm: null,
    key: null,
    tags: ['percussion', 'metal', 'one-shots'],
    files: {
      prefix: 'Copper',
      groups: [run('one_shot', 14, 'Snare'), run('one_shot', 14, 'Pipe'), run('one_shot', 12, 'Pot')],
    },
  },
  'demo-r11': {
    description: 'A bright, bouncing beat with glass percussion and a chopped piano.',
    genre: 'hip-hop',
    publishedAt: '2026-07-30T13:00:00Z',
    history: [first('2026-07-30T13:00:00Z')],
    bpm: 96,
    key: { root: 'F', mode: 'Major' },
    tags: ['bounce', 'piano', 'glass'],
  },
  'demo-r13': {
    description: 'Pans, glasses and drawers recorded in a small kitchen, edited into tight one-shots and grooves.',
    genre: 'downtempo',
    publishedAt: '2026-08-12T10:00:00Z',
    history: [first('2026-08-12T10:00:00Z')],
    bpm: null,
    key: null,
    tags: ['percussion', 'foley', 'organic'],
    files: {
      prefix: 'Kitchen',
      groups: [
        run('one_shot', 12, 'Pan'),
        run('one_shot', 12, 'Glass'),
        run('one_shot', 10, 'Drawer'),
        run('loop', 10, 'Groove'),
      ],
    },
  },
  'demo-r15': {
    description: 'A late-night beat with a rattling bus-stop rhythm and a long, warm bassline.',
    genre: 'downtempo',
    publishedAt: '2026-07-12T12:00:00Z',
    history: [first('2026-07-12T12:00:00Z')],
    bpm: 92,
    key: { root: 'B', mode: 'Minor' },
    tags: ['night', 'bass', 'downtempo'],
  },
};
