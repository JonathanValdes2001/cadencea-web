import { fill, formatDate } from '@/lib/v2-demo/format';
import { EVENT_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import type { LifecycleState, ReviewEvent } from '@/lib/v2-demo/release-lifecycle/types';

type NoticeKey = keyof typeof EVENT_COPY;

/**
 * The in-app notice for a decision (RL §6.5, §9.5), shown as a "Demo:" toast
 * after a Demo reviewer action. Returns null for events without a notice.
 */
export function noticeFor(state: LifecycleState, events: readonly ReviewEvent[]): string | null {
  for (const event of [...events].reverse()) {
    if (event.visibility !== 'seller') continue;
    const revision = event.revisionId ? state.revisions[event.revisionId] : null;
    const release = state.releases[event.releaseId];
    const key: NoticeKey | null =
      event.type === 'rejected'
        ? revision?.baseVersion !== null && revision?.baseVersion !== undefined
          ? 'rejected_update'
          : 'rejected'
        : event.type in EVENT_COPY
          ? (event.type as NoticeKey)
          : null;
    if (!key) continue;
    const copy = EVENT_COPY[key];
    if (!('noticeTitle' in copy)) continue;
    const title = revision?.payload.title ?? (release?.currentRevisionId ? state.revisions[release.currentRevisionId]?.payload.title : '') ?? '';
    const date = release?.goesPublicAt ? formatDate(release.goesPublicAt) : '';
    return `Demo: ${fill(copy.noticeTitle, { title, date, n: event.version ?? '' })}.`;
  }
  return null;
}
