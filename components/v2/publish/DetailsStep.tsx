'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { Plus, Trash } from '@/components/ui/Icons';
import { fill } from '@/lib/v2-demo/format';
import { CREDIT_ROLE_LABEL, GENRES, PRESET_CATEGORIES, SYNTH_LABEL, VITAL_TIERS } from '@/lib/v2-demo/release-lifecycle/options';
import type { CreditEntry, CreditRole, SongPayload } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { DESCRIPTION_MAX, TITLE_MAX } from '@/lib/v2-demo/release-lifecycle/validation';
import { BpmField, KeyField, MoodPicker, TagInput } from './MetadataFields';
import { fieldId, setBpm, setKey, textChip, type StepProps } from './wizard-shared';

const D = WIZARD_UI.details;
const ROLES = Object.keys(CREDIT_ROLE_LABEL) as CreditRole[];

function newPerson(): CreditEntry {
  return { name: '', cadenceaUserId: null, roles: [], masterSharePct: 0, compositionSharePct: 0, cmo: null, ipi: null, confirmation: 'not_on_cadencea' };
}

function share(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

/** Song credits and splits (RL §5.5): every track carries the release's credits in this build. */
function CreditsEditor({ payload, update, errorFor }: { payload: SongPayload; update: StepProps['update']; errorFor: StepProps['errorFor'] }) {
  const credits = payload.tracks[0]?.credits ?? [];
  const set = (next: CreditEntry[]) => update({ ...payload, tracks: payload.tracks.map((t) => ({ ...t, credits: next })) });
  const patch = (i: number, change: Partial<CreditEntry>) => set(credits.map((c, j) => (j === i ? { ...c, ...change } : c)));
  const error = errorFor('credits', true);
  return (
    <fieldset id={fieldId('credits')} tabIndex={-1} className="rounded-md border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{D.credits}</legend>
      <p className="text-xs text-ink-subtle">{D.creditsHint}</p>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      <div className="mt-3 space-y-4">
        {credits.map((person, i) => (
          <div key={i} className="space-y-3 border-t border-line pt-3 first:border-t-0 first:pt-0">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto] sm:items-end">
              <TextField id={`${fieldId('credits')}-${i}-name`} label={D.name} value={person.name} onChange={(e) => patch(i, { name: e.target.value })} />
              <TextField
                id={`${fieldId('credits')}-${i}-master`}
                label={D.masterShare}
                inputMode="decimal"
                value={String(person.masterSharePct ?? '')}
                onChange={(e) => patch(i, { masterSharePct: share(e.target.value) })}
              />
              <TextField
                id={`${fieldId('credits')}-${i}-composition`}
                label={D.compositionShare}
                inputMode="decimal"
                value={String(person.compositionSharePct ?? '')}
                onChange={(e) => patch(i, { compositionSharePct: share(e.target.value) })}
              />
              {credits.length > 1 && person.confirmation !== 'self' && (
                <Button variant="ghost" size="sm" iconLeft={<Trash size={16} />} onClick={() => set(credits.filter((_, j) => j !== i))}>
                  {fill(D.removePerson, { name: person.name || D.name })}
                </Button>
              )}
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-ink-muted">{D.roles}</legend>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {ROLES.map((role) => (
                  <CheckboxField
                    key={role}
                    id={`${fieldId('credits')}-${i}-${role}`}
                    label={CREDIT_ROLE_LABEL[role]}
                    checked={person.roles.includes(role)}
                    onChange={(e) => patch(i, { roles: e.target.checked ? [...person.roles, role] : person.roles.filter((r) => r !== role) })}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        ))}
      </div>
      {(errorFor('credits.master') || errorFor('credits.composition')) && (
        <p className="mt-3 text-xs font-medium text-danger">{errorFor('credits.master') ?? errorFor('credits.composition')}</p>
      )}
      <Button className="mt-3" size="sm" variant="secondary" iconLeft={<Plus size={16} />} onClick={() => set([...credits, newPerson()])}>
        {D.addPerson}
      </Button>
    </fieldset>
  );
}

/**
 * Step 2, "Details" (RL §5.4, §5.5): title, description, tags with Detect's
 * suggestions, genre, moods, BPM and key with their prefill chips, plus the
 * type's own details (credits for songs, co-producers for beats, synth for presets).
 */
