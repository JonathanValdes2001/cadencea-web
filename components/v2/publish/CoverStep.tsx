'use client';

import React, { useEffect, useId, useState } from 'react';
import CoverArt from '@/components/ui/CoverArt';
import { RangeField, SelectField } from '@/components/ui/Field';
import { Check, Upload } from '@/components/ui/Icons';
import { fill, formatDuration } from '@/lib/v2-demo/format';
import { demoCover, fileName } from '@/lib/v2-demo/release-lifecycle/demo-files';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { PREVIEW_CLIP_MS } from '@/lib/v2-demo/release-lifecycle/validation';
import { audioCandidates, isAudio } from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { fieldId, mergeFiles, type StepProps } from './wizard-shared';

const V = WIZARD_UI.cover;
const DEMO_COVERS = 6;

/** A preview start slider: the 30-second clip must fit (RL §5.5). */
function PreviewStart({ id, value, durationMs, onChange, error }: { id: string; value: number; durationMs: number; onChange: (ms: number) => void; error?: string }) {
  const max = Math.max(0, durationMs - PREVIEW_CLIP_MS);
  return (
    <RangeField
      id={id}
      label={V.previewStart}
      hint={fill(V.previewStartHint, { length: formatDuration(durationMs) })}
      error={error}
      min={0}
      max={max}
      step={1000}
      value={Math.min(value, max)}
      valueText={formatDuration(value)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** "Preview your own image": a session-only blob preview, never stored (WEB-V2-SPEC §2.6). */
function OwnImage() {
  const inputId = useId();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <div>
      <label htmlFor={inputId} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-line px-4 text-sm font-semibold text-ink hover:bg-elevated focus-within:outline focus-within:outline-2 focus-within:outline-accent">
        <Upload size={16} />
        {V.ownImage}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setUrl(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-subtle">{V.ownImageHint}</p>
      {url && (
        // A blob: preview of the seller's own file (CSP allows img-src blob:); next/image can't load blob URLs.
        <img src={url} alt={V.ownImageAlt} className="mt-3 aspect-square w-40 rounded-md border border-line object-cover" />
      )}
    </div>
  );
}

/**
 * Step 4, "Cover and preview / Cover and demo" (RL §5.4, §5.5): a generated demo
 * cover (stored as its demoAssetKey), a session-only preview of the seller's own
 * image, the preview start for songs and beats, and the pack demo.
 */
export default function CoverStep({ payload, update, project, errorFor, coverBase }: StepProps & { coverBase: string }) {
  const groupId = useId();
  const current = payload.cover?.file.demoAssetKey ?? null;
  const options = Array.from({ length: DEMO_COVERS }, (_, i) => `${coverBase}-cover-${i + 1}`);
  const choices = current && !options.includes(current) ? [current, ...options] : options;
  const audio = mergeFiles(project ? audioCandidates(project) : []);

  return (
    <div className="space-y-8">
      <fieldset id={fieldId('cover')} tabIndex={-1}>
        <legend className="text-sm font-semibold text-ink">{V.pickDemo}</legend>
        <p className="mt-0.5 text-xs text-ink-subtle">{V.pickDemoHint}</p>
        {errorFor('cover') && <p className="mt-1 text-xs font-medium text-danger">{errorFor('cover')}</p>}
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {choices.map((seed, i) => {
            const selected = seed === current;
            return (
              <label key={seed} className="relative cursor-pointer rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                <input type="radio" name={groupId} checked={selected} onChange={() => update({ ...payload, cover: demoCover(seed) })} className="sr-only" />
                <span className="sr-only">{fill(V.coverOption, { n: i + 1 })}</span>
                <CoverArt seed={seed} kind={payload.kind} decorative className={selected ? 'ring-2 ring-ink ring-offset-2' : ''} />
                {selected && (
                  <span aria-hidden="true" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-ink">
                    <Check size={16} />
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <OwnImage />

      {payload.kind === 'song' && (
        <div className="space-y-4">
          {payload.tracks.map((track, i) => (
            <div key={track.id}>
              <p className="mb-1 text-sm text-ink-muted">
                {track.position}. {track.title}
              </p>
              <PreviewStart
                id={fieldId(`tracks.${i}.previewStartMs`)}
                value={track.previewStartMs}
                durationMs={track.audio.durationMs ?? 0}
                error={errorFor(`tracks.${i}.previewStartMs`)}
                onChange={(ms) => update({ ...payload, tracks: payload.tracks.map((t, j) => (j === i ? { ...t, previewStartMs: ms } : t)) })}
              />
            </div>
          ))}
        </div>
      )}

      {payload.kind === 'beat' && (
        <div className="space-y-6">
          <PreviewStart
            id={fieldId('previewStartMs')}
            value={payload.previewStartMs}
            durationMs={payload.mainMix.durationMs ?? 0}
            error={errorFor('previewStartMs')}
            onChange={(ms) => update({ ...payload, previewStartMs: ms })}
          />
          <fieldset id={fieldId('previewHasProducerTag')}>
            <legend className="text-sm font-medium text-ink">{V.producerTag}</legend>
            <div className="mt-2 flex gap-4">
              {[true, false].map((value) => (
                <label key={String(value)} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name={`${groupId}-tag`}
                    checked={payload.previewHasProducerTag === value}
                    onChange={() => update({ ...payload, previewHasProducerTag: value })}
                    className="h-5 w-5 accent-[var(--color-accent)]"
                  />
                  {value ? WIZARD_UI.contents.yes : WIZARD_UI.contents.no}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {(payload.kind === 'sample_pack' || payload.kind === 'preset_pack') && (
        <div className="space-y-3">
          <SelectField
            id={fieldId('demo')}
            label={V.demo}
            hint={V.demoHint}
            value={payload.demo?.path ?? ''}
            error={errorFor('demo')}
            sourceChip={payload.demo ? (payload.demo.path === project?.playerFile ? 'project' : undefined) : 'needs_input'}
            onChange={(e) => update({ ...payload, demo: mergeFiles(audio, payload.demo ? [payload.demo] : []).find((f) => f.path === e.target.value) ?? null })}
            options={[
              { value: '', label: V.noDemo },
              ...mergeFiles(audio.filter(isAudio), payload.demo ? [payload.demo] : []).map((f) => ({
                value: f.path,
                label: f.durationMs !== undefined ? `${fileName(f.path)} · ${formatDuration(f.durationMs)}` : fileName(f.path),
              })),
            ]}
          />
          {payload.kind === 'preset_pack' && (
            <p className="text-sm text-ink-muted">
              {V.perPresetDemos}: {fill(V.perPresetCount, { n: payload.perPresetDemos.length, total: payload.presets.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
