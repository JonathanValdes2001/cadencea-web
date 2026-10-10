import React from 'react';
import Badge from '@/components/ui/Badge';
import CoverArt from '@/components/ui/CoverArt';
import { Alert } from '@/components/ui/Icons';
import { fill, formatBytes } from '@/lib/v2-demo/format';
import { NOTICE_COPY, WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { comparedFields, deliverables, diffRevision, diffWords } from '@/lib/v2-demo/release-lifecycle/diff';
import type { ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import type { FieldChange, Price, ReleasePayload, ReviewDepth, Revision } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI, FILE_CHANGE_LABEL, FILE_DIFF_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { fieldLabel, fieldValue, priceText } from './field-values';
import FileDiff from './FileDiff';

export function ReviewDepthChip({ depth }: { depth: ReviewDepth }) {
  const [label, explanation] = WIZARD_COPY.reviewDepth[depth].split(': ');
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-sm bg-tone-update-bg px-2.5 py-0.5 text-xs font-semibold text-tone-update">{label}</span>
      <span className="text-ink-muted">{explanation}</span>
    </p>
  );
}

const coverSeed = (payload: ReleasePayload, fallback: string) => payload.cover?.file.demoAssetKey ?? fallback;

function Row({ label, live, pending }: { label: string; live: React.ReactNode; pending: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="min-w-0 text-sm text-ink-muted">
        <span className="font-medium text-ink-subtle md:sr-only">{DETAIL_UI.live}: </span>
        {live}
      </div>
      <div className="min-w-0 text-sm text-ink">
        <span className="font-medium text-ink-subtle md:sr-only">{DETAIL_UI.pending}: </span>
        {pending}
      </div>
    </div>
  );
}

function TagDiff({ before, after }: { before: string[]; after: string[] }) {
  const added = after.filter((t) => !before.includes(t));
  const removed = before.filter((t) => !after.includes(t));
  const kept = after.filter((t) => before.includes(t));
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={DETAIL_UI.pending}>
      {kept.map((t) => (
        <li key={t} className="rounded-sm bg-elevated px-2 py-0.5 text-xs text-ink-muted">
          {t}
        </li>
      ))}
      {added.map((t) => (
        <li key={`+${t}`} className="rounded-sm bg-tone-success-bg px-2 py-0.5 text-xs font-medium text-tone-success">
          <span aria-hidden="true">+ </span>
          <span className="sr-only">{DETAIL_UI.tagsAdded}: </span>
          {t}
        </li>
      ))}
      {removed.map((t) => (
        <li key={`-${t}`} className="rounded-sm bg-tone-danger-bg px-2 py-0.5 text-xs text-tone-danger line-through">
          <span className="sr-only">{DETAIL_UI.tagsRemoved}: </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** A word-level description diff with a text alternative ("Removed: … Added: …"). */
function DescriptionDiff({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  const removed = parts.filter((p) => p.type === 'removed').map((p) => p.text).join(' … ');
  const added = parts.filter((p) => p.type === 'added').map((p) => p.text).join(' … ');
  return (
    <div className="px-4 py-3">
      <p className="text-sm font-medium text-ink">{fieldLabel('description')}</p>
      <p aria-hidden="true" className="mt-1 text-sm leading-relaxed text-ink-muted">
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' '}
            {p.type === 'same' && p.text}
            {p.type === 'removed' && <del className="rounded-sm bg-tone-danger-bg px-0.5 text-tone-danger">{p.text}</del>}
            {p.type === 'added' && <ins className="rounded-sm bg-tone-success-bg px-0.5 text-tone-success no-underline">{p.text}</ins>}
          </React.Fragment>
        ))}
      </p>
      <p className="sr-only">
        {removed && fill(DETAIL_UI.removedLines, { text: removed })} {added && fill(DETAIL_UI.addedLines, { text: added })}
      </p>
    </div>
  );
}

function isPriceField(f: FieldChange) {
  return f.kind === 'price';
}

/**
 * Live vs pending (RL §6.3): covers side by side, the changed fields, price,
 * files, tracks, licence terms, the review depth and the change note. Pending
 * changes are visible to the seller only; buyers keep seeing the live version.
 */
export default function LiveVsPending({ view }: { view: ReleaseView }) {
  const { current, open, release } = view;
  if (!current?.version || !open) return null;
  const live = current.payload;
  const pending = open.payload;
  const summary = diffRevision(live, pending);
  const n = current.version;
  const next = n + 1;
  const liveCover = coverSeed(live, release.id);
  const pendingCover = coverSeed(pending, release.id);
  const coverChanged = summary.kinds.includes('cover');

  const tableFields = summary.fields.filter((f) => f.kind !== 'cover' && !isPriceField(f) && !f.field.startsWith('tracks'));
  const priceFields = summary.fields.filter(isPriceField);
  const changedNames = new Set(summary.fields.map((f) => f.field));
  const unchanged = comparedFields(release.type).filter(
    (spec) => spec.field !== 'cover' && !changedNames.has(spec.field) && spec.get(live) !== undefined,
  );
  const songTracks = live.kind === 'song' && pending.kind === 'song' ? { before: live.tracks, after: pending.tracks } : null;
  const trackFields = summary.fields.filter((f) => f.field.startsWith('tracks'));

  return (
    <div className="space-y-6">
      <ReviewDepthChip depth={summary.reviewDepth} />

      <div className="grid grid-cols-2 gap-4">
        {[
          { seed: liveCover, label: fill(DETAIL_UI.liveLabel, { n }) },
          { seed: pendingCover, label: fill(DETAIL_UI.pendingLabel, { next }) },
        ].map((cover, i) => (
          <figure key={cover.label} className="max-w-[16rem]">
            <CoverArt seed={cover.seed} kind={release.type} title={`${pending.title}, ${cover.label}`} />
            <figcaption className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
              {cover.label}
              {i === 1 && (coverChanged ? <Badge tone="brand">{DETAIL_UI.changed}</Badge> : <span className="text-ink-subtle">{DETAIL_UI.sameCover}</span>)}
            </figcaption>
          </figure>
        ))}
      </div>

      {(tableFields.length > 0 || unchanged.length > 0) && (
        <div className="divide-y divide-line rounded-md border border-line">
          {tableFields.length > 0 && (
            <div aria-hidden="true" className="hidden gap-4 bg-elevated px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle md:grid md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)]">
              <span>{DETAIL_UI.field}</span>
              <span>{fill(DETAIL_UI.liveLabel, { n })}</span>
              <span>{fill(DETAIL_UI.pendingLabel, { next })}</span>
            </div>
          )}
          {tableFields.map((f) =>
            f.field === 'description' ? (
              <DescriptionDiff key={f.field} before={String(f.before ?? '')} after={String(f.after ?? '')} />
            ) : f.field === 'tags' ? (
              <Row key={f.field} label={fieldLabel(f.field, pending)} live={fieldValue(f.field, f.before)} pending={<TagDiff before={f.before as string[]} after={f.after as string[]} />} />
            ) : (
              <Row key={f.field} label={fieldLabel(f.field, pending)} live={fieldValue(f.field, f.before)} pending={fieldValue(f.field, f.after)} />
            ),
          )}
          {unchanged.length > 0 && (
            <details className="px-4">
              <summary className="cursor-pointer py-3 text-sm font-medium text-ink">
                {unchanged.length === 1 ? DETAIL_UI.fieldUnchanged : fill(DETAIL_UI.fieldsUnchanged, { n: unchanged.length })}
              </summary>
              <dl className="grid gap-x-4 gap-y-1 pb-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)]">
                {unchanged.map((spec) => (
                  <React.Fragment key={spec.field}>
                    <dt className="text-ink-subtle">{fieldLabel(spec.field, live)}</dt>
                    <dd className="text-ink-muted break-words">{fieldValue(spec.field, spec.get(live))}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}

      {summary.kinds.includes('license') && (
        <p className="flex gap-2 text-sm text-tone-warning">
          <Alert size={16} className="mt-0.5 shrink-0" />
          {DETAIL_UI.termsNote}
        </p>
      )}

      {priceFields.length > 0 && (
        <div className="rounded-md border border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">{fieldLabel('price', pending)}</h3>
          <ul className="mt-1 space-y-1">
            {priceFields.map((f) => (
              <li key={f.field} className="text-sm tabular-nums text-ink">
                {f.field !== 'price' && <span className="text-ink-muted">{fieldLabel(f.field, pending)}: </span>}
                {f.field === 'price' ? priceText(f.before as Price) : fieldValue(f.field, f.before)} →{' '}
                <strong className="font-semibold">{f.field === 'price' ? priceText(f.after as Price) : fieldValue(f.field, f.after)}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink-subtle">{DETAIL_UI.priceNote}</p>
        </div>
      )}

      {songTracks && trackFields.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink">{DETAIL_UI.tracks}</h3>
          <ol className="mt-2 divide-y divide-line rounded-md border border-line">
            {songTracks.after.map((track) => {
              const old = songTracks.before.find((t) => t.id === track.id);
              const replaced = old && old.audio.sha256 !== track.audio.sha256;
              return (
                <li key={track.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                  <span className="text-ink">
                    {track.position}. {track.title}
                    {!old && <Badge tone="success" className="ml-2">{FILE_CHANGE_LABEL.added}</Badge>}
                  </span>
                  {replaced && <Badge tone="warning">{DETAIL_UI.audioReplaced}</Badge>}
                </li>
              );
            })}
          </ol>
          {trackFields.some((f) => f.kind === 'audio') && (
            <p className="mt-2 flex gap-2 text-sm text-tone-warning">
              <Alert size={16} className="mt-0.5 shrink-0" />
              {NOTICE_COPY.audioReplace}
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-ink">{DETAIL_UI.files}</h3>
        <div className="mt-2">
          <FileDiff changes={summary.files} unchanged={summary.unchangedFileCount} afterCount={deliverables(pending).length} />
        </div>
      </div>

      {open.changeNote && (
        <figure>
          <figcaption className="text-sm font-semibold text-ink">{DETAIL_UI.changeNote}</figcaption>
          <blockquote className="mt-1 border-l-2 border-brand-300 pl-3 text-sm italic text-ink-muted">{open.changeNote}</blockquote>
        </figure>
      )}
    </div>
  );
}


/** For a release that was never approved: the submitted revision alone ("What reviewers see"). */
export function WhatReviewersSee({ revision, releaseId }: { revision: Revision; releaseId: string }) {
  const payload = revision.payload;
  const files = deliverables(payload).map((d) => d.file);
  const bytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const rows = comparedFields(payload.kind).filter((spec) => spec.field !== 'cover' && spec.get(payload) !== undefined);
  return (
    <div className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
      <figure className="max-w-[12rem]">
        <CoverArt seed={coverSeed(payload, releaseId)} kind={payload.kind} title={payload.title} />
        <figcaption className="mt-2 text-sm font-medium text-ink">{fill(DETAIL_UI.submittedLabel, { seq: revision.seq })}</figcaption>
      </figure>
      <div className="min-w-0">
        <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          {rows.map((spec) => (
            <React.Fragment key={spec.field}>
              <dt className="text-ink-subtle">{fieldLabel(spec.field, payload)}</dt>
              <dd className="break-words text-ink">{spec.field === 'price' ? priceText(spec.get(payload) as Price) : fieldValue(spec.field, spec.get(payload))}</dd>
            </React.Fragment>
          ))}
          <dt className="text-ink-subtle">{DETAIL_UI.files}</dt>
          <dd className="tabular-nums text-ink">{fill(FILE_DIFF_UI.summary, { n: files.length, size: formatBytes(bytes) })}</dd>
        </dl>
      </div>
    </div>
  );
}
