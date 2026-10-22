'use client';

import React, { useMemo } from 'react';
import { CheckboxField, TextField } from '@/components/ui/Field';
import type { FilterField } from '@/lib/v2-demo/categories';
import { PITCH_CLASSES, encodeKey } from '@/lib/v2-demo/format';
import { FILTER_COPY } from '@/lib/v2-demo/market/copy';
import { SYNTH_LABEL, genreLabel } from '@/lib/v2-demo/market/display';
import { genresOf, topTags, type LicenseFilter, type MarketFilters } from '@/lib/v2-demo/market/queries';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import type { Synth } from '@/lib/v2-demo/release-lifecycle/types';

export const FIELD_ORDER: readonly FilterField[] = ['bpm', 'key', 'genre', 'tags', 'price', 'synth', 'license'];
const SYNTHS: readonly Synth[] = ['serum2', 'vital'];

export const FIELD_TITLE: Readonly<Record<FilterField, string>> = {
  bpm: FILTER_COPY.bpmTitle,
  key: FILTER_COPY.keyTitle,
  genre: FILTER_COPY.genreTitle,
  tags: FILTER_COPY.tagsTitle,
  price: FILTER_COPY.priceTitle,
  synth: FILTER_COPY.synthTitle,
  license: FILTER_COPY.licenseTitle,
};

/** The toggle chip used by BPM presets, keys and tags (aria-pressed carries the state, not the color). */
export const filterChipClass = (pressed: boolean, padding = 'px-3') =>
  `inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-sm border text-sm pointer-coarse:h-11 ${padding} ${
    pressed
      ? 'border-brand-600 bg-brand-50 font-medium text-brand-800'
      : 'border-line bg-canvas text-ink-muted hover:border-line-strong hover:text-ink'
  }`;

const toggle = <T,>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

type PriceOption = { label: string; patch: Pick<MarketFilters, 'max' | 'maxEur'> };

/** Credit categories filter on credits, beats on the WAV lease in euros (WEB-V2-SPEC §4.3). */
function priceOptions(unit: 'credits' | 'eur'): PriceOption[] {
  const options: PriceOption[] =
    unit === 'credits'
      ? FILTER_COPY.creditPriceOptions.map((o) => ({ label: o.label, patch: { max: o.max, maxEur: null } }))
      : FILTER_COPY.beatPriceOptions.map((o) => ({ label: o.label, patch: { max: null, maxEur: o.maxEur } }));
  return [...options, { label: FILTER_COPY.anyPrice, patch: { max: null, maxEur: null } }];
}