export default function DetailsStep({ payload, update, project, errorFor }: StepProps) {
  const isSong = payload.kind === 'song';
  const isBeat = payload.kind === 'beat';
  return (
    <div className="space-y-6">
      <TextField
        id={fieldId('title')}
        label={D.title}
        value={payload.title}
        maxLength={TITLE_MAX + 20}
        error={errorFor('title')}
        sourceChip={textChip(payload.title, project?.name)}
        onChange={(e) => update({ ...payload, title: e.target.value })}
      />
      <TextAreaField
        id={fieldId('description')}
        label={D.description}
        value={payload.description}
        maxLength={DESCRIPTION_MAX + 50}
        hint={`${isSong ? D.descriptionHintSong : D.descriptionHintMarket} ${payload.description.length} / ${DESCRIPTION_MAX}`}
        error={errorFor('description')}
        sourceChip={textChip(payload.description, project?.description)}
        onChange={(e) => update({ ...payload, description: e.target.value })}
      />
      <TagInput
        tags={payload.tags}
        suggestions={project?.tagSuggestions ?? []}
        error={errorFor('tags')}
        chip={payload.tags.length === 0 ? 'needs_input' : project && JSON.stringify(payload.tags) === JSON.stringify(project.tags) ? 'project' : undefined}
        onChange={(tags) => update({ ...payload, tags })}
      />
      <SelectField
        id={fieldId('genre')}
        label={D.genre}
        value={payload.genre ?? ''}
        error={errorFor('genre')}
        sourceChip={payload.genre ? undefined : 'needs_input'}
        onChange={(e) => update({ ...payload, genre: e.target.value || null })}
        options={[{ value: '', label: D.genrePlaceholder }, ...GENRES.map((g) => ({ value: g, label: g }))]}
      />
      <MoodPicker moods={payload.moods} onChange={(moods) => update({ ...payload, moods })} />
      <div className="grid gap-6 sm:grid-cols-2">
        <BpmField
          value={payload.bpm}
          projectValue={project?.bpm}
          alternates={project?.bpmAlternates ?? []}
          optional={!isBeat}
          error={errorFor('bpm')}
          onChange={(bpm) => update(setBpm(payload, bpm))}
        />
        <KeyField
          value={payload.key}
          projectValue={project?.key}
          optional={!isBeat}
          error={errorFor('key')}
          onChange={(key) => update(setKey(payload, key))}
        />
      </div>

      {payload.kind === 'song' && (
        <>
          <SelectField
            id={fieldId('format')}
            label={D.format}
            value={payload.format}
            onChange={(e) => update({ ...payload, format: e.target.value as SongPayload['format'] })}
            options={(Object.keys(D.formats) as SongPayload['format'][]).map((f) => ({ value: f, label: D.formats[f] }))}
          />
          <CreditsEditor payload={payload} update={update} errorFor={errorFor} />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField id={fieldId('pLine')} label={D.pLine} value={payload.pLine ?? ''} maxLength={120} onChange={(e) => update({ ...payload, pLine: e.target.value || null })} />
            <TextField id={fieldId('cLine')} label={D.cLine} value={payload.cLine ?? ''} maxLength={120} onChange={(e) => update({ ...payload, cLine: e.target.value || null })} />
          </div>
        </>
      )}

      {payload.kind === 'beat' && (
        <fieldset id={fieldId('coProducers')} tabIndex={-1} className="rounded-md border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-ink">{D.coProducers}</legend>
          <p className="text-xs text-ink-subtle">{D.coProducersHint}</p>
          <div className="mt-3 space-y-3">
            {payload.coProducers.map((person, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
                <TextField
                  id={`${fieldId('coProducers')}-${i}-name`}
                  label={D.name}
                  value={person.name}
                  onChange={(e) => update({ ...payload, coProducers: payload.coProducers.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)) })}
                />
                <TextField
                  id={`${fieldId('coProducers')}-${i}-share`}
                  label={D.salesShare}
                  inputMode="decimal"
                  value={String(person.masterSharePct ?? '')}
                  onChange={(e) =>
                    update({ ...payload, coProducers: payload.coProducers.map((c, j) => (j === i ? { ...c, masterSharePct: share(e.target.value) } : c)) })
                  }
                />
                <Button variant="ghost" size="sm" iconLeft={<Trash size={16} />} onClick={() => update({ ...payload, coProducers: payload.coProducers.filter((_, j) => j !== i) })}>
                  {fill(D.removePerson, { name: person.name || D.name })}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm tabular-nums text-ink-muted">
            {fill(D.yourShare, { n: Math.round((100 - payload.coProducers.reduce((s, c) => s + (c.masterSharePct ?? 0), 0)) * 10) / 10 })}
          </p>
          {errorFor('coProducers') && <p className="mt-1 text-xs font-medium text-danger">{errorFor('coProducers')}</p>}
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            iconLeft={<Plus size={16} />}
            onClick={() => update({ ...payload, coProducers: [...payload.coProducers, { ...newPerson(), roles: ['co_producer'] }] })}
          >
            {D.addPerson}
          </Button>
        </fieldset>
      )}

      {payload.kind === 'preset_pack' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField
              id={fieldId('synth')}
              label={D.synth}
              value={payload.synth}
              onChange={(e) => update({ ...payload, synth: e.target.value as typeof payload.synth })}
              options={(Object.keys(SYNTH_LABEL) as (keyof typeof SYNTH_LABEL)[]).map((s) => ({ value: s, label: SYNTH_LABEL[s] }))}
            />
            <TextField
              id={fieldId('minSynthVersion')}
              label={D.minSynthVersion}
              hint={D.minSynthVersionHint}
              value={payload.minSynthVersion}
              error={errorFor('minSynthVersion')}
              sourceChip={payload.minSynthVersion ? undefined : 'needs_input'}
              onChange={(e) => update({ ...payload, minSynthVersion: e.target.value })}
            />
          </div>
          {payload.synth === 'vital' && (
            <SelectField
              id={fieldId('vitalTier')}
              label={D.vitalTier}
              value={payload.vitalTier ?? 'none'}
              onChange={(e) => update({ ...payload, vitalTier: e.target.value === 'none' ? null : (e.target.value as 'basic' | 'plus' | 'pro') })}
              options={VITAL_TIERS.map((t) => ({ value: t.value, label: t.label }))}
            />
          )}
          <fieldset id={fieldId('categories')} tabIndex={-1}>
            <legend className="text-sm font-medium text-ink">{D.categories}</legend>
            {errorFor('categories') && <p className="mt-1 text-xs font-medium text-danger">{errorFor('categories')}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((category) => {
                const on = payload.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      update({ ...payload, categories: on ? payload.categories.filter((c) => c !== category) : [...payload.categories, category] })
                    }
                    className={`h-9 rounded-sm border px-3 text-sm pointer-coarse:h-11 ${
                      on ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

