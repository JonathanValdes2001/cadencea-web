/**
 * Seller actions per state (RELEASE-LIFECYCLE §6.4). The first item is the
 * primary action. Disabled actions stay in the list with the reason as a
 * tooltip (L1, L19, one appeal per decision). Studio rows, the detail page and
 * the state banner all render from this one table.
 */
import type { IsoDateTime, LifecycleState } from './types.ts';
import { isPublic } from './types.ts';
import { NOTICE_COPY } from './copy.ts';
import { DETAIL_UI } from './ui-copy.ts';
import { appealOption } from './selectors.ts';
import type { ReleaseView } from './selectors.ts';
import { fill, formatDate } from '../format.ts';

export type ReleaseActionId =
  | 'continue_editing'
  | 'submit'
  | 'delete_draft'
  | 'view_submission'
  | 'pull_back'
  | 'fix_and_resubmit'
  | 'read_reasons'
  | 'appeal'
  | 'delete'
  | 'view_appeal'
  | 'edit_release'
  | 'unpublish'
  | 'view_public'
  | 'appeal_update'
  | 'continue_update'
  | 'submit_update'
  | 'withdraw_update'
  | 'view_update'
  | 'pull_back_update'
  | 'fix_update'
  | 'resubmit_update'
  | 'relist'
  | 'free_up_space'
  | 'view_sale'
  | 'continue_update_draft';

export interface ReleaseActionItem {
  id: ReleaseActionId;
  label: string;
  disabledReason?: string;
}

export const ACTION_LABEL: Readonly<Record<Exclude<ReleaseActionId, 'view_public'>, string>> = {
  continue_editing: 'Continue editing',
  submit: 'Submit for review',
  delete_draft: 'Delete draft',
  view_submission: 'View submission',
  pull_back: 'Move back to draft',
  fix_and_resubmit: 'Fix and resubmit',
  read_reasons: 'Read the reasons',
  appeal: 'Appeal',
  delete: 'Delete',
  view_appeal: 'View appeal',
  edit_release: 'Edit release',
  unpublish: 'Unpublish',
  appeal_update: 'Appeal update decision',
  continue_update: 'Continue update',
  submit_update: 'Submit update',
  withdraw_update: 'Withdraw update',
  view_update: 'View update',
  pull_back_update: 'Move update back to draft',
  fix_update: 'Fix update',
  resubmit_update: 'Resubmit update',
  relist: 'Relist',
  free_up_space: 'Free up space',
  view_sale: 'View sale',
  continue_update_draft: 'Continue update draft',
};

function item(id: Exclude<ReleaseActionId, 'view_public'>, disabledReason?: string): ReleaseActionItem {
  return disabledReason ? { id, label: ACTION_LABEL[id], disabledReason } : { id, label: ACTION_LABEL[id] };
}

function caseQueued(state: LifecycleState, view: ReleaseView): boolean {
  const id = view.open?.caseIds[view.open.caseIds.length - 1];
  return Boolean(id && state.cases[id]?.status === 'queued');
}

/** The seller's actions for a release at `now`, primary first. */
export function releaseActions(state: LifecycleState, view: ReleaseView, now: IsoDateTime): ReleaseActionItem[] {
  const { release, open } = view;
  const option = appealOption(state, view, now);
  const appealBlock = option?.appeal
    ? NOTICE_COPY.disabled.alreadyAppealed
    : option?.windowClosed
      ? fill(NOTICE_COPY.disabled.appealEnded, { date: formatDate(option.until) })
      : undefined;
  const appealItem = (id: 'appeal' | 'appeal_update') => (option ? [item(id, appealBlock)] : []);

  switch (release.status) {
    case 'draft':
      return [item('continue_editing'), item('submit'), item('delete_draft')];
    case 'in_review':
      return caseQueued(state, view) ? [item('view_submission'), item('pull_back')] : [item('view_submission')];
    case 'changes_requested':
      return [item('fix_and_resubmit'), item('delete_draft')];
    case 'rejected':
      return view.openAppeal ? [item('view_appeal')] : [item('read_reasons'), ...appealItem('appeal'), item('delete')];
    case 'live': {
      if (open?.status === 'draft') return [item('continue_update'), item('submit_update'), item('withdraw_update'), item('unpublish')];
      if (open?.status === 'in_review') {
        return [
          item('view_update'),
          ...(caseQueued(state, view) ? [item('pull_back_update')] : []),
          item('withdraw_update'),
          item('unpublish'),
        ];
      }
      if (open?.status === 'changes_requested') return [item('fix_update'), item('resubmit_update'), item('withdraw_update'), item('unpublish')];
      if (open?.status === 'rejected') {
        return [item('view_appeal'), item('unpublish'), item('edit_release', NOTICE_COPY.disabled.finishUpdate)];
      }
      const items = [item('edit_release'), item('unpublish')];
      if (isPublic(release, now)) {
        items.push({ id: 'view_public', label: release.type === 'song' ? DETAIL_UI.viewOnStream : DETAIL_UI.viewOnMarket });
      }
      if (option?.isUpdate && !option.appeal && !option.windowClosed) items.push(...appealItem('appeal_update'));
      return items;
    }
    case 'unpublished': {
      const by = release.unpublished;
      if (by?.by === 'platform') return view.openAppeal ? [item('view_appeal')] : [item('read_reasons'), ...appealItem('appeal')];
      if (by?.by === 'system' && by.cause === 'exclusive_sold') return [item('view_sale')];
      if (by?.by === 'system' && by.cause === 'account_closed') return [];
      if (by?.by === 'system') return [item('free_up_space'), item('relist'), item('edit_release')];
      return [item('relist'), item('edit_release')];
    }
    case 'suspended':
      return [
        item('read_reasons'),
        ...(view.openAppeal ? [item('view_appeal')] : appealItem('appeal')),
        ...(open?.status === 'draft' ? [item('continue_update_draft')] : []),
        item('edit_release', NOTICE_COPY.disabled.onHold),
      ];
  }
}
