import React from 'react';
import { fill, formatDate } from '@/lib/v2-demo/format';
import type { Revision } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI, TIMELINE_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

/** Every approved version with its date, change note and "Superseded on {date}" (RL §6.3). */
export default function VersionHistory({ revisions }: { revisions: readonly Revision[] }) {
  const versions = revisions.filter((r) => r.status === 'approved' && r.version !== null).sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
  if (versions.length === 0) return <p className="text-sm text-ink-muted">{DETAIL_UI.noVersions}</p>;
  return (
    <ol className="divide-y divide-line rounded-md border border-line">
      {versions.map((r) => (
        <li key={r.id} className="px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm font-semibold tabular-nums text-ink">{fill(TIMELINE_UI.version, { n: r.version ?? '' })}</span>
            {r.decidedAt && <span className="text-xs text-ink-subtle">{fill(DETAIL_UI.approvedOn, { date: formatDate(r.decidedAt) })}</span>}
            <span className="text-xs text-ink-subtle">
              {r.supersededAt ? fill(DETAIL_UI.supersededOn, { date: formatDate(r.supersededAt) }) : DETAIL_UI.currentVersion}
            </span>
          </div>
          {r.changeNote && r.version !== 1 && <p className="mt-1 text-sm text-ink-muted">{r.changeNote}</p>}
        </li>
      ))}
    </ol>
  );
}
