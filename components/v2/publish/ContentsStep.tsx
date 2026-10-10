'use client';

import React, { useId } from 'react';
import Button from '@/components/ui/Button';
import { CheckboxField, SelectField, StepperField, TextField } from '@/components/ui/Field';
import { Chevron, Trash } from '@/components/ui/Icons';
import { fill, formatBytes, formatDuration } from '@/lib/v2-demo/format';
import { countOneShots, fileName } from '@/lib/v2-demo/release-lifecycle/demo-files';
import { LANGUAGES } from '@/lib/v2-demo/release-lifecycle/options';
import type { BeatPayload, FileRef, SongPayload, SongTrack } from '@/lib/v2-demo/release-lifecycle/types';
import { LEASE_TIER_IDS } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import {
  audioCandidates,
  defaultPreviewStart,
  isLosslessAudio,
  presetCandidates,
  stemFiles,
  tierFiles,
  type VaultProject,
} from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { fieldId, mergeFiles, type StepProps } from './wizard-shared';

const C = WIZARD_UI.contents;

/** A checklist of files with select all / none and a count. */
function FilePicker({
  field,
  legend,
  candidates,
  selected,
  onChange,
  error,
}: {
  field: string;
  legend: string;
  candidates: readonly FileRef[];
  selected: readonly FileRef[];
  onChange: (files: FileRef[]) => void;
  error?: string;
}) {
  const baseId = useId();
  const paths = new Set(selected.map((f) => f.path));
  return (
    <fieldset id={fieldId(field)} tabIndex={-1}>
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm tabular-nums text-ink-muted" aria-live="polite">
          {fill(C.selected, { n: selected.length, total: candidates.length })}
        </p>
        <Button size="sm" variant="ghost" onClick={() => onChange([...candidates])}>
          {C.selectAll}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange([])}>
          {C.selectNone}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
      <ul className="mt-2 max-h-96 divide-y divide-line overflow-y-auto rounded-md border border-line">
        {candidates.map((file, i) => (
          <li key={file.path} className="flex items-center justify-between gap-3 px-3 py-1.5">
            <CheckboxField
              id={`${baseId}-${i}`}
              label={<span className="break-all">{file.path}</span>}
              checked={paths.has(file.path)}
              onChange={(e) => onChange(e.target.checked ? [...selected, file] : selected.filter((f) => f.path !== file.path))}
            />
            <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
              {file.durationMs !== undefined && `${formatDuration(file.durationMs)} · `}
              {formatBytes(file.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** Beats: lease tier files follow the main mix and stems (RL §3.3). */
function withTierFiles(payload: BeatPayload, project: VaultProject | null): BeatPayload {
  return {
    ...payload,
    tiers: LEASE_TIER_IDS.map((id) => {
      const tier = payload.tiers.find((t) => t.tier === id);
      return tier ? { ...tier, files: tierFiles(id, payload.mainMix, payload.stems, project) } : null;
    }).filter((t): t is BeatPayload['tiers'][number] => t !== null),
  };
}

function nextTrackId(tracks: readonly SongTrack[]): string {
  const max = tracks.reduce((m, t) => Math.max(m, Number(t.id.replace(/\D/g, '')) || 0), 0);
  return `trk-${max + 1}`;
}

function TrackList({ payload, update, project, errorFor }: { payload: SongPayload; update: StepProps['update']; project: VaultProject | null; errorFor: StepProps['errorFor'] }) {
  const addId = useId();
  const used = new Set(payload.tracks.map((t) => t.audio.path));
  const available = (project ? audioCandidates(project) : []).filter((f) => isLosslessAudio(f) && !used.has(f.path) && !/(^|\/)stems\//i.test(f.path));
  const setTracks = (tracks: SongTrack[]) => update({ ...payload, tracks: tracks.map((t, i) => ({ ...t, position: i + 1 })) });
  const patch = (i: number, change: Partial<SongTrack>) => setTracks(payload.tracks.map((t, j) => (j === i ? { ...t, ...change } : t)));
  const move = (i: number, by: number) => {
    const next = [...payload.tracks];
    const [track] = next.splice(i, 1);
    next.splice(i + by, 0, track);
    setTracks(next);
  };
  return (
    <div id={fieldId('tracks')} tabIndex={-1}>
      <h3 className="text-sm font-semibold text-ink">{C.tracks}</h3>
      {errorFor('tracks', true) && <p className="mt-1 text-xs font-medium text-danger">{errorFor('tracks', true)}</p>}
      <ol className="mt-2 space-y-4">
        {payload.tracks.map((track, i) => (
          <li key={track.id} className="rounded-md border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {track.position}. <span className="break-all font-normal text-ink-muted">{track.audio.path}</span>
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" aria-label={fill(C.moveUp, { n: track.position })} disabled={i === 0} onClick={() => move(i, -1)}>
                  <Chevron size={16} className="rotate-180" />
                </Button>
                <Button size="sm" variant="ghost" aria-label={fill(C.moveDown, { n: track.position })} disabled={i === payload.tracks.length - 1} onClick={() => move(i, 1)}>
                  <Chevron size={16} />
                </Button>
                {payload.tracks.length > 1 && (
                  <Button size="sm" variant="ghost" aria-label={fill(C.removeTrack, { n: track.position })} onClick={() => setTracks(payload.tracks.filter((_, j) => j !== i))}>
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <TextField
                id={fieldId(`tracks.${i}.title`)}
                label={C.trackTitle}
                value={track.title}
                error={errorFor(`tracks.${i}.title`)}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
              <SelectField
                id={fieldId(`tracks.${i}.language`)}
                label={C.language}
                value={track.language}
                error={errorFor(`tracks.${i}.language`)}
                sourceChip={track.language ? undefined : 'needs_input'}
                onChange={(e) => patch(i, { language: e.target.value })}
                options={[{ value: '', label: C.languagePlaceholder }, ...LANGUAGES.map((l) => ({ value: l.code, label: l.label }))]}
              />
              <fieldset>
                <legend className="text-sm font-medium text-ink">{C.explicit}</legend>
                <div className="mt-2 flex gap-4">
                  {[true, false].map((value) => (
                    <label key={String(value)} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name={`${track.id}-explicit`}
                        checked={track.explicit === value}
                        onChange={() => patch(i, { explicit: value })}
                        className="h-5 w-5 accent-[var(--color-accent)]"
                      />
                      {value ? C.yes : C.no}
                    </label>
                  ))}
                </div>
              </fieldset>
              <TextField
                id={fieldId(`tracks.${i}.isrc`)}
                label={C.isrc}
                hint={C.isrcHint}
                value={track.isrc ?? ''}
                error={errorFor(`tracks.${i}.isrc`)}
                onChange={(e) => patch(i, { isrc: e.target.value.trim() ? e.target.value.toUpperCase() : null })}
              />
            </div>
          </li>
        ))}
      </ol>
      {available.length > 0 && (
        <div className="mt-4 max-w-md">
          <SelectField
            id={addId}
            label={C.addTrack}
            value=""
            onChange={(e) => {
              const audio = available.find((f) => f.path === e.target.value);
              if (!audio) return;
              setTracks([
                ...payload.tracks,
                {
                  id: nextTrackId(payload.tracks),
                  position: payload.tracks.length + 1,
                  title: fileName(audio.path).replace(/\.[^.]+$/, ''),
                  audio,
                  isrc: null,
                  explicit: false,
                  language: '',
                  previewStartMs: defaultPreviewStart(audio.durationMs),
                  credits: payload.tracks[0]?.credits ?? [],
                },
              ]);
            }}
            options={[{ value: '', label: C.addTrack }, ...available.map((f) => ({ value: f.path, label: fill(C.addTrackFrom, { file: f.path }) }))]}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Step 3, "Tracks / Files / Presets / Samples" (RL §5.3, §5.5): the deliverables,
 * from the project's default selection; the seller can change it. Publishing
 * never writes to the project (L15).
 */
export default function ContentsStep({ payload, update, project, errorFor }: StepProps) {
  const noProject = !project && <p className="rounded-sm bg-elevated px-3 py-2 text-sm text-ink-muted">{C.noCandidates}</p>;

  if (payload.kind === 'sample_pack') {
    const candidates = mergeFiles(project ? audioCandidates(project) : [], payload.samples);
    const setSamples = (samples: FileRef[]) => {
      const oneShots = countOneShots(samples);
      update({ ...payload, samples, contents: { oneShots, loops: samples.length - oneShots } });
    };
    return (
      <div className="space-y-6">
        {noProject}
        <FilePicker field="samples" legend={C.candidates} candidates={candidates} selected={payload.samples} onChange={setSamples} error={errorFor('samples')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <StepperField
            id={fieldId('contents')}
            label={C.oneShots}
            hint={C.countsHint}
            value={payload.contents.oneShots}
            min={0}
            max={payload.samples.length}
            onValueChange={(oneShots) => update({ ...payload, contents: { oneShots, loops: payload.samples.length - oneShots } })}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">{C.loops}</p>
            <p className="flex h-11 items-center text-base font-semibold tabular-nums text-ink">{payload.contents.loops}</p>
          </div>
        </div>
      </div>
    );
  }

  if (payload.kind === 'preset_pack') {
    const candidates = mergeFiles(project ? presetCandidates(project) : [], payload.presets);
    return (
      <div className="space-y-6">
        {noProject}
        <FilePicker field="presets" legend={C.presets} candidates={candidates} selected={payload.presets} onChange={(presets) => update({ ...payload, presets })} error={errorFor('presets')} />
      </div>
    );
  }

  if (payload.kind === 'beat') {
    const audio = mergeFiles(project ? audioCandidates(project) : [], [payload.mainMix], payload.stems);
    const stemCandidates = mergeFiles(project ? stemFiles(project) : [], payload.stems).filter((f) => f.path !== payload.mainMix.path);
    return (
      <div className="space-y-6">
        {noProject}
        <SelectField
          id={fieldId('mainMix')}
          label={C.mainMix}
          value={payload.mainMix.path}
          error={errorFor('mainMix')}
          onChange={(e) => {
            const mainMix = audio.find((f) => f.path === e.target.value);
            if (mainMix) update(withTierFiles({ ...payload, mainMix, previewStartMs: defaultPreviewStart(mainMix.durationMs) }, project));
          }}
          options={audio.map((f) => ({ value: f.path, label: f.durationMs !== undefined ? `${f.path} · ${formatDuration(f.durationMs)}` : f.path }))}
        />
        <div>
          <p className="mb-2 text-xs text-ink-subtle">{C.stemsHint}</p>
          <FilePicker
            field="stems"
            legend={C.stems}
            candidates={stemCandidates}
            selected={payload.stems}
            onChange={(stems) => update(withTierFiles({ ...payload, stems }, project))}
            error={errorFor('stems')}
          />
        </div>
      </div>
    );
  }

  if (payload.kind === 'song') {
    return (
      <div className="space-y-6">
        {noProject}
        <TrackList payload={payload} update={update} project={project} errorFor={errorFor} />
      </div>
    );
  }

  return null;
}

