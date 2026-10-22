'use client';

import React, { useId } from 'react';
import Badge from '@/components/ui/Badge';
import CoverArt from '@/components/ui/CoverArt';
import { Check } from '@/components/ui/Icons';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { TYPE_STEP } from '@/lib/v2-demo/release-lifecycle/publish-copy';
import type { WizardType } from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { fieldId } from './wizard-shared';

/** §2 step 1, in this order. */
const ACTIVE: readonly WizardType[] = ['beat', 'sample_pack', 'preset_pack', 'song'];
const LATER = [
  { type: 'splits_pack', note: TYPE_STEP.comingLater },
  { type: 'midi_pack', note: TYPE_STEP.comingLater },
  { type: 'theme', note: TYPE_STEP.themeNote },
] as const;

function subtitle(type: WizardType): string {
  return type === 'song' ? TYPE_STEP.songSubtitle : WIZARD_COPY.tiles[type].body;
}

const tile = 'flex h-full gap-3 rounded-md border p-3 md:p-4';

/**
 * Step 1, "Type" (PUBLISH-PROCEDURE §2): Beat · Sample pack · Preset pack · Song
 * ("On Cadencea Stream, not the Market"). Splits and MIDI packs are "Coming
 * later" and Theme is "Made by Cadencea for now". Once a draft exists the type
 * is fixed, like the project.
 */
export default function TypeStep({
  value,
  locked,
  onPick,
  error,
}: {
  value: WizardType | null;
  locked: boolean;
  onPick: (type: WizardType) => void;
  error?: string;
}) {
  const group = useId();
  return (
    <fieldset id={fieldId('type')} tabIndex={-1}>
      <legend className="sr-only">{TYPE_STEP.legend}</legend>
      {error && <p className="mb-3 text-sm font-medium text-danger">{error}</p>}
      {locked && <p className="mb-3 text-sm text-ink-muted">{TYPE_STEP.fixed}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIVE.map((type) => {
          const selected = value === type;
          const disabled = locked && !selected;
          return (
            <label
              key={type}
              className={`${tile} focus-within:outline focus-within:outline-2 focus-within:outline-accent ${
                selected
                  ? 'border-ink bg-elevated'
                  : disabled
                    ? 'cursor-not-allowed border-line opacity-50'
                    : 'cursor-pointer border-line hover:border-line-strong'
              }`}
            >
              <input
                type="radio"
                name={group}
                value={type}
                checked={selected}
                disabled={disabled}
                onChange={() => onPick(type)}
                className="sr-only"
              />
              <div className="w-12 shrink-0">
                <CoverArt seed={`publish-tile-${type}`} kind={type} decorative rounded="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-between gap-2 font-semibold text-ink">
                  {WIZARD_COPY.tiles[type].title}
                  {selected && <Check size={16} className="shrink-0 text-tone-success" />}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">{subtitle(type)}</p>
              </div>
            </label>
          );
        })}
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {LATER.map(({ type, note }) => (
          <li key={type} aria-disabled="true" className={`${tile} cursor-not-allowed border-dashed border-line bg-elevated`}>
            <div className="min-w-0">
              <p className="font-semibold text-ink-subtle">{WIZARD_COPY.tiles[type].title}</p>
              <Badge className="mt-1">{note}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
