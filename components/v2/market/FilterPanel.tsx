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

const FIELD_ORDER: readonly FilterField[] = ['bpm', 'key', 'genre', 'tags', 'price', 'synth', 'license'];
const SYNTHS: readonly Synth[] = ['serum2', 'vital'];

const chip = (pressed: boolean, padding = 'px-3') =>
  `inline-flex h-9 items-center justify-center rounded-sm border text-sm pointer-coarse:h-11 ${padding} ${
    pressed
      ? 'border-accent bg-accent-soft font-medium text-accent-ink'
      : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{title}</legend>
        {children}
      </fieldset>
    </div>
  );
}

/**
 * The Market filter fields (WEB-V2-SPEC §4.3). Which sections show depends on
 * the category; genres and tags are built from the listings in view. Every
 * change goes straight to the URL through `onChange`.
 */
export default function FilterPanel({
  idPrefix,
  filters,
  onChange,
  fields,
  priceUnit,
  pool,
}: {
  /** Keeps ids unique when the sidebar and the mobile sheet are both in the page. */
  idPrefix: string;
  filters: MarketFilters;
  onChange: (patch: Partial<MarketFilters>) => void;
  fields: readonly FilterField[];
  priceUnit: 'credits' | 'eur' | null;
  pool: readonly MarketListing[];
}) {
  const genres = useMemo(() => genresOf(pool), [pool]);
  const tags = useMemo(() => {
    const top = topTags(pool, 12);
    return [...top, ...filters.tags.filter((t) => !top.includes(t))];
  }, [pool, filters.tags]);

  const sections: Partial<Record<FilterField, React.ReactNode>> = {
    bpm: (
      <Section title={FILTER_COPY.bpmTitle}>
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
                className={chip(pressed)}
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
      </Section>
    ),
    key: (
      <Section title={FILTER_COPY.keyTitle}>
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
                    className={`${chip(pressed, 'px-0')} tabular-nums`}
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
            className={chip(filters.keys.includes('none'))}
          >
            {FILTER_COPY.noKey}
          </button>
          <button
            type="button"
            aria-pressed={filters.keys.length === 0}
            onClick={() => onChange({ keys: [] })}
            className={chip(filters.keys.length === 0)}
          >
            {FILTER_COPY.anyKey}
          </button>
        </div>
      </Section>
    ),
    genre: genres.length > 0 && (
      <Section title={FILTER_COPY.genreTitle}>
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
      </Section>
    ),
    tags: tags.length > 0 && (
      <Section title={FILTER_COPY.tagsTitle}>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const pressed = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange({ tags: toggle(filters.tags, tag) })}
                className={chip(pressed)}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Section>
    ),
    price: priceUnit && (
      <Section title={FILTER_COPY.priceTitle}>
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
      </Section>
    ),
    synth: (
      <Section title={FILTER_COPY.synthTitle}>
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
      </Section>
    ),
    license: (
      <Section title={FILTER_COPY.licenseTitle}>
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
      </Section>
    ),
  };

  return (
    <div>
      {FIELD_ORDER.filter((field) => fields.includes(field)).map((field) => (
        <React.Fragment key={field}>{sections[field]}</React.Fragment>
      ))}
    </div>
  );
}
