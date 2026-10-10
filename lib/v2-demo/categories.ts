/**
 * Market categories in nav order (WEB-V2-SPEC §1.1, §4.3), each mapped to a
 * RELEASE-LIFECYCLE release type. There is no templates category in v2.
 */
import type { ReleaseType } from './release-lifecycle/types.ts';

export const CATEGORY_KEYS = ['samples', 'splits', 'presets', 'midi', 'beats', 'songs', 'themes'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Filter panel fields (§4.3); each category lists the ones it shows. */
export type FilterField = 'bpm' | 'key' | 'genre' | 'tags' | 'price' | 'synth' | 'license';

export interface Category {
  key: CategoryKey;
  type: ReleaseType;
  label: string;
  description: string;
  filters: readonly FilterField[];
  /** What the price filter counts in: credits (`max`), euros for beats (`maxEur`), or no price filter. */
  priceUnit: 'credits' | 'eur' | null;
}

export const CATEGORIES: readonly Category[] = [
  {
    key: 'samples',
    type: 'sample_pack',
    label: 'Sample packs',
    description:
      'One-shots, loops and textures recorded and designed by people. Royalty-free for your own releases. Single sounds cost 1 credit (€0.10).',
    filters: ['bpm', 'key', 'genre', 'tags', 'price'],
    priceUnit: 'credits',
  },
  {
    key: 'splits',
    type: 'splits_pack',
    label: 'Splits',
    description:
      'Loop packs with royalty terms attached. If your song comes out, the loop maker gets the agreed share and credit.',
    filters: ['bpm', 'key', 'genre', 'tags', 'price'],
    priceUnit: 'credits',
  },
  {
    key: 'presets',
    type: 'preset_pack',
    label: 'Preset packs',
    description: 'Presets for Serum 2 or Vital, each pack with an audio demo and the minimum synth version.',
    filters: ['synth', 'key', 'genre', 'tags', 'price'],
    priceUnit: 'credits',
  },
  {
    key: 'midi',
    type: 'midi_pack',
    label: 'MIDI packs',
    description: 'Chord progressions, melodies and drum patterns to drop into any DAW and make your own.',
    filters: ['bpm', 'key', 'genre', 'tags', 'price'],
    priceUnit: 'credits',
  },
  {
    key: 'beats',
    type: 'beat',
    label: 'Beats',
    description: 'Lease or buy beats from independent producers, with clear license terms. Paid by card.',
    filters: ['bpm', 'key', 'genre', 'tags', 'price', 'license'],
    priceUnit: 'eur',
  },
  {
    key: 'songs',
    type: 'song',
    label: 'Songs',
    description: 'Music from artists on Cadencea Stream. Listen and support artists there.',
    filters: ['bpm', 'key', 'genre', 'tags'],
    priceUnit: null,
  },
  {
    key: 'themes',
    type: 'theme',
    label: 'Themes',
    description: 'Looks for Cadencea Vault, made by Cadencea.',
    filters: ['tags'],
    priceUnit: null,
  },
];

export const CATEGORY_BY_KEY: Readonly<Record<CategoryKey, Category>> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, Category>;

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

export function categoryForType(type: ReleaseType): Category {
  return CATEGORIES.find((c) => c.type === type) as Category;
}

/** Singular labels for type badges and chips ("Sample pack", "Beat"). */
export const RELEASE_TYPE_LABEL: Readonly<Record<ReleaseType, string>> = {
  song: 'Song',
  beat: 'Beat',
  preset_pack: 'Preset pack',
  sample_pack: 'Sample pack',
  splits_pack: 'Splits pack',
  midi_pack: 'MIDI pack',
  theme: 'Theme',
};

/** Path segments under /market that no item slug may use (§1.1). */
export const RESERVED_MARKET_SEGMENTS: readonly string[] = [...CATEGORY_KEYS, 'u'];
