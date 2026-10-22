'use client';

import React from 'react';
import { Close } from '@/components/ui/Icons';
import { creditsToEurCents, decodeKey, fill, formatCredits, formatEurCents, formatKey } from '@/lib/v2-demo/format';
import { FILTER_COPY } from '@/lib/v2-demo/market/copy';
import { SYNTH_LABEL, genreLabel } from '@/lib/v2-demo/market/display';
import type { MarketFilters } from '@/lib/v2-demo/market/queries';

interface Chip {
  id: string;
  label: string;
  remove: Partial<MarketFilters>;
}

const without = <T,>(values: readonly T[], value: T): T[] => values.filter((v) => v !== value);

function bpmLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return fill(FILTER_COPY.bpmRange, { min, max });
  return min !== null ? fill(FILTER_COPY.bpmFrom, { min }) : fill(FILTER_COPY.bpmTo, { max: max ?? '' });
}

function chipsFor(f: MarketFilters): Chip[] {
  const chips: Chip[] = [];
  if (f.q) chips.push({ id: 'q', label: fill(FILTER_COPY.search, { q: f.q }), remove: { q: '' } });
  if (f.bpmMin !== null || f.bpmMax !== null) {
    chips.push({ id: 'bpm', label: bpmLabel(f.bpmMin, f.bpmMax), remove: { bpmMin: null, bpmMax: null } });
  }
  if (f.half) chips.push({ id: 'half', label: FILTER_COPY.halfChip, remove: { half: false } });
  for (const code of f.keys) {
    const key = decodeKey(code);
    if (key === undefined) continue;
    chips.push({ id: `key-${code}`, label: formatKey(key), remove: { keys: without(f.keys, code) } });
  }
  for (const genre of f.genres) {
    chips.push({ id: `genre-${genre}`, label: genreLabel(genre), remove: { genres: without(f.genres, genre) } });
  }
  for (const tag of f.tags) chips.push({ id: `tag-${tag}`, label: tag, remove: { tags: without(f.tags, tag) } });
  if (f.max !== null) {
    const label =
      f.max === 0
        ? formatCredits(0)
        : fill(FILTER_COPY.maxChip, {
            credits: formatCredits(f.max),
            eur: formatEurCents(creditsToEurCents(f.max), { trimZeros: true }),
          });
    chips.push({ id: 'max', label, remove: { max: null } });
  }
  if (f.maxEur !== null) {
    chips.push({ id: 'maxEur', label: fill(FILTER_COPY.maxEurChip, { eur: f.maxEur }), remove: { maxEur: null } });
  }
  for (const synth of f.synths) {
    chips.push({ id: `synth-${synth}`, label: SYNTH_LABEL[synth], remove: { synths: without(f.synths, synth) } });
  }
  for (const option of FILTER_COPY.licenseOptions) {
    if (!f.license.includes(option.value)) continue;
    const remove = { license: without(f.license, option.value) };
    chips.push({ id: `lic-${option.value}`, label: option.label, remove });
  }
  return chips;
}

/** Removable chips for every active filter, plus "Clear all" (WEB-V2-SPEC §4.3). */
export default function ActiveFilters({
  filters,
  onChange,
  onClear,
  className = '',
}: {
  filters: MarketFilters;
  onChange: (patch: Partial<MarketFilters>) => void;
  onClear: () => void;
  className?: string;
}) {
  const chips = chipsFor(filters);
  if (!chips.length) return null;
  return (
    <div role="group" aria-label={FILTER_COPY.activeLabel} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center rounded-sm border border-brand-200 bg-brand-50 pl-3 text-sm font-medium text-brand-800 tabular-nums"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onChange(chip.remove)}
            aria-label={fill(FILTER_COPY.remove, { label: chip.label })}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-brand-700 hover:bg-brand-100 hover:text-brand-900 pointer-coarse:h-11 pointer-coarse:w-11"
          >
            <Close size={16} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-8 items-center px-2 text-sm font-semibold text-accent-ink hover:text-accent-hover pointer-coarse:h-11"
      >
        {FILTER_COPY.clearAll}
      </button>
    </div>
  );
}
