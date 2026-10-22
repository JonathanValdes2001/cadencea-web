/**
 * Option lists for the Publish wizard (RELEASE-LIFECYCLE §5.4, §5.5). RL keeps
 * them "with the copy" so they can change without a spec-version bump; copy.ts
 * is a frozen W0 transcription, so they live here (demo values).
 */
import type { CreditRole, DawKind, PresetCategory } from './types.ts';

/** §5.4 GENRES. Every genre on a Market or Studio seed must be one of these. */
export const GENRES = [
  'Afrobeats', 'Amapiano', 'Ambient', 'Bass', 'Boom bap', 'Cinematic', 'Classical', 'Dance', 'Downtempo',
  'Drill', 'Drum & bass', 'Dubstep', 'Electronic', 'Folk', 'Grime', 'Hip-hop', 'House', 'Indie', 'Indie folk',
  'Jazz', 'Lo-fi', 'Neo-classical', 'Pop', 'R&B', 'Rock', 'Synth-pop', 'Synthwave', 'Techno', 'Trap',
  'UK garage', 'Other',
] as const;

/** §5.4 MOODS (up to 3 per release). */
export const MOODS = [
  'aggressive', 'bright', 'chill', 'dark', 'dreamy', 'energetic', 'melancholic', 'playful', 'tense', 'uplifting', 'warm',
] as const;

export const MAX_MOODS = 3;
export const MAX_TAGS = 10;
export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 24;

/** §5.5 preset categories, in the doc's order. */
export const PRESET_CATEGORIES: readonly PresetCategory[] = [
  'bass', 'lead', 'pad', 'pluck', 'keys', 'arp', 'fx', 'drum', 'texture',
];

export const CREDIT_ROLE_LABEL: Readonly<Record<CreditRole, string>> = {
  writer: 'Writer',
  composer: 'Composer',
  lyricist: 'Lyricist',
  producer: 'Producer',
  co_producer: 'Co-producer',
  performer: 'Performer',
  vocalist: 'Vocalist',
  mixing_engineer: 'Mixing engineer',
  mastering_engineer: 'Mastering engineer',
};

export const DAW_LABEL: Readonly<Record<DawKind, string>> = {
  ableton: 'Ableton Live',
  fl_studio: 'FL Studio',
  logic: 'Logic Pro',
  pro_tools: 'Pro Tools',
  cubase: 'Cubase',
  reaper: 'Reaper',
  reason: 'Reason',
  studio_one: 'Studio One',
  bitwig: 'Bitwig Studio',
  sonar: 'Sonar',
  cakewalk: 'Cakewalk',
  garageband: 'GarageBand',
  other: 'DAW',
};

/** "an Ableton Live", "a Logic Pro": RL §9.7's evidence line hardcodes "a {daw} session". */
export function dawWithArticle(daw: DawKind): string {
  const label = DAW_LABEL[daw];
  return `${daw === 'ableton' || daw === 'fl_studio' ? 'an' : 'a'} ${label}`;
}

/** Songs: "Available in Norway first" (§3.2); the seller can add territories. ISO 3166-1 alpha-2. */
export const TERRITORIES: readonly { code: string; label: string }[] = [
  { code: 'NO', label: 'Norway' },
  { code: 'SE', label: 'Sweden' },
  { code: 'DK', label: 'Denmark' },
  { code: 'FI', label: 'Finland' },
  { code: 'IS', label: 'Iceland' },
  { code: 'DE', label: 'Germany' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IE', label: 'Ireland' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'PT', label: 'Portugal' },
];

/** Track language: ISO 639-1, or `zxx` for "No lyrics". */
export const LANGUAGES: readonly { code: string; label: string }[] = [
  { code: 'zxx', label: 'No lyrics' },
  { code: 'en', label: 'English' },
  { code: 'no', label: 'Norwegian' },
  { code: 'se', label: 'Northern Sami' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
];

export const VITAL_TIERS = [
  { value: 'none', label: 'No paid tier needed' },
  { value: 'basic', label: 'Vital Basic' },
  { value: 'plus', label: 'Vital Plus' },
  { value: 'pro', label: 'Vital Pro' },
] as const;

export const SYNTH_LABEL = { serum2: 'Serum 2', vital: 'Vital' } as const;
export const SYNTH_EXTENSION = { serum2: 'serumpreset', vital: 'vital' } as const;
