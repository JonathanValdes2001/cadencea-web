import React from 'react';
import { fill } from '@/lib/v2-demo/format';
import type { ChangeSummary } from '@/lib/v2-demo/release-lifecycle/types';
import { CHANGE_KIND_LABEL, FILE_CHANGE_LABEL, WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { ReviewDepthChip } from '@/components/v2/studio/LiveVsPending';

/**
 * The update wizard's "Changes" panel (RL §5.6): the live change summary
 * against version {n} and the review depth it needs, on every step.
 */
export default function ChangesPanel({ changes, liveVersion }: { changes: ChangeSummary; liveVersion: number }) {
  const fileCounts = (['added', 'removed', 'replaced', 'renamed'] as const)
    .map((kind) => ({ kind, n: changes.files.filter((f) => f.change === kind).length }))
    .filter((c) => c.n > 0);
  return (
    <section aria-labelledby="wizard-changes" aria-live="polite" className="rounded-md border border-line p-4">
      <h2 id="wizard-changes" className="text-sm font-semibold uppercase tracking-widest text-ink-subtle">
        {WIZARD_UI.changes}
      </h2>
      <p className="mt-1 text-xs text-ink-subtle">{fill(WIZARD_UI.changesAgainst, { n: liveVersion })}</p>
      {changes.kinds.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{WIZARD_UI.noChanges}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {changes.kinds.map((kind) => (
              <li key={kind} className="flex justify-between gap-2">
                <span>{CHANGE_KIND_LABEL[kind]}</span>
                <span className="tabular-nums text-ink-subtle">{kind === 'files' ? '' : changes.fields.filter((f) => f.kind === kind).length || ''}</span>
              </li>
            ))}
          </ul>
          {fileCounts.length > 0 && (
            <p className="mt-2 text-xs tabular-nums text-ink-muted">{fileCounts.map((c) => `${FILE_CHANGE_LABEL[c.kind]} ${c.n}`).join(' · ')}</p>
          )}
          <div className="mt-3">
            <ReviewDepthChip depth={changes.reviewDepth} />
          </div>
        </>
      )}
    </section>
  );
}
