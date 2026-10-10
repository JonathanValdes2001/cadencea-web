import React from 'react';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { ACTION_LABEL, type ReleaseActionId, type ReleaseActionItem } from '@/lib/v2-demo/release-lifecycle/actions';
import { BANNER_COPY, CHIP_COPY, EVENT_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { appealOption, type ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import { isPublic, type LifecycleState, type Tone } from '@/lib/v2-demo/release-lifecycle/types';
import { ActionButton } from './ReleaseActions';

interface Banner {
  title: string;
  body: string;
  actions: readonly string[];
  tone: Tone;
}

const TONE_CLASS: Readonly<Record<Tone, string>> = {
  neutral: 'border-line bg-elevated',
  info: 'border-brand-200 bg-tone-info-bg',
  update: 'border-tone-update bg-tone-update-bg',
  warning: 'border-tone-warning bg-tone-warning-bg',
  success: 'border-tone-success bg-tone-success-bg',
  danger: 'border-tone-danger bg-tone-danger-bg',
};

function caseQueued(state: LifecycleState, view: ReleaseView): boolean {
  const id = view.open?.caseIds[view.open.caseIds.length - 1];
  return Boolean(id && state.cases[id]?.status === 'queued');
}

/** Picks the one RL §9.2 banner for the release's state, with its variables filled in. */
function bannerFor(state: LifecycleState, view: ReleaseView): Banner | null {
  const { release, open, current } = view;
  const n = current?.version ?? 1;
  const vars = { n, next: n + 1 };
  const make = (key: keyof typeof BANNER_COPY, tone: Tone, extra: Record<string, string | number> = {}, alt = false): Banner => {
    const copy = BANNER_COPY[key];
    const body = alt && 'bodyAlt' in copy ? copy.bodyAlt : copy.body;
    return { title: copy.title, body: fill(body, { ...vars, ...extra }), actions: copy.actions, tone };
  };
  // An appeal on a first rejection or a removal has no banner of its own; the chip's words are used.
  const appealBanner: Banner = { title: CHIP_COPY.appeal_in_progress.label, body: CHIP_COPY.appeal_in_progress.hint, actions: ['View appeal'], tone: 'info' };
  const option = appealOption(state, view, DEMO_NOW);
  const until = option ? formatDate(option.until) : '';

  switch (release.status) {
    case 'draft':
      return make('draft', 'neutral');
    case 'in_review':
      return caseQueued(state, view) ? make('in_review_queued', 'info') : make('in_review_started', 'info');
    case 'changes_requested':
      return make('needs_changes_first', 'warning');
    case 'rejected':
      if (view.openAppeal) return appealBanner;
      if (option?.appeal) {
        return {
          title: EVENT_COPY.appeal_upheld.noticeTitle,
          body: fill(EVENT_COPY.appeal_upheld.noticeBody, { statement: BANNER_COPY.rejected_first.title }),
          actions: ['Read the reasons'],
          tone: 'danger',
        };
      }
      return make('rejected_first', 'danger', { date: until });
    case 'live': {
      if (open?.status === 'draft') return make('live_update_draft', 'update');
      if (open?.status === 'in_review') return make('live_update_in_review', 'update', {}, release.type === 'song');
      if (open?.status === 'changes_requested') return make('live_update_needs_changes', 'warning');
      if (open?.status === 'rejected') return make('live_update_appealed', 'update');
      if (option?.isUpdate && !option.appeal && !option.windowClosed) return make('live_update_rejected', 'warning', { date: until });
      if (!isPublic(release, DEMO_NOW) && release.goesPublicAt) return make('scheduled', 'info', { date: formatDate(release.goesPublicAt) });
      return make('live', 'success', { date: current?.decidedAt ? formatDate(current.decidedAt) : '' });
    }
    case 'unpublished': {
      const by = release.unpublished;
      if (!by) return null;
      const date = formatDate(by.at);
      if (by.by === 'seller') return make('unpublished_seller', 'neutral', { date });
      if (by.by === 'platform') return view.openAppeal ? appealBanner : make('removed', 'danger', { date, appealDate: until });
      if (by.cause === 'exclusive_sold') return make('sold_exclusive', 'neutral', { date });
      if (by.cause === 'storage_over_quota') return make('unpublished_storage', 'warning');
      return null;
    }
    case 'suspended':
      return make('on_hold', 'warning', {}, Boolean(release.suspension?.downloadsDisabled));
  }
}

const BY_LABEL = new Map(Object.entries(ACTION_LABEL).map(([id, label]) => [label, id as ReleaseActionId]));
/** Banner actions that only navigate within the page, so they are always available. */
const PAGE_ACTIONS: ReadonlySet<ReleaseActionId> = new Set(['read_reasons', 'view_appeal', 'view_update', 'view_submission']);

/** A banner label as an action: the §6.4 item when there is one (it carries any disabled reason). */
function bannerItem(label: string, actions: readonly ReleaseActionItem[]): ReleaseActionItem | null {
  const id = BY_LABEL.get(label);
  if (!id) return null;
  const found = actions.find((a) => a.id === id || (id === 'appeal' && a.id === 'appeal_update'));
  if (found) return { ...found, label };
  return PAGE_ACTIONS.has(id) ? { id, label } : null;
}

/** The release detail's one state banner (RL §9.2), with its actions from the §6.4 table. */
export default function StateBanner({ state, view, actions }: { state: LifecycleState; view: ReleaseView; actions: readonly ReleaseActionItem[] }) {
  const banner = bannerFor(state, view);
  if (!banner) return null;
  const items = banner.actions.map((label) => bannerItem(label, actions)).filter((a): a is ReleaseActionItem => a !== null);
  return (
    <section aria-label={banner.title} className={`mt-8 rounded-md border-l-4 px-5 py-4 ${TONE_CLASS[banner.tone]}`}>
      <h2 className="text-base font-semibold text-ink">{banner.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{banner.body}</p>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <ActionButton key={item.id} view={view} item={item} variant={i === 0 ? 'primary' : 'secondary'} />
          ))}
        </div>
      )}
    </section>
  );
}
