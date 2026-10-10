'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Close, Plus } from '@/components/ui/Icons';
import { confidenceLevel, encodeKey, decodeKey, fill, formatKey, PITCH_CLASSES } from '@/lib/v2-demo/format';
import { PREFILL_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { MAX_MOODS, MAX_TAGS, MOODS, TAG_MAX_LENGTH, TAG_MIN_LENGTH } from '@/lib/v2-demo/release-lifecycle/options';
import type { BpmString, KeyValue, Provenanced } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { needsConfirmation } from '@/lib/v2-demo/release-lifecycle/validation';
import { chipFor, fieldId, userValue } from './wizard-shared';

const D = WIZARD_UI.details;

/** Tags as removable chips with an input, plus Detect's suggestions as chips to add (never applied automatically). */
export function TagInput({
  tags,
  suggestions,
  onChange,
  error,
  chip,
}: {
  tags: string[];
  suggestions: readonly string[];
  onChange: (tags: string[]) => void;
  error?: string;
  chip?: React.ComponentProps<typeof TextField>['sourceChip'];
}) {
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const has = (tag: string) => tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag.length < TAG_MIN_LENGTH || tag.length > TAG_MAX_LENGTH || has(tag) || tags.length >= MAX_TAGS) {
      setHint(D.tagsHint);
      return;
    }
    onChange([...tags, tag]);
    setDraft('');
    setHint(null);
  };
  const open = suggestions.filter((s) => !has(s));

  return (
    <div>
      <TextField
        id={fieldId('tags')}
        label={D.tags}
        hint={hint ?? D.tagsHint}
        error={error}
        sourceChip={chip}
        value={draft}
        placeholder={D.addTag}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          }
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-elevated py-0.5 pl-2 text-sm text-ink">
            {tag}
            <button
              type="button"
              aria-label={fill(D.removeTag, { tag })}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-muted hover:bg-inset hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Close size={16} />
            </button>
          </span>
        ))}
        <Button size="sm" variant="ghost" iconLeft={<Plus size={16} />} onClick={() => add(draft)} disabled={!draft.trim()}>
          {D.addTagButton}
        </Button>
      </div>
      {open.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-ink-subtle">{D.tagSuggestions}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {open.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={fill(D.addSuggestion, { tag: s })}
                onClick={() => add(s)}
                className="inline-flex h-9 items-center gap-1 rounded-sm border border-dashed border-brand-300 px-2.5 text-sm text-brand-700 hover:bg-brand-50 pointer-coarse:h-11"
              >
                <Plus size={16} />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Up to three moods as toggle buttons (RL §5.4). */
export function MoodPicker({ moods, onChange }: { moods: string[]; onChange: (moods: string[]) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{D.moods}</legend>
      <p className="mt-0.5 text-xs text-ink-subtle">{D.moodsHint}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MOODS.map((mood) => {
          const on = moods.includes(mood);
          return (
            <button
              key={mood}
              type="button"
              aria-pressed={on}
              disabled={!on && moods.length >= MAX_MOODS}
              onClick={() => onChange(on ? moods.filter((m) => m !== mood) : [...moods, mood])}
              className={`h-9 rounded-sm border px-3 text-sm pointer-coarse:h-11 disabled:cursor-not-allowed disabled:opacity-40 ${
                on ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {mood}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DetectedNote({ value, onConfirm }: { value: Provenanced<unknown> | undefined; onConfirm: () => void }) {
  if (!needsConfirmation(value)) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-sm bg-tone-info-bg px-3 py-2 text-sm text-tone-info">
      <span className="flex-1">{fill(PREFILL_COPY.detectedNote, { level: confidenceLevel(value?.confidence ?? 0) })}</span>
      <Button size="sm" variant="secondary" onClick={onConfirm}>
        {PREFILL_COPY.looksRight}
      </Button>
    </div>
  );
}

/** BPM with its prefill chip, Detect's "Looks right" and the half/double-time alternates. */
export function BpmField({
  value,
  projectValue,
  alternates,
  onChange,
  error,
  optional,
  id = fieldId('bpm'),
}: {
  value: Provenanced<BpmString> | undefined;
  projectValue: Provenanced<BpmString> | undefined;
  alternates: readonly string[];
  onChange: (value: Provenanced<BpmString> | undefined) => void;
  error?: string;
  optional: boolean;
  id?: string;
}) {
  return (
    <div>
      <TextField
        id={id}
        label={D.bpm}
        inputMode="numeric"
        maxLength={3}
        value={value?.value ?? ''}
        hint={optional ? D.bpmHintOptional : undefined}
        error={error}
        sourceChip={chipFor(value, projectValue)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '');
          onChange(raw ? userValue(raw) : undefined);
        }}
      />
      <DetectedNote value={value} onConfirm={() => value && onChange({ ...value, confirmed: true })} />
      {alternates.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          {D.alternates}:
          {alternates.map((bpm) => (
            <Button key={bpm} size="sm" variant="ghost" onClick={() => onChange(userValue(bpm))}>
              {fill(D.useAlternate, { bpm })}
            </Button>
          ))}
        </p>
      )}
    </div>
  );
}

const KEY_OPTIONS = [
  { value: '', label: D.notAnswered },
  { value: 'none', label: D.noKey },
  ...(['Minor', 'Major'] as const).flatMap((mode) =>
    PITCH_CLASSES.map((root) => {
      const key: KeyValue = { root, mode };
      return { value: encodeKey(key), label: formatKey(key) };
    }),
  ),
];

/** Key as sharp root and mode, or "No key"; never a default C Major (RL §1.5). */
export function KeyField({
  value,
  projectValue,
  onChange,
  error,
  optional,
  id = fieldId('key'),
}: {
  value: Provenanced<KeyValue> | undefined;
  projectValue: Provenanced<KeyValue> | undefined;
  onChange: (value: Provenanced<KeyValue> | undefined) => void;
  error?: string;
  optional: boolean;
  id?: string;
}) {
  return (
    <div>
      <SelectField
        id={id}
        label={D.key}
        value={value === undefined ? '' : encodeKey(value.value)}
        hint={optional ? D.keyHintOptional : undefined}
        error={error}
        sourceChip={chipFor(value, projectValue)}
        options={KEY_OPTIONS}
        onChange={(e) => {
          const decoded = e.target.value ? decodeKey(e.target.value) : undefined;
          onChange(decoded === undefined ? undefined : userValue(decoded));
        }}
      />
      <DetectedNote value={value} onConfirm={() => value && onChange({ ...value, confirmed: true })} />
    </div>
  );
}
