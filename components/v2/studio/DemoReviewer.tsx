'use client';

import React, { useEffect, useId, useState, useSyncExternalStore } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/Field';
import { Chevron } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { addDays, DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { DEMO_COPY, SOR_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { applyAction } from '@/lib/v2-demo/release-lifecycle/machine';
import { REASON_COPY, reasonCodesFor, reasonItem, type ReasonDecision } from '@/lib/v2-demo/release-lifecycle/reasons';
import { releaseView, type ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import {
  DEMO_APPEAL_REVIEWER,
  DEMO_REVIEWER,
  DEMO_SYSTEM,
  dispatch,
  lifecycleStore,
  useLifecycle,
} from '@/lib/v2-demo/release-lifecycle/store';
import {
  APPEAL_WINDOW_DAYS,
  type Actor,
  type AutoCheck,
  type LifecycleAction,
  type LifecycleState,
  type ReasonCode,
  type ReasonItem,
  type RestrictionKind,
  type ReviewCase,
  type StatementOfReasons,
} from '@/lib/v2-demo/release-lifecycle/types';
import { DEMO_REVIEWER_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { noticeFor } from './notices';

/* ------------------------------------------------------------------ */
/* Auto-approve (§7.3): in memory, only while a Studio page is open    */
/* ------------------------------------------------------------------ */

interface AutoApproveState {
  on: boolean;
  /** Cases already queued when the toggle went on: only new submissions are approved. */
  baseline: ReadonlySet<string>;
}

let autoApprove: AutoApproveState = { on: false, baseline: new Set() };
const autoListeners = new Set<() => void>();
const OFF: AutoApproveState = autoApprove;

function setAutoApprove(on: boolean) {
  const queued = Object.values(lifecycleStore.getSnapshot().cases)
    .filter((c) => c.status === 'queued')
    .map((c) => c.id);
  autoApprove = { on, baseline: new Set(on ? queued : []) };
  autoListeners.forEach((l) => l());
}

function useAutoApprove(): AutoApproveState {
  return useSyncExternalStore(
    (listener) => {
      autoListeners.add(listener);
      return () => autoListeners.delete(listener);
    },
    () => autoApprove,
    () => OFF,
  );
}

const AUTO_APPROVE_MS = 3000;

/**
 * Approves new submissions 3 seconds after they are queued, while the toggle is
 * on and a Studio page is open. A timer per submission; nothing runs in the
 * background or after a reload. Appeals, reports and held releases are skipped.
 */
export function AutoApprover() {
  const state = useLifecycle();
  const { on, baseline } = useAutoApprove();
  const toast = useToast();

  useEffect(() => {
    if (!on) return;
    const timers = Object.values(state.cases)
      .filter(
        (c) =>
          c.status === 'queued' &&
          (c.kind === 'new_release' || c.kind === 'update') &&
          !baseline.has(c.id) &&
          state.releases[c.releaseId]?.status !== 'suspended',
      )
      .map((c) =>
        setTimeout(() => {
          const result = dispatch({ type: 'approve', caseId: c.id }, DEMO_REVIEWER);
          const notice = result.ok ? noticeFor(result.state, result.events) : null;
          if (notice) toast.show(notice);
        }, AUTO_APPROVE_MS),
      );
    return () => timers.forEach(clearTimeout);
  }, [state, on, baseline, toast]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** From `lg` the panel docks over the page (WEB-V2-SPEC §3.6); below it sits in the page flow. */
const DOCKED_QUERY = '(min-width: 1024px)';

function useDocked(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia(DOCKED_QUERY);
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    },
    () => window.matchMedia(DOCKED_QUERY).matches,
    () => false,
  );
}

function openReviewCase(state: LifecycleState, view: ReleaseView): ReviewCase | null {
  const revision = view.open;
  if (!revision) return null;
  for (let i = revision.caseIds.length - 1; i >= 0; i -= 1) {
    const c = state.cases[revision.caseIds[i]];
    if (c && (c.kind === 'new_release' || c.kind === 'update') && (c.status === 'queued' || c.status === 'in_progress')) return c;
  }
  return null;
}

function canApply(state: LifecycleState, action: LifecycleAction, actor: Actor): boolean {
  return applyAction(state, action, actor, DEMO_NOW).ok;
}

const PROBE_REASONS = [reasonItem('other', 'Probe.')];
const probeStatement = (restriction: RestrictionKind): StatementOfReasons => ({
  restriction,
  reasons: PROBE_REASONS,
  facts: 'Probe.',
  ground: { kind: 'terms', clause: 'Probe' },
  automatedDetection: false,
  appealUntil: addDays(DEMO_NOW, APPEAL_WINDOW_DAYS),
  issuedAt: DEMO_NOW,
});

const checks = (flag: 'none' | 'duplicate' | 'listen'): AutoCheck[] => [
  { id: 'files_match_manifest', result: 'pass', sellerVisible: true },
  { id: 'formats', result: 'pass', sellerVisible: true },
  { id: 'minimum_count', result: 'pass', sellerVisible: true },
  { id: 'cover_art', result: 'pass', sellerVisible: true },
  { id: 'preview', result: 'pass', sellerVisible: true },
  { id: 'metadata_complete', result: 'pass', sellerVisible: true },
  { id: 'duplicate_sha256', result: flag === 'duplicate' ? 'flag' : 'pass', sellerVisible: false },
  { id: 'human_made_triage', result: flag === 'listen' ? 'flag' : 'pass', sellerVisible: false },
];

type FormKind = 'changes' | 'reject' | 'hold' | 'remove' | 'uphold';

interface DecisionPayload {
  reasons: ReasonItem[];
  statement: StatementOfReasons | null;
  note: string;
  disableDownloads: boolean;
}

const FORM_DECISION: Readonly<Record<Exclude<FormKind, 'uphold'>, ReasonDecision>> = {
  changes: 'changes',
  reject: 'reject',
  hold: 'suspend',
  remove: 'remove',
};

function defaultGround(codes: readonly ReasonCode[]): StatementOfReasons['ground'] {
  if (codes.includes('copyright_claim')) {
    return { kind: 'law', reference: fill(SOR_COPY.groundExamples.copyright, { claimant: DEMO_REVIEWER_UI.claimant }) };
  }
  if (codes.includes('human_made_violation')) return { kind: 'terms', clause: SOR_COPY.groundExamples.humanMade };
  return { kind: 'terms', clause: DEMO_REVIEWER_UI.groundDefault };
}

/* ------------------------------------------------------------------ */
/* The decision form                                                   */
/* ------------------------------------------------------------------ */

function DecisionForm({
  kind,
  firstRelease,
  upheldStatement,
  onSubmit,
  onCancel,
  error,
}: {
  kind: FormKind;
  firstRelease: boolean;
  /** For "Uphold": the appealed decision's statement, reused with new facts. */
  upheldStatement: StatementOfReasons | null;
  onSubmit: (payload: DecisionPayload) => void;
  onCancel: () => void;
  error: string | null;
}) {
  const baseId = useId();
  const codes = kind === 'uphold' ? [] : reasonCodesFor(FORM_DECISION[kind]);
  const [picked, setPicked] = useState<ReasonCode[]>(kind === 'hold' ? ['copyright_claim'] : []);
  const [messages, setMessages] = useState<Partial<Record<ReasonCode, string>>>({});
  const [note, setNote] = useState('');
  const [facts, setFacts] = useState<string>(DEMO_REVIEWER_UI.factsDefault);
  const [ground, setGround] = useState('');
  const [automated, setAutomated] = useState(false);
  const [disableDownloads, setDisableDownloads] = useState(false);
  const needsStatement = kind !== 'changes';

  const restriction: RestrictionKind =
    kind === 'hold' ? 'suspended' : kind === 'remove' ? 'removed' : firstRelease ? 'not_published' : 'update_not_published';
  const groundValue = ground.trim() ? ground.trim() : null;

  const submit = () => {
    const reasons = picked.map((code) => reasonItem(code, messages[code]?.trim() || undefined));
    if (kind === 'uphold' && upheldStatement) {
      onSubmit({
        reasons: upheldStatement.reasons,
        statement: { ...upheldStatement, facts: facts.trim(), automatedDetection: false, issuedAt: DEMO_NOW },
        note: '',
        disableDownloads: false,
      });
      return;
    }
    const fallback = defaultGround(picked);
    const statementGround: StatementOfReasons['ground'] = groundValue
      ? fallback.kind === 'law'
        ? { kind: 'law', reference: groundValue }
        : { kind: 'terms', clause: groundValue }
      : fallback;
    onSubmit({
      reasons,
      statement: needsStatement
        ? {
            restriction,
            reasons,
            facts: facts.trim(),
            ground: statementGround,
            automatedDetection: automated,
            appealUntil: addDays(DEMO_NOW, APPEAL_WINDOW_DAYS),
            issuedAt: DEMO_NOW,
          }
        : null,
      note: note.trim(),
      disableDownloads,
    });
  };

  return (
    <div className="mt-3 space-y-4 rounded-md border border-line bg-elevated p-3">
      {codes.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink">{DEMO_REVIEWER_UI.reasons}</legend>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
            {codes.map((code) => (
              <div key={code}>
                <CheckboxField
                  id={`${baseId}-${code}`}
                  label={REASON_COPY[code].title}
                  checked={picked.includes(code)}
                  onChange={(e) => setPicked((list) => (e.target.checked ? [...list, code] : list.filter((c) => c !== code)))}
                />
                {picked.includes(code) && code === 'other' && (
                  <div className="ml-8 mt-2">
                    <TextField
                      id={`${baseId}-${code}-message`}
                      label={fill(DEMO_REVIEWER_UI.reasonMessage, { reason: REASON_COPY[code].title })}
                      value={messages[code] ?? ''}
                      onChange={(e) => setMessages((m) => ({ ...m, [code]: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {kind === 'changes' && (
        <TextAreaField id={`${baseId}-note`} label={DEMO_REVIEWER_UI.note} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      )}
      {needsStatement && (
        <>
          <TextAreaField id={`${baseId}-facts`} label={DEMO_REVIEWER_UI.facts} value={facts} onChange={(e) => setFacts(e.target.value)} rows={2} />
          {kind !== 'uphold' && (
            <TextField
              id={`${baseId}-ground`}
              label={DEMO_REVIEWER_UI.ground}
              placeholder={(() => {
                const g = defaultGround(picked);
                return g.kind === 'law' ? g.reference : g.clause;
              })()}
              value={ground}
              onChange={(e) => setGround(e.target.value)}
            />
          )}
          {kind !== 'uphold' && (
            <CheckboxField id={`${baseId}-automated`} label={DEMO_REVIEWER_UI.automated} checked={automated} onChange={(e) => setAutomated(e.target.checked)} />
          )}
        </>
      )}
      {kind === 'hold' && (
        <CheckboxField
          id={`${baseId}-downloads`}
          label={DEMO_REVIEWER_UI.disableDownloads}
          checked={disableDownloads}
          onChange={(e) => setDisableDownloads(e.target.checked)}
        />
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={kind === 'changes' ? 'primary' : 'danger'} onClick={submit} disabled={kind !== 'uphold' && picked.length === 0} disabledReason={kind !== 'uphold' && picked.length === 0 ? DEMO_REVIEWER_UI.pickReason : undefined}>
          {DEMO_REVIEWER_UI.send}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {DEMO_REVIEWER_UI.cancel}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The panel                                                           */
/* ------------------------------------------------------------------ */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

/**
 * The Simulate review panel (RL §7.3): it acts as the review team or the system
 * on this release, showing only the buttons TRANSITIONS allows right now. Its
 * buttons act at once, without a dialog (§7.1), and every event they create is
 * tagged "Simulated".
 */
export default function DemoReviewer({ releaseId }: { releaseId: string }) {
  const state = useLifecycle();
  const toast = useToast();
  const auto = useAutoApprove();
  const titleId = useId();
  const bodyId = useId();
  // Docked, it starts collapsed so it doesn't cover the release's own actions; in the flow it starts open.
  const docked = useDocked();
  const [collapsedChoice, setCollapsedChoice] = useState<boolean | null>(null);
  const collapsed = collapsedChoice ?? docked;
  const [form, setForm] = useState<FormKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const release = state.releases[releaseId];
  if (!release) return null;
  const view = releaseView(state, release, DEMO_NOW);
  const reviewCase = openReviewCase(state, view);
  const appeal = view.openAppeal;
  const appealCase = appeal ? state.cases[appeal.appealCaseId] : null;
  const firstRelease = release.currentRevisionId === null;
  const decisionRestriction: RestrictionKind = firstRelease ? 'not_published' : 'update_not_published';

  const act = (action: LifecycleAction, actor: Actor) => {
    const result = dispatch(action, actor);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setError(null);
    setForm(null);
    const notice = noticeFor(result.state, result.events);
    if (notice) toast.show(notice);
    return true;
  };

  const caseToStart = reviewCase?.status === 'queued' ? reviewCase : appealCase?.status === 'queued' ? appealCase : null;
  const can = {
    checks: reviewCase !== null && canApply(state, { type: 'auto_checks_completed', caseId: reviewCase.id, checks: [] }, DEMO_SYSTEM),
    start: caseToStart !== null && canApply(state, { type: 'start_review', caseId: caseToStart.id }, caseToStart === appealCase ? DEMO_APPEAL_REVIEWER : DEMO_REVIEWER),
    approve: reviewCase !== null && canApply(state, { type: 'approve', caseId: reviewCase.id }, DEMO_REVIEWER),
    changes: reviewCase !== null && canApply(state, { type: 'request_changes', caseId: reviewCase.id, reasons: PROBE_REASONS }, DEMO_REVIEWER),
    reject: reviewCase !== null && canApply(state, { type: 'reject', caseId: reviewCase.id, statement: probeStatement(decisionRestriction) }, DEMO_REVIEWER),
    hold: canApply(state, { type: 'suspend', releaseId, statement: probeStatement('suspended'), disableDownloads: false }, DEMO_REVIEWER),
    reinstate: canApply(state, { type: 'reinstate', releaseId }, DEMO_REVIEWER),
    remove: canApply(state, { type: 'remove', releaseId, statement: probeStatement('removed') }, DEMO_REVIEWER),
    uphold: appeal !== null && canApply(state, { type: 'decide_appeal', appealId: appeal.id, outcome: 'upheld', statement: probeStatement('not_published') }, DEMO_APPEAL_REVIEWER),
    overturn: appeal !== null && canApply(state, { type: 'decide_appeal', appealId: appeal.id, outcome: 'overturned' }, DEMO_APPEAL_REVIEWER),
    filesChanged:
      reviewCase !== null &&
      canApply(state, { type: 'request_changes', caseId: reviewCase.id, reasons: [reasonItem('files_changed_since_submit')] }, DEMO_SYSTEM),
    quota: canApply(state, { type: 'quota_unpublish', releaseId }, DEMO_SYSTEM),
    exclusive: canApply(state, { type: 'exclusive_sold', releaseId }, DEMO_SYSTEM),
  };
  const reviewButtons = can.checks || can.start || can.approve || can.changes || can.reject;
  const releaseButtons = can.hold || can.reinstate || can.remove;
  const systemButtons = can.filesChanged || can.quota || can.exclusive;
  const appealButtons = can.uphold || can.overturn;

  const appealedStatement = (() => {
    const decided = appeal ? state.cases[appeal.appealedCaseId]?.decision : null;
    return decided && 'statement' in decided ? decided.statement : null;
  })();

  const lastChecks = reviewCase?.checks.length
    ? reviewCase.checks.some((c) => c.result === 'flag')
      ? reviewCase.checks
          .filter((c) => c.result === 'flag')
          .map((c) => (c.id === 'duplicate_sha256' ? DEMO_REVIEWER_UI.checksDuplicate : DEMO_REVIEWER_UI.checksListen))
          .join(', ')
      : DEMO_REVIEWER_UI.checksClear
    : null;

  const submitForm = (payload: DecisionPayload) => {
    if (!form) return;
    if (form === 'changes' && reviewCase) act({ type: 'request_changes', caseId: reviewCase.id, reasons: payload.reasons, note: payload.note || undefined }, DEMO_REVIEWER);
    if (form === 'reject' && reviewCase && payload.statement) act({ type: 'reject', caseId: reviewCase.id, statement: payload.statement }, DEMO_REVIEWER);
    if (form === 'hold' && payload.statement) act({ type: 'suspend', releaseId, statement: payload.statement, disableDownloads: payload.disableDownloads }, DEMO_REVIEWER);
    if (form === 'remove' && payload.statement) act({ type: 'remove', releaseId, statement: payload.statement }, DEMO_REVIEWER);
    if (form === 'uphold' && appeal && payload.statement) act({ type: 'decide_appeal', appealId: appeal.id, outcome: 'upheld', statement: payload.statement }, DEMO_APPEAL_REVIEWER);
  };

  const formButton = (kind: FormKind, label: string, enabled: boolean) =>
    enabled && (
      <Button size="sm" variant={form === kind ? 'primary' : 'secondary'} aria-expanded={form === kind} onClick={() => setForm(form === kind ? null : kind)}>
        {label}
      </Button>
    );

  return (
    <aside
      aria-labelledby={titleId}
      className={`mt-10 rounded-md border-2 border-dashed border-brand-300 bg-canvas p-4 lg:fixed lg:bottom-6 lg:right-6 lg:z-40 lg:mt-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:shadow-dropdown ${
        collapsed ? 'lg:w-auto' : 'lg:w-[400px]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="demo">{DEMO_REVIEWER_UI.badge}</Badge>
          <h2 id={titleId} className="mt-2 text-base font-semibold text-ink">
            {DEMO_COPY.reviewerTitle}
          </h2>
        </div>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? DEMO_REVIEWER_UI.expand : DEMO_REVIEWER_UI.collapse}
          onClick={() => setCollapsedChoice(!collapsed)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-elevated hover:text-ink"
        >
          <Chevron size={20} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>
      <div id={bodyId} hidden={collapsed}>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{DEMO_COPY.reviewerSubtitle}</p>

        <div className="mt-4 space-y-3">
          {reviewButtons && (
            <Group title={DEMO_REVIEWER_UI.reviewHeading}>
              {can.checks && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => reviewCase && act({ type: 'auto_checks_completed', caseId: reviewCase.id, checks: checks('none') }, DEMO_SYSTEM)}>
                    {`${DEMO_REVIEWER_UI.checks}: ${DEMO_REVIEWER_UI.checksClear}`}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => reviewCase && act({ type: 'auto_checks_completed', caseId: reviewCase.id, checks: checks('duplicate') }, DEMO_SYSTEM)}>
                    {DEMO_REVIEWER_UI.checksDuplicate}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => reviewCase && act({ type: 'auto_checks_completed', caseId: reviewCase.id, checks: checks('listen') }, DEMO_SYSTEM)}>
                    {DEMO_REVIEWER_UI.checksListen}
                  </Button>
                </>
              )}
              {can.start && caseToStart && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act({ type: 'start_review', caseId: caseToStart.id }, caseToStart === appealCase ? DEMO_APPEAL_REVIEWER : DEMO_REVIEWER)}
                >
                  {DEMO_REVIEWER_UI.startReview}
                </Button>
              )}
              {can.approve && reviewCase && (
                <Button size="sm" variant="primary" onClick={() => act({ type: 'approve', caseId: reviewCase.id }, DEMO_REVIEWER)}>
                  {DEMO_REVIEWER_UI.approve}
                </Button>
              )}
              {formButton('changes', DEMO_REVIEWER_UI.requestChanges, can.changes)}
              {formButton('reject', DEMO_REVIEWER_UI.reject, can.reject)}
              {lastChecks && <p className="w-full text-xs text-ink-subtle">{fill(DEMO_REVIEWER_UI.lastChecks, { result: lastChecks })}</p>}
            </Group>
          )}
          {appealButtons && (
            <Group title={DEMO_REVIEWER_UI.appealHeading}>
              {formButton('uphold', DEMO_REVIEWER_UI.uphold, can.uphold)}
              {can.overturn && appeal && (
                <Button size="sm" variant="primary" onClick={() => act({ type: 'decide_appeal', appealId: appeal.id, outcome: 'overturned' }, DEMO_APPEAL_REVIEWER)}>
                  {DEMO_REVIEWER_UI.overturn}
                </Button>
              )}
            </Group>
          )}
          {releaseButtons && (
            <Group title={DEMO_REVIEWER_UI.releaseHeading}>
              {formButton('hold', DEMO_REVIEWER_UI.hold, can.hold)}
              {can.reinstate && (
                <Button size="sm" variant="secondary" onClick={() => act({ type: 'reinstate', releaseId }, DEMO_REVIEWER)}>
                  {DEMO_REVIEWER_UI.reinstate}
                </Button>
              )}
              {formButton('remove', DEMO_REVIEWER_UI.remove, can.remove)}
            </Group>
          )}
          {systemButtons && (
            <Group title={DEMO_REVIEWER_UI.systemHeading}>
              {can.filesChanged && reviewCase && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act({ type: 'request_changes', caseId: reviewCase.id, reasons: [reasonItem('files_changed_since_submit')] }, DEMO_SYSTEM)}
                >
                  {DEMO_REVIEWER_UI.filesChanged}
                </Button>
              )}
              {can.quota && (
                <Button size="sm" variant="secondary" onClick={() => act({ type: 'quota_unpublish', releaseId }, DEMO_SYSTEM)}>
                  {DEMO_REVIEWER_UI.overQuota}
                </Button>
              )}
              {can.exclusive && (
                <Button size="sm" variant="secondary" onClick={() => act({ type: 'exclusive_sold', releaseId }, DEMO_SYSTEM)}>
                  {DEMO_REVIEWER_UI.exclusiveSold}
                </Button>
              )}
            </Group>
          )}
          {!reviewButtons && !appealButtons && !releaseButtons && !systemButtons && <p className="text-sm text-ink-muted">{DEMO_REVIEWER_UI.nothing}</p>}

          {form && (
            <DecisionForm
              key={form}
              kind={form}
              firstRelease={firstRelease}
              upheldStatement={appealedStatement}
              onSubmit={submitForm}
              onCancel={() => {
                setForm(null);
                setError(null);
              }}
              error={error}
            />
          )}
          {!form && error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <div className="border-t border-line pt-3">
            <CheckboxField id={`${titleId}-auto`} label={DEMO_COPY.autoApprove} checked={auto.on} onChange={(e) => setAutoApprove(e.target.checked)} />
          </div>
        </div>
      </div>
    </aside>
  );
}