function parseBpm(value: string): number | null {
  const n = Number(value);
  return value.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

export interface FilterFieldProps {
  /** Keeps ids unique when the filter row and the mobile sheet are both in the page. */
  idPrefix: string;
  filters: MarketFilters;
  onChange: (patch: Partial<MarketFilters>) => void;
  priceUnit: 'credits' | 'eur' | null;
  pool: readonly MarketListing[];
}

/** The fields that have something to choose from in this pool (no genres, no tags or no price hide theirs). */
export function availableFields(
  fields: readonly FilterField[],
  pool: readonly MarketListing[],
  priceUnit: 'credits' | 'eur' | null,
): FilterField[] {
  return FIELD_ORDER.filter((field) => {
    if (!fields.includes(field)) return false;
    if (field === 'genre') return genresOf(pool).length > 0;
    if (field === 'tags') return topTags(pool, 1).length > 0;
    if (field === 'price') return priceUnit !== null;
    return true;
  });
}

/** The tags offered: the top 12 in view, plus any chosen ones that fell out of it. */
export function useTagOptions(pool: readonly MarketListing[], chosen: readonly string[]): string[] {
  return useMemo(() => {
    const top = topTags(pool, 12);
    return [...top, ...chosen.filter((t) => !top.includes(t))];
  }, [pool, chosen]);
}

/**
 * One Market filter field (WEB-V2-SPEC §4.3) as a fieldset: its legend and its
 * controls. Every change goes straight to the URL through `onChange`.
 */
export function FilterFieldControls({
  field,
  idPrefix,
  filters,
  onChange,
  priceUnit,
  pool,
  legendClassName = 'mb-3 text-sm font-semibold text-ink',
}: FilterFieldProps & { field: FilterField; legendClassName?: string }) {
  const genres = useMemo(() => genresOf(pool), [pool]);
  const tags = useTagOptions(pool, filters.tags);
  const legend = <legend className={legendClassName}>{FIELD_TITLE[field]}</legend>;

  switch (field) {
    case 'bpm':
      return (
        <fieldset>
          {legend}
          {/* Uncontrolled, re-mounted when the range changes elsewhere; committed on blur or Enter. */}
          <div key={`${filters.bpmMin}-${filters.bpmMax}`} className="grid grid-cols-2 gap-3">
            {(['bpmMin', 'bpmMax'] as const).map((bound) => (
              <TextField
                key={bound}
                id={`${idPrefix}-${bound}`}
                label={bound === 'bpmMin' ? FILTER_COPY.bpmMin : FILTER_COPY.bpmMax}
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                defaultValue={filters[bound] ?? ''}
                onBlur={(e) => {
                  const next = parseBpm(e.currentTarget.value);
                  if (next !== filters[bound]) onChange({ [bound]: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTER_COPY.bpmPresets.map((preset) => {
              const pressed = filters.bpmMin === preset.min && filters.bpmMax === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() =>
                    onChange(pressed ? { bpmMin: null, bpmMax: null } : { bpmMin: preset.min, bpmMax: preset.max })
                  }
                  className={`${filterChipClass(pressed)} tabular-nums`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <CheckboxField
            id={`${idPrefix}-half`}
            label={FILTER_COPY.halfTime}
            checked={filters.half}
            onChange={(e) => onChange({ half: e.currentTarget.checked })}
            className="mt-4"
          />
        </fieldset>
      );

    case 'key':
      return (
        <fieldset>
          {legend}
          {(['Minor', 'Major'] as const).map((mode) => (
            <div key={mode} role="group" aria-labelledby={`${idPrefix}-key-${mode}`} className="mb-3">
              <p id={`${idPrefix}-key-${mode}`} className="mb-1.5 text-xs text-ink-subtle">
                {mode === 'Minor' ? FILTER_COPY.minor : FILTER_COPY.major}
              </p>
              <div className="grid grid-cols-6 gap-1">
                {PITCH_CLASSES.map((root) => {
                  const code = encodeKey({ root, mode });
                  const pressed = filters.keys.includes(code);
                  return (
                    <button
                      key={root}
                      type="button"
                      aria-pressed={pressed}
                      aria-label={`${root} ${mode}`}
                      onClick={() => onChange({ keys: toggle(filters.keys, code) })}
                      className={`${filterChipClass(pressed, 'px-0')} tabular-nums`}
                    >
                      {root}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filters.keys.includes('none')}
              onClick={() => onChange({ keys: toggle(filters.keys, 'none') })}
              className={filterChipClass(filters.keys.includes('none'))}
            >
              {FILTER_COPY.noKey}
            </button>
            <button
              type="button"
              aria-pressed={filters.keys.length === 0}
              onClick={() => onChange({ keys: [] })}
              className={filterChipClass(filters.keys.length === 0)}
            >
              {FILTER_COPY.anyKey}
            </button>
          </div>
        </fieldset>
      );

    case 'genre':
      if (!genres.length) return null;
      return (
        <fieldset>
          {legend}
          <div className="space-y-2">
            {genres.map((genre) => (
              <CheckboxField
                key={genre}
                id={`${idPrefix}-genre-${genre.replace(/[^a-z0-9]+/g, '-')}`}
                label={genreLabel(genre)}
                checked={filters.genres.includes(genre)}
                onChange={() => onChange({ genres: toggle(filters.genres, genre) })}
              />
            ))}
          </div>
        </fieldset>
      );

    case 'tags':
      if (!tags.length) return null;
      return (
        <fieldset>
          {legend}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const pressed = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onChange({ tags: toggle(filters.tags, tag) })}
                  className={filterChipClass(pressed)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>
      );

    case 'price':
      if (!priceUnit) return null;
      return (
        <fieldset>
          {legend}
          <div className="space-y-1">
            {priceOptions(priceUnit).map((option, index) => {
              const id = `${idPrefix}-price-${index}`;
              const checked = filters.max === option.patch.max && filters.maxEur === option.patch.maxEur;
              return (
                <div key={option.label} className="flex min-h-9 items-center gap-3 pointer-coarse:min-h-11">
                  <input
                    id={id}
                    type="radio"
                    name={`${idPrefix}-price`}
                    checked={checked}
                    onChange={() => onChange(option.patch)}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
                  />
                  <label htmlFor={id} className="cursor-pointer text-sm text-ink">
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      );

    case 'synth':
      return (
        <fieldset>
          {legend}
          <div className="space-y-2">
            {SYNTHS.map((synth) => (
              <CheckboxField
                key={synth}
                id={`${idPrefix}-synth-${synth}`}
                label={SYNTH_LABEL[synth]}
                checked={filters.synths.includes(synth)}
                onChange={() => onChange({ synths: toggle(filters.synths, synth) })}
              />
            ))}
          </div>
        </fieldset>
      );

    case 'license':
      return (
        <fieldset>
          {legend}
          <div className="space-y-2">
            {FILTER_COPY.licenseOptions.map((option) => (
              <CheckboxField
                key={option.value}
                id={`${idPrefix}-license-${option.value}`}
                label={option.label}
                checked={filters.license.includes(option.value)}
                onChange={() => onChange({ license: toggle<LicenseFilter>(filters.license, option.value) })}
              />
            ))}
          </div>
        </fieldset>
      );
  }
}

/**
 * Every filter field of a category, stacked with rules between them: the
 * mobile filter sheet (WEB-V2-SPEC §3.6). Which fields show depends on the
 * category; genres and tags are built from the listings in view.
 */
export default function FilterPanel({
  fields,
  ...props
}: FilterFieldProps & {
  fields: readonly FilterField[];
}) {
  return (
    <div>
      {availableFields(fields, props.pool, props.priceUnit).map((field) => (
        <div key={field} className="border-t border-line py-5 first:border-t-0 first:pt-0">
          <FilterFieldControls field={field} {...props} />
        </div>
      ))}
    </div>
  );
}
