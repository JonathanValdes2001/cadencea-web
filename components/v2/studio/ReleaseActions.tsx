'use client';

import React, { createContext, useContext, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button, { type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill, formatDate } from '@/lib/v2-demo/format';
import type { ReleaseActionId, ReleaseActionItem } from '@/lib/v2-demo/release-lifecycle/actions';
import { CONFIRM_COPY, EVENT_COPY, type ConfirmCopy } from '@/lib/v2-demo/release-lifecycle/copy';
import { APPEAL_MESSAGE_MIN } from '@/lib/v2-demo/release-lifecycle/machine';
import { appealOption, releaseView, type ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import { SELLER_ACTOR, dispatch, useLifecycle } from '@/lib/v2-demo/release-lifecycle/store';
import { isPublic, type LifecycleAction } from '@/lib/v2-demo/release-lifecycle/types';
import { ACTION_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import ActionMenu, { type ActionMenuItem } from './ActionMenu';

/** Where navigation actions go (RL §6.4 "In the web demo"). Dialog actions return null. */
function actionHref(view: ReleaseView, id: ReleaseActionId): string | null {
  const base = `/studio/${view.release.id}`;
  switch (id) {
    case 'continue_editing':
    case 'fix_and_resubmit':
    case 'edit_release':
    case 'continue_update':
    case 'fix_update':
    case 'continue_update_draft':
      return `${base}/edit`;
    case 'submit':
    case 'submit_update':
    case 'resubmit_update':
      return `${base}/edit?step=review_submit`;
    case 'view_submission':
    case 'view_update':
      return `${base}#changes`;
    case 'view_appeal':
    case 'view_sale':
      return `${base}#timeline`;
    case 'read_reasons':
      return `${base}#reasons`;
    case 'view_public':
      return view.release.type === 'song' ? '/stream' : `/market/${view.release.slug}`;
    case 'free_up_space':
      return '/pricing';
    default:
      return null;
  }
}

type DialogAction = Extract<
  ReleaseActionId,
  'delete_draft' | 'delete' | 'pull_back' | 'pull_back_update' | 'withdraw_update' | 'unpublish' | 'relist' | 'appeal' | 'appeal_update'
>;

interface Pending {
  releaseId: string;
  action: DialogAction;
}

const RunContext = createContext<(releaseId: string, action: DialogAction) => void>(() => {});

/**
 * Owns the one confirmation dialog for seller actions on a page (RL §9.4 through
 * DemoConfirm, WEB-V2-SPEC §2.5). Rows, banners and menus ask it to open.
 */
export function ReleaseActionsProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const messageId = useId();

  const run = (releaseId: string, action: DialogAction) => {
    setPending({ releaseId, action });
    setMessage('');
    setError(null);
  };

  const state = useLifecycle();
  const release = pending ? state.releases[pending.releaseId] : null;
  const view = release ? releaseView(state, release, DEMO_NOW) : null;

  let copy: ConfirmCopy | null = null;
  let lifecycleAction: LifecycleAction | null = null;
  let tone: 'primary' | 'danger' = 'primary';
  if (pending && view) {
    const title = view.shown.payload.title;
    const n = view.current?.version ?? 1;
    const releaseId = view.release.id;
    const vars = { title, n, next: n + 1, date: view.release.goesPublicAt ? formatDate(view.release.goesPublicAt) : '' };
    const filled = (c: ConfirmCopy, useAlt = false): ConfirmCopy => ({
      ...c,
      title: fill(c.title, vars),
      body: fill(useAlt && c.bodyAlt ? c.bodyAlt : c.body, vars),
    });
    switch (pending.action) {
      case 'delete_draft':
        copy = filled(CONFIRM_COPY.delete_draft);
        tone = 'danger';
        lifecycleAction = { type: 'delete_release', releaseId };
        break;
      case 'delete':
        copy = { ...filled(CONFIRM_COPY.delete_draft), title: fill(ACTION_UI.deleteTitle, vars), confirm: ACTION_UI.deleteConfirm };
        tone = 'danger';
        lifecycleAction = { type: 'delete_release', releaseId };
        break;
      case 'pull_back':
      case 'pull_back_update':
        copy = filled(CONFIRM_COPY.pull_back);
        lifecycleAction = { type: 'pull_back', releaseId };
        break;
      case 'withdraw_update':
        copy = filled(CONFIRM_COPY.discard_update);
        tone = 'danger';
        lifecycleAction = { type: 'discard_update', releaseId };
        break;
      case 'unpublish': {
        const scheduled = view.release.status === 'live' && !isPublic(view.release, DEMO_NOW);
        copy = filled(scheduled ? CONFIRM_COPY.unpublish_scheduled : view.release.type === 'song' ? CONFIRM_COPY.unpublish_song : CONFIRM_COPY.unpublish);
        tone = 'danger';
        lifecycleAction = { type: 'unpublish', releaseId };
        break;
      }
      case 'relist':
        copy = filled(CONFIRM_COPY.relist);
        lifecycleAction = { type: 'relist', releaseId };
        break;
      case 'appeal':
      case 'appeal_update': {
        copy = filled(CONFIRM_COPY.appeal);
        const option = appealOption(state, view, DEMO_NOW);
        lifecycleAction = option ? { type: 'file_appeal', releaseId, appealedCaseId: option.caseId, message } : null;
        break;
      }
    }
  }

  const isAppeal = pending?.action === 'appeal' || pending?.action === 'appeal_update';
  const close = () => setPending(null);

  const confirm = () => {
    if (!lifecycleAction || !pending) return;
    const result = dispatch(lifecycleAction, SELLER_ACTOR);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPending(null);
    if (isAppeal) toast.show(`Demo: ${EVENT_COPY.appeal_filed.noticeTitle}. ${EVENT_COPY.appeal_filed.noticeBody}`);
    if (pending.action === 'delete' || pending.action === 'delete_draft') router.push('/studio');
  };

  return (
    <RunContext.Provider value={run}>
      {children}
      <DemoConfirm
        open={pending !== null && copy !== null}
        onClose={close}
        onConfirm={confirm}
        title={copy?.title ?? ''}
        body={copy?.body ?? ''}
        confirmLabel={copy?.confirm ?? ''}
        cancelLabel={copy?.cancel}
        tone={tone}
        confirmDisabled={isAppeal && message.trim().length < APPEAL_MESSAGE_MIN}
      >
        {isAppeal && (
          <TextAreaField
            id={messageId}
            label={ACTION_UI.appealLabel}
            hint={fill(ACTION_UI.appealHint, { min: APPEAL_MESSAGE_MIN, n: message.trim().length })}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </DemoConfirm>
    </RunContext.Provider>
  );
}

const DIALOG_ACTIONS: ReadonlySet<ReleaseActionId> = new Set<ReleaseActionId>([
  'delete_draft',
  'delete',
  'pull_back',
  'pull_back_update',
  'withdraw_update',
  'unpublish',
  'relist',
  'appeal',
  'appeal_update',
]);

const DANGER: ReadonlySet<ReleaseActionId> = new Set<ReleaseActionId>(['delete_draft', 'delete', 'withdraw_update', 'unpublish']);

/** One action as a button: a link for navigation, a dialog for §9.4 confirmations. */
export function ActionButton({
  view,
  item,
  variant = 'secondary',
  size = 'sm',
  fullWidth = false,
}: {
  view: ReleaseView;
  item: ReleaseActionItem;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  const run = useContext(RunContext);
  const href = actionHref(view, item.id);
  if (item.disabledReason) {
    return (
      <Button variant={variant} size={size} disabled disabledReason={item.disabledReason} fullWidth={fullWidth}>
        {item.label}
      </Button>
    );
  }
  if (href) {
    return (
      <Button variant={variant} size={size} href={href} fullWidth={fullWidth}>
        {item.label}
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} onClick={() => DIALOG_ACTIONS.has(item.id) && run(view.release.id, item.id as DialogAction)}>
      {item.label}
    </Button>
  );
}

/** The same actions as overflow-menu items. */
function useActionMenuItems(view: ReleaseView, items: readonly ReleaseActionItem[]): ActionMenuItem[] {
  const run = useContext(RunContext);
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    disabledReason: item.disabledReason,
    danger: DANGER.has(item.id),
    href: actionHref(view, item.id) ?? undefined,
    onSelect: DIALOG_ACTIONS.has(item.id) ? () => run(view.release.id, item.id as DialogAction) : undefined,
  }));
}

export function ReleaseActionMenu({ view, items, label }: { view: ReleaseView; items: readonly ReleaseActionItem[]; label: string }) {
  const menuItems = useActionMenuItems(view, items);
  return <ActionMenu label={label} items={menuItems} />;
}
