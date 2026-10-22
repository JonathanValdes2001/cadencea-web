/**
 * The browse frame shared by /market, every category view and "All results"
 * (WEB-V2-SPEC §4.2, §4.3): category tints, the grid/list view and how many
 * filters each filter button holds. Pure, so pages and tests agree.
 */
import type { CategoryKey, FilterField } from '../categories.ts';
import type { MarketFilters, ParamSource } from './queries.ts';

/**
 * Each category's accent, taken from a cover palette (WEB-V2-SPEC §3.4) so the
 * tint matches the art: `onDark` for text and rules on the showroom surface,
 * `solid` for dots on white (decorative only, never the only signal), `glow`
 * for the header band's radial light.
 */
export interface CategoryTint {
  onDark: string;
  solid: string;
  glow: string;
}

const VIOLET: CategoryTint = { onDark: '#C4B5FD', solid: '#7C3AED', glow: 'rgba(124, 58, 237, 0.55)' };

export const CATEGORY_TINT: Readonly<Record<CategoryKey | 'all', CategoryTint>> = {
  all: VIOLET,
  samples: { onDark: '#FDBA74', solid: '#EA580C', glow: 'rgba(234, 88, 12, 0.50)' },
  splits: { onDark: '#FDE68A', solid: '#CA8A04', glow: 'rgba(202, 138, 4, 0.48)' },
  presets: { onDark: '#F9A8D4', solid: '#DB2777', glow: 'rgba(219, 39, 119, 0.48)' },
  midi: { onDark: '#67E8F9', solid: '#0891B2', glow: 'rgba(8, 145, 178, 0.52)' },
  beats: { onDark: '#A5B4FC', solid: '#4F46E5', glow: 'rgba(79, 70, 229, 0.58)' },
  themes: VIOLET,
};

export const VIEW_MODES = ['grid', 'list'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/**
 * Packs keep the /market card grid; beats are listened to one by one, so they
 * open as rows (the Splice pattern: rows for single sounds, cards for packs).
 * Every view can switch.
 */
export const DEFAULT_VIEW: Readonly<Record<CategoryKey | 'all', ViewMode>> = {
  all: 'grid',
  samples: 'grid',
  splits: 'grid',
  presets: 'grid',
  midi: 'grid',
  beats: 'list',
  themes: 'grid',
};

/** `?view=grid|list`; anything else falls back to the category's default. */
export function parseView(source: ParamSource, category: CategoryKey | null): ViewMode {
  const raw =
    typeof (source as { get?: unknown }).get === 'function'
      ? (source as { get(name: string): string | null }).get('view')
      : (source as Record<string, string | string[] | undefined>).view;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (VIEW_MODES as readonly string[]).includes(value ?? '')
    ? (value as ViewMode)
    : DEFAULT_VIEW[category ?? 'all'];
}

/** The `view=` part of the query string, omitted when it is the default. */
export function serializeView(view: ViewMode, category: CategoryKey | null): string {
  return view === DEFAULT_VIEW[category ?? 'all'] ? '' : `view=${view}`;
}

/** What "Clear" in a filter button's panel resets. */
export const FIELD_CLEAR: Readonly<Record<FilterField, Partial<MarketFilters>>> = {
  bpm: { bpmMin: null, bpmMax: null, half: false },
  key: { keys: [] },
  genre: { genres: [] },
  tags: { tags: [] },
  price: { max: null, maxEur: null },
  synth: { synths: [] },
  license: { license: [] },
};

/** How many choices a filter button holds, for its "Key 2" count. */
export function fieldCount(field: FilterField, f: MarketFilters): number {
  switch (field) {
    case 'bpm':
      return f.bpmMin !== null || f.bpmMax !== null ? 1 : 0;
    case 'key':
      return f.keys.length;
    case 'genre':
      return f.genres.length;
    case 'tags':
      return f.tags.length;
    case 'price':
      return f.max !== null || f.maxEur !== null ? 1 : 0;
    case 'synth':
      return f.synths.length;
    case 'license':
      return f.license.length;
  }
}
