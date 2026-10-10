import React from 'react';
import { fill, formatBytes } from '@/lib/v2-demo/format';
import type { FileChange } from '@/lib/v2-demo/release-lifecycle/types';
import { FILE_CHANGE_LABEL, FILE_DIFF_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

const GROUPS = ['added', 'removed', 'replaced', 'renamed'] as const;
const SHOW_OPEN = 8;

function signedBytes(delta: number): string {
  if (delta === 0) return '0 B';
  return `${delta > 0 ? '+' : '−'}${formatBytes(Math.abs(delta))}`;
}

const short = (hash: string | undefined) => (hash ?? '').slice(0, 7);

/**
 * Files in an update (RL §6.3): grouped Added, Removed, Replaced (same path, new
 * hash), Renamed (same hash, new path) and an Unchanged count, with totals, the
 * size change and 7-character hashes.
 */
export default function FileDiff({
  changes,
  unchanged,
  afterCount,
}: {
  changes: readonly FileChange[];
  unchanged: number;
  afterCount: number;
}) {
  const delta = changes.reduce((sum, c) => sum + c.bytesDelta, 0);
  if (changes.length === 0) {
    return <p className="text-sm text-ink-muted">{FILE_DIFF_UI.noChanges}</p>;
  }
  return (
    <div>
      <p className="text-sm text-ink-muted tabular-nums">{fill(FILE_DIFF_UI.totals, { n: afterCount, delta: signedBytes(delta) })}</p>
      <div className="mt-3 space-y-2">
        {GROUPS.map((group) => {
          const items = changes.filter((c) => c.change === group);
          if (items.length === 0) return null;
          return (
            <details key={group} open={items.length <= SHOW_OPEN} className="rounded-md border border-line">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 text-sm font-semibold text-ink">
                <span>
                  {FILE_CHANGE_LABEL[group]} <span className="tabular-nums text-ink-muted">({items.length})</span>
                </span>
              </summary>
              <ul className="divide-y divide-line border-t border-line">
                {items.map((c) => (
                  <li key={`${group}-${c.path}`} className="flex flex-col gap-0.5 px-4 py-2 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="min-w-0 break-words text-ink">
                      {c.path}
                      {c.previousPath && <span className="block text-xs text-ink-subtle">{fill(FILE_DIFF_UI.renamedFrom, { path: c.previousPath })}</span>}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                      {group === 'replaced'
                        ? fill(FILE_DIFF_UI.hashChange, { before: short(c.beforeSha256), after: short(c.afterSha256) })
                        : fill(FILE_DIFF_UI.hash, { hash: short(c.afterSha256 ?? c.beforeSha256) })}
                      {' · '}
                      {signedBytes(c.bytesDelta)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        <p className="px-1 text-sm text-ink-muted tabular-nums">{fill(FILE_DIFF_UI.unchanged, { n: unchanged })}</p>
      </div>
    </div>
  );
}
