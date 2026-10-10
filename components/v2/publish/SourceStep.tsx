'use client';

import React, { useId, useState } from 'react';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/ui/CoverArt';
import { Check, Refresh } from '@/components/ui/Icons';
import Tooltip from '@/components/ui/Tooltip';
import { confidenceLevel, fill, formatKey } from '@/lib/v2-demo/format';
import { PREFILL_COPY, WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { diffRevision } from '@/lib/v2-demo/release-lifecycle/diff';
import { DAW_LABEL } from '@/lib/v2-demo/release-lifecycle/options';
import type { Provenanced, ReleasePayload } from '@/lib/v2-demo/release-lifecycle/types';
import { CHANGE_KIND_LABEL, FILE_CHANGE_LABEL, WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { VAULT_PROJECTS, type VaultProject } from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { fieldLabel } from '@/components/v2/studio/field-values';

/** BPM or key with its prefill chip and, for Detect values, the confidence level (number in a tooltip, D4). */
function Provenance<T>({ label, value, format }: { label: string; value: Provenanced<T> | undefined; format: (v: T) => string }) {
  const tipId = useId();
  if (value === undefined) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-ink-subtle">{label}:</span>
        <span className="rounded-sm bg-tone-warning-bg px-1.5 text-[11px] font-semibold text-tone-warning">{PREFILL_COPY.needsInput}</span>
      </span>
    );
  }
  const detected = value.source === 'analysis' && !value.confirmed;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-ink-subtle">{label}:</span>
      <span className="font-medium tabular-nums text-ink">{format(value.value)}</span>
      {detected ? (
        <Tooltip id={tipId} content={fill(WIZARD_UI.source.confidence, { value: (value.confidence ?? 0).toFixed(2) })}>
          <span tabIndex={0} aria-describedby={tipId} className="rounded-sm bg-tone-info-bg px-1.5 text-[11px] font-semibold text-tone-info">
            {PREFILL_COPY.detected} · {confidenceLevel(value.confidence ?? 0)}
          </span>
        </Tooltip>
      ) : (
        <span className="rounded-sm bg-tone-neutral-bg px-1.5 text-[11px] font-semibold text-tone-neutral">{PREFILL_COPY.fromProject}</span>
      )}
    </span>
  );
}

export function ProjectFacts({ project }: { project: VaultProject }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-ink-muted">
        {DAW_LABEL[project.daw]} · {fill(WIZARD_UI.source.files, { n: project.files.length })}
      </p>
      <Provenance label="BPM" value={project.bpm} format={(v) => String(v)} />
      <Provenance label="Key" value={project.key} format={formatKey} />
      {project.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1 pt-1">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-sm bg-elevated px-1.5 py-0.5 text-xs text-ink-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Step 1, "Project" (RL §5.2, §5.3): pick one of the demo Vault projects, then
 * "Start from a Vault project". Once a draft exists the project is fixed and
 * "Refresh from Vault project" shows what would change before applying it.
 */
export default function SourceStep({
  payload,
  project,
  projectName,
  locked,
  onStart,
  refreshed,
  onApplyRefresh,
}: {
  payload: ReleasePayload | null;
  project: VaultProject | null;
  /** The release's source project name, also when it isn't a demo project. */
  projectName: string | null;
  /** True once a draft exists: the source can't change any more. */
  locked: boolean;
  onStart: (project: VaultProject) => void;
  /** The payload a refresh would produce, or null when the project isn't available. */
  refreshed: ReleasePayload | null;
  onApplyRefresh: () => void;
}) {
  const groupId = useId();
  const [picked, setPicked] = useState<string | null>(project?.id ?? null);
  const [showRefresh, setShowRefresh] = useState(false);
  const pickedProject = VAULT_PROJECTS.find((p) => p.id === picked) ?? null;

  if (locked) {
    const changes = payload && refreshed ? diffRevision(payload, refreshed) : null;
    return (
      <div className="space-y-4">
        <div className="flex gap-4 rounded-md border border-line p-4">
          <div className="w-20 shrink-0">
            <CoverArt seed={project?.coverSeed ?? projectName ?? 'project'} kind={payload?.kind ?? 'sample_pack'} decorative rounded="sm" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{WIZARD_UI.source.project}</p>
            <p className="mt-1 font-semibold text-ink">{project?.name ?? projectName}</p>
            {project && <ProjectFacts project={project} />}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-tone-success">
              <Check size={16} />
              {WIZARD_UI.source.pushed}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          iconLeft={<Refresh size={16} />}
          disabled={!refreshed}
          disabledReason={refreshed ? undefined : WIZARD_UI.source.noProject}
          aria-expanded={showRefresh}
          onClick={() => setShowRefresh((v) => !v)}
        >
          {WIZARD_COPY.source.refresh}
        </Button>
        {showRefresh && changes && (
          <div className="rounded-md border border-line p-4">
            <h3 className="text-sm font-semibold text-ink">{WIZARD_UI.source.refreshTitle}</h3>
            {changes.kinds.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">{WIZARD_UI.source.refreshNone}</p>
            ) : (
              <>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {changes.fields.map((f) => (
                    <li key={f.field}>
                      {fieldLabel(f.field, refreshed ?? undefined)} ({CHANGE_KIND_LABEL[f.kind]})
                    </li>
                  ))}
                  {(['added', 'removed', 'replaced', 'renamed'] as const).map((kind) => {
                    const n = changes.files.filter((c) => c.change === kind).length;
                    return n > 0 ? <li key={kind}>{`${FILE_CHANGE_LABEL[kind]}: ${n}`}</li> : null;
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onApplyRefresh();
                      setShowRefresh(false);
                    }}
                  >
                    {WIZARD_UI.source.apply}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRefresh(false)}>
                    {WIZARD_UI.source.cancel}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">{WIZARD_UI.source.lead}</p>
      <fieldset className="mt-4">
        <legend className="sr-only">{WIZARD_UI.source.heading}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {VAULT_PROJECTS.map((p) => {
            const selected = picked === p.id;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer gap-3 rounded-md border p-3 focus-within:outline focus-within:outline-2 focus-within:outline-accent ${
                  selected ? 'border-ink bg-elevated' : 'border-line hover:border-line-strong'
                }`}
              >
                <input type="radio" name={groupId} value={p.id} checked={selected} onChange={() => setPicked(p.id)} className="sr-only" />
                <div className="w-16 shrink-0">
                  <CoverArt seed={p.coverSeed} kind={p.suggestedType} decorative rounded="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2 font-semibold text-ink">
                    {p.name}
                    {selected && (
                      <span className="flex items-center gap-1 text-xs font-medium text-tone-success">
                        <Check size={16} />
                        {WIZARD_UI.source.selected}
                      </span>
                    )}
                  </p>
                  <ProjectFacts project={p} />
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Button className="mt-4" disabled={!pickedProject} onClick={() => pickedProject && onStart(pickedProject)}>
        {WIZARD_COPY.source.start}
      </Button>
    </div>
  );
}
