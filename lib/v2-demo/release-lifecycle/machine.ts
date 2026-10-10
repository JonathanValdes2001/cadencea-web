/**
 * The release lifecycle reducer (RELEASE-LIFECYCLE §4.6, §8 "Reducer contract").
 *
 * Pure: no I/O, time is passed in. A rule from TRANSITIONS is picked by action,
 * actor kind, scope (first or update) and the current release and revision
 * statuses; the data guards of §4.6 (validation, appeal windows, the different
 * reviewer, L1, L19) run after the match. Every effect of one action lands in
 * one new state, and every event is appended, never edited.
 */
import type {
  Actor,
  ActorKind,
  Appeal,
  ApplyAction,
  ApplyResult,
  Id,
  IsoDateTime,
  LifecycleAction,
  LifecycleActionType,
  LifecycleErrorCode,
  LifecycleState,
  Release,
  ReleaseStatus,
  ReviewCase,
  ReviewEvent,
  ReviewEventType,
  Revision,
  RevisionStatus,
  StatementOfReasons,
  SystemProcess,
  TransitionRule,
  ValidationIssue,
} from './types.ts';
import { APPEAL_WINDOW_DAYS, RELEASE_TYPE_INFO, TRANSITIONS, isPublic } from './types.ts';
import { diffRevision, emptyChangeSummary } from './diff.ts';
import { validateSubmission } from './validation.ts';
import { addDays } from '../clock.ts';
import { CATEGORY_KEYS } from '../categories.ts';
import { MARKET_ITEMS } from '../market/items.ts';

/** The Demo reviewer (§7.3). Appeals are decided by the second id, so "a different reviewer" holds. */
export const DEMO_REVIEWER_ID = 'demo-reviewer';
export const DEMO_APPEAL_REVIEWER_ID = 'demo-reviewer-2';

const INTERNAL_EVENTS: ReadonlySet<ReviewEventType> = new Set(['draft_saved', 'auto_checks_completed', 'publish_failed']);

const ERROR_MESSAGE: Readonly<Record<LifecycleErrorCode, string>> = {
  not_found: 'That release is not in this Studio.',
  not_allowed_for_actor: "This actor can't take that action.",
  invalid_state: "That action isn't available in this state.",
  open_revision_exists: 'Finish or withdraw the current update first.',
  validation_failed: 'Fix the issues listed before you continue.',
  nothing_changed: 'Nothing changed yet.',
  review_already_started: 'The review has already started.',
  appeal_window_closed: 'The appeal period has ended.',
  appeal_exists: 'You already appealed this decision.',
  same_reviewer: 'A different reviewer must decide the appeal.',
  release_suspended: "You can't edit or submit while this release is on hold.",
  not_relistable: "This release can't be relisted.",
  type_not_publishable: "Sellers can't publish this type.",
};

/** Events from the Demo reviewer panel carry the "Simulated" tag (§7.3, §9.9). */
function isSimulatedActor(actor: Actor): boolean {
  return (
    (actor.kind === 'reviewer' && actor.reviewerId.startsWith(DEMO_REVIEWER_ID)) ||
    (actor.kind === 'system' && actor.process === 'demo_simulator')
  );
}

function fail(error: LifecycleErrorCode, issues?: ValidationIssue[]): ApplyResult {
  return issues ? { ok: false, error, message: ERROR_MESSAGE[error], issues } : { ok: false, error, message: ERROR_MESSAGE[error] };
}

/* ------------------------------------------------------------------ */
/* Rule matching                                                       */
/* ------------------------------------------------------------------ */

type Scope = 'first' | 'update';

function matchRule(
  action: LifecycleActionType,
  actor: ActorKind,
  scope: Scope,
  release: ReleaseStatus | 'none',
  revision: RevisionStatus | 'none',
  ids?: readonly string[],
): TransitionRule | LifecycleErrorCode {
  const byAction = TRANSITIONS.filter((r) => r.action === action && (!ids || ids.includes(r.id)));
  if (!byAction.some((r) => r.actors.includes(actor))) return 'not_allowed_for_actor';
  const rule = byAction.find(
    (r) =>
      r.actors.includes(actor) &&
      (r.scope === 'any' || r.scope === scope) &&
      r.release.from.includes(release) &&
      r.revision.from.includes(revision),
  );
  return rule ?? 'invalid_state';
}

function actorMayTake(action: LifecycleActionType, actor: ActorKind): boolean {
  return TRANSITIONS.some((r) => r.action === action && r.actors.includes(actor));
}

/* ------------------------------------------------------------------ */
/* A transaction: copies of the maps, plus the events it emits         */
/* ------------------------------------------------------------------ */

interface Tx {
  state: LifecycleState;
  events: ReviewEvent[];
  actor: Actor;
  now: IsoDateTime;
}

function begin(state: LifecycleState, actor: Actor, now: IsoDateTime): Tx {
  return {
    state: {
      ...state,
      releases: { ...state.releases },
      revisions: { ...state.revisions },
      cases: { ...state.cases },
      appeals: { ...state.appeals },
      events: [...state.events],
    },
    events: [],
    actor,
    now,
  };
}

function commit(tx: Tx): ApplyResult {
  return { ok: true, state: tx.state, events: tx.events };
}

function emit(
  tx: Tx,
  releaseId: Id,
  type: ReviewEventType,
  fields: Partial<Omit<ReviewEvent, 'id' | 'releaseId' | 'type' | 'at'>> = {},
): void {
  const event: ReviewEvent = {
    id: `ev-${tx.state.events.length + 1}`,
    releaseId,
    revisionId: null,
    type,
    at: tx.now,
    actor: tx.actor,
    visibility: INTERNAL_EVENTS.has(type) ? 'internal' : 'seller',
    version: null,
    seq: null,
    ...fields,
  };
  if (isSimulatedActor(event.actor)) event.simulated = true;
  tx.state.events.push(event);
  tx.events.push(event);
}

function patchRelease(tx: Tx, id: Id, patch: Partial<Release>): Release {
  const next = { ...tx.state.releases[id], ...patch, updatedAt: tx.now };
  tx.state.releases[id] = next;
  return next;
}

function patchRevision(tx: Tx, id: Id, patch: Partial<Revision>): Revision {
  const next = { ...tx.state.revisions[id], ...patch };
  tx.state.revisions[id] = next;
  return next;
}

function patchCase(tx: Tx, id: Id, patch: Partial<ReviewCase>): ReviewCase {
  const next = { ...tx.state.cases[id], ...patch };
  tx.state.cases[id] = next;
  return next;
}

function newCase(tx: Tx, fields: Pick<ReviewCase, 'releaseId' | 'revisionId' | 'kind' | 'priority' | 'depth'> & Partial<ReviewCase>): ReviewCase {
  const id = `rc-${Object.keys(tx.state.cases).length + 1}`;
  const reviewCase: ReviewCase = {
    id,
    status: 'queued',
    assignedReviewerId: null,
    checks: [],
    decision: null,
    decidedBy: null,
    appealOfCaseId: null,
    openedAt: tx.now,
    decidedAt: null,
    ...fields,
  };
  tx.state.cases[id] = reviewCase;
  return reviewCase;
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

function revisionsOf(state: LifecycleState, release: Release): Revision[] {
  return release.revisionIds.map((id) => state.revisions[id]).filter(Boolean);
}

function openOf(state: LifecycleState, release: Release): Revision | null {
  return release.openRevisionId ? state.revisions[release.openRevisionId] ?? null : null;
}

function currentOf(state: LifecycleState, release: Release): Revision | null {
  return release.currentRevisionId ? state.revisions[release.currentRevisionId] ?? null : null;
}

/** The revision a seller action concerns: the open one, or for a never-approved release its latest. */
function subjectOf(state: LifecycleState, release: Release): Revision | null {
  const open = openOf(state, release);
  if (open || release.currentRevisionId !== null) return open;
  const all = revisionsOf(state, release);
  return all[all.length - 1] ?? null;
}

function scopeOf(release: Release): Scope {
  return release.currentRevisionId === null ? 'first' : 'update';
}

function latestCase(state: LifecycleState, revision: Revision): ReviewCase | null {
  const id = revision.caseIds[revision.caseIds.length - 1];
  return id ? state.cases[id] ?? null : null;
}

function reviewerId(actor: Actor): Id | null {
  return actor.kind === 'reviewer' ? actor.reviewerId : null;
}

/** A song approved with a future release date goes live but stays private until that day (§4.2). */
function goesPublicAtFor(revision: Revision, now: IsoDateTime): IsoDateTime | null {
  if (revision.payload.kind !== 'song' || !revision.payload.releaseDate) return null;
  const at = `${revision.payload.releaseDate}T00:00:00Z`;
  return Date.parse(at) > Date.parse(now) ? at : null;
}

function statementComplete(s: StatementOfReasons | undefined): boolean {
  if (!s) return false;
  const groundText = s.ground.kind === 'terms' ? s.ground.clause : s.ground.reference;
  return (
    s.reasons.length > 0 &&
    s.reasons.every((r) => r.message.trim().length > 0) &&
    s.facts.trim().length > 0 &&
    groundText.trim().length > 0 &&
    Boolean(s.appealUntil) &&
    Boolean(s.issuedAt)
  );
}

/** Letters NFKD doesn't decompose ("Tromsø" → "tromso"). */
const TRANSLITERATE: Readonly<Record<string, string>> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', đ: 'd', ł: 'l', þ: 'th' };

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[øæœßđłþ]/g, (c) => TRANSLITERATE[c])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'untitled';
}

/**
 * Market URLs a release slug must never take: category pages, the seller path
 * and the static seed listings (`/market/{slug}` serves those first).
 */
const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  ...CATEGORY_KEYS,
  'u',
  ...MARKET_ITEMS.filter((item) => item.source === 'seed').map((item) => item.slug),
]);

function uniqueSlug(state: LifecycleState, title: string, exceptId: Id | null): string {
  const base = slugify(title);
  const taken = new Set([
    ...RESERVED_SLUGS,
    ...Object.values(state.releases).filter((r) => r.id !== exceptId).map((r) => r.slug),
  ]);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** The decision and its date for a case that restricted something (reject, suspend, remove). */
function restrictiveDecision(c: ReviewCase): { target: Appeal['target']; at: IsoDateTime } | null {
  const d = c.decision;
  if (!d) return null;
  if (d.outcome === 'rejected') return { target: 'rejection', at: d.at };
  if (d.outcome === 'suspended') return { target: 'suspension', at: d.at };
  if (d.outcome === 'removed') return { target: 'removal', at: d.at };
  return null;
}

/* ------------------------------------------------------------------ */
/* Shared effects                                                      */
/* ------------------------------------------------------------------ */

/** Starts the review of a queued case in the same update (§7.3: "Review started" before any decision). */
function autoStart(tx: Tx, reviewCase: ReviewCase, release: Release): ReviewCase {
  if (reviewCase.status !== 'queued' || tx.actor.kind !== 'reviewer') return reviewCase;
  const revision = reviewCase.revisionId ? tx.state.revisions[reviewCase.revisionId] : null;
  emit(tx, release.id, 'review_started', { revisionId: revision?.id ?? null, seq: revision?.seq ?? null, caseId: reviewCase.id });
  return patchCase(tx, reviewCase.id, { status: 'in_progress', assignedReviewerId: tx.actor.reviewerId });
}

function dismissOpenCases(tx: Tx, revision: Revision): void {
  for (const id of revision.caseIds) {
    const c = tx.state.cases[id];
    if (c && (c.status === 'queued' || c.status === 'in_progress')) patchCase(tx, id, { status: 'dismissed', decidedAt: tx.now });
  }
}

/** Approves a first revision (T14, T24a): version 1, live, maybe scheduled. */
function promoteFirst(tx: Tx, release: Release, revision: Revision): void {
  patchRevision(tx, revision.id, { status: 'approved', version: 1, decidedAt: tx.now });
  const goesPublicAt = goesPublicAtFor(revision, tx.now);
  patchRelease(tx, release.id, {
    status: 'live',
    currentRevisionId: revision.id,
    openRevisionId: null,
    firstLiveAt: tx.now,
    goesPublicAt,
  });
  emit(tx, release.id, goesPublicAt ? 'scheduled' : 'went_live', { revisionId: revision.id, version: 1, seq: revision.seq });
}

/** Approves an update (T15, T24b): the next version swaps in, the old one is superseded. */
function promoteUpdate(tx: Tx, release: Release, revision: Revision): void {
  const current = currentOf(tx.state, release);
  const version = (current?.version ?? 0) + 1;
  if (current) patchRevision(tx, current.id, { supersededAt: tx.now });
  patchRevision(tx, revision.id, { status: 'approved', version, decidedAt: tx.now });

  let goesPublicAt = release.goesPublicAt;
  const stillScheduled = goesPublicAt !== null && Date.parse(goesPublicAt) > Date.parse(tx.now);
  const dateChanged =
    current?.payload.kind === 'song' &&
    revision.payload.kind === 'song' &&
    current.payload.releaseDate !== revision.payload.releaseDate;
  if (release.status === 'live' && stillScheduled && dateChanged) goesPublicAt = goesPublicAtFor(revision, tx.now);

  patchRelease(tx, release.id, { currentRevisionId: revision.id, openRevisionId: null, goesPublicAt });
  emit(tx, release.id, release.status === 'live' ? 'update_went_live' : 'update_approved', {
    revisionId: revision.id,
    version,
    seq: revision.seq,
  });
}

/* ------------------------------------------------------------------ */
/* Seller actions                                                      */
/* ------------------------------------------------------------------ */

type ActionOf<T extends LifecycleActionType> = Extract<LifecycleAction, { type: T }>;

/** Resolves the release of a seller action; other sellers' releases are invisible (§4.6). */
function sellerRelease(state: LifecycleState, actor: Actor, releaseId: Id): Release | LifecycleErrorCode {
  const release = state.releases[releaseId];
  if (!release) return 'not_found';
  if (actor.kind === 'seller' && release.sellerId !== actor.userId) return 'not_found';
  return release;
}

function createRelease(state: LifecycleState, a: ActionOf<'create_release'>, actor: Actor, now: IsoDateTime): ApplyResult {
  if (!actorMayTake('create_release', actor.kind) || actor.kind !== 'seller') return fail('not_allowed_for_actor');
  if (!RELEASE_TYPE_INFO[a.releaseType].sellerCanPublish) return fail('type_not_publishable');
  if (a.payload.kind !== a.releaseType || !a.source) return fail('validation_failed');
  const rule = matchRule('create_release', actor.kind, 'first', 'none', 'none');
  if (typeof rule === 'string') return fail(rule);

  const tx = begin(state, actor, now);
  const releaseId = `rel-${Object.keys(state.revisions).length + 1}`;
  const revisionId = `${releaseId}-rev1`;
  const handle = Object.values(state.releases).find((r) => r.sellerId === actor.userId)?.sellerHandle ?? actor.userId;
  tx.state.revisions[revisionId] = {
    id: revisionId,
    releaseId,
    seq: 1,
    version: null,
    baseVersion: null,
    status: 'draft',
    payload: a.payload,
    changes: null,
    changeNote: null,
    replyToReviewer: null,
    evidence: null,
    attestation: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    decidedAt: null,
    supersededAt: null,
    caseIds: [],
  };
  tx.state.releases[releaseId] = {
    id: releaseId,
    type: a.releaseType,
    slug: uniqueSlug(state, a.payload.title, null),
    sellerId: actor.userId,
    sellerHandle: handle,
    channels: [...RELEASE_TYPE_INFO[a.releaseType].surfaces],
    status: 'draft',
    goesPublicAt: null,
    unpublished: null,
    suspension: null,
    currentRevisionId: null,
    openRevisionId: revisionId,
    revisionIds: [revisionId],
    source: a.source,
    createdAt: now,
    updatedAt: now,
    firstLiveAt: null,
  };
  emit(tx, releaseId, 'release_created', { revisionId, seq: 1 });
  return commit(tx);
}

function saveDraft(state: LifecycleState, a: ActionOf<'save_draft'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const open = openOf(state, release);
  const rule = matchRule('save_draft', actor.kind, scopeOf(release), release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!open || a.payload.kind !== release.type) return fail('invalid_state');

  const tx = begin(state, actor, now);
  const current = currentOf(state, release);
  patchRevision(tx, open.id, {
    payload: a.payload,
    updatedAt: now,
    ...(current
      ? { changes: diffRevision(current.payload, a.payload), changeNote: a.changeNote ?? open.changeNote }
      : {}),
  });
  patchRelease(tx, release.id, current ? {} : { slug: uniqueSlug(state, a.payload.title, release.id) });

  // "Coalesced": one draft_saved per editing session, not one per keystroke.
  const last = [...state.events].reverse().find((e) => e.releaseId === release.id);
  if (!(last && last.type === 'draft_saved' && last.revisionId === open.id)) {
    emit(tx, release.id, 'draft_saved', { revisionId: open.id, seq: open.seq });
  }
  return commit(tx);
}

function submit(state: LifecycleState, a: ActionOf<'submit'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const scope = scopeOf(release);
  if (scope === 'update' && release.status === 'suspended') return fail('release_suspended');
  const open = openOf(state, release);
  const rule = matchRule('submit', actor.kind, scope, release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!open) return fail('invalid_state');

  const current = currentOf(state, release);
  const changes = current ? diffRevision(current.payload, open.payload) : null;
  if (changes && changes.kinds.length === 0) return fail('nothing_changed');
  const issues = validateSubmission(open.payload, {
    now,
    attestation: a.attestation,
    evidence: a.evidence,
    update: changes ? { changeNote: open.changeNote, hasChanges: true } : undefined,
    releaseDateLocked: isPublic(release, now),
  });
  if (issues.length > 0) return fail('validation_failed', issues);

  const tx = begin(state, actor, now);
  const reviewCase = newCase(tx, {
    releaseId: release.id,
    revisionId: open.id,
    kind: changes ? 'update' : 'new_release',
    priority: 50,
    depth: changes ? changes.reviewDepth : RELEASE_TYPE_INFO[release.type].firstReviewDepth,
  });
  patchRevision(tx, open.id, {
    status: 'in_review',
    submittedAt: now,
    attestation: { ...a.attestation, acceptedAt: now },
    evidence: a.evidence,
    changes,
    caseIds: [...open.caseIds, reviewCase.id],
  });
  if (scope === 'first') patchRelease(tx, release.id, { status: 'in_review' });
  else patchRelease(tx, release.id, {});
  emit(tx, release.id, 'submitted', { revisionId: open.id, seq: open.seq, caseId: reviewCase.id });
  return commit(tx);
}

function pullBack(state: LifecycleState, a: ActionOf<'pull_back'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const scope = scopeOf(release);
  const open = openOf(state, release);
  const rule = matchRule('pull_back', actor.kind, scope, release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!open) return fail('invalid_state');
  const reviewCase = latestCase(state, open);
  if (!reviewCase || reviewCase.status !== 'queued') return fail('review_already_started');

  const tx = begin(state, actor, now);
  patchCase(tx, reviewCase.id, { status: 'dismissed', decidedAt: now });
  patchRevision(tx, open.id, { status: 'draft' });
  patchRelease(tx, release.id, scope === 'first' ? { status: 'draft' } : {});
  emit(tx, release.id, 'pulled_back', { revisionId: open.id, seq: open.seq, caseId: reviewCase.id });
  return commit(tx);
}

function resubmit(state: LifecycleState, a: ActionOf<'resubmit'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const scope = scopeOf(release);
  if (scope === 'update' && release.status === 'suspended') return fail('release_suspended');
  const open = openOf(state, release);
  const rule = matchRule('resubmit', actor.kind, scope, release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!open) return fail('invalid_state');

  const requested = latestCase(state, open);
  const reply = a.replyToReviewer?.trim() || null;
  const changedSince = requested?.decidedAt ? Date.parse(open.updatedAt) > Date.parse(requested.decidedAt) : true;
  if (!changedSince && !reply) return fail('nothing_changed');

  const current = currentOf(state, release);
  const changes = current ? diffRevision(current.payload, open.payload) : null;
  if (changes && changes.kinds.length === 0) return fail('nothing_changed');
  const issues = validateSubmission(open.payload, {
    now,
    attestation: open.attestation,
    evidence: open.evidence,
    update: changes ? { changeNote: open.changeNote, hasChanges: true } : undefined,
    releaseDateLocked: isPublic(release, now),
  });
  if (issues.length > 0) return fail('validation_failed', issues);

  const tx = begin(state, actor, now);
  const reviewCase = newCase(tx, {
    releaseId: release.id,
    revisionId: open.id,
    kind: changes ? 'update' : 'new_release',
    priority: 50,
    depth: changes ? changes.reviewDepth : RELEASE_TYPE_INFO[release.type].firstReviewDepth,
  });
  patchRevision(tx, open.id, {
    status: 'in_review',
    submittedAt: now,
    replyToReviewer: reply,
    changes,
    caseIds: [...open.caseIds, reviewCase.id],
  });
  patchRelease(tx, release.id, scope === 'first' ? { status: 'in_review' } : {});
  emit(tx, release.id, 'resubmitted', { revisionId: open.id, seq: open.seq, caseId: reviewCase.id, note: reply ?? undefined });
  return commit(tx);
}

function startUpdate(state: LifecycleState, a: ActionOf<'start_update'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  if (!actorMayTake('start_update', actor.kind)) return fail('not_allowed_for_actor');
  if (scopeOf(release) === 'first') return fail('invalid_state');
  if (release.status === 'suspended') return fail('release_suspended');
  if (release.openRevisionId) return fail('open_revision_exists');
  if (release.unpublished && (release.unpublished.by === 'platform' || (release.unpublished.by === 'system' && release.unpublished.cause !== 'storage_over_quota'))) {
    return fail('invalid_state');
  }
  const rule = matchRule('start_update', actor.kind, scopeOf(release), release.status, 'none');
  if (typeof rule === 'string') return fail(rule);
  const current = currentOf(state, release);
  if (!current) return fail('invalid_state');

  const tx = begin(state, actor, now);
  const seq = Math.max(...revisionsOf(state, release).map((r) => r.seq)) + 1;
  const id = `${release.id}-rev${seq}`;
  tx.state.revisions[id] = {
    id,
    releaseId: release.id,
    seq,
    version: null,
    baseVersion: current.version,
    status: 'draft',
    payload: JSON.parse(JSON.stringify(current.payload)),
    changes: emptyChangeSummary(),
    changeNote: null,
    replyToReviewer: null,
    evidence: null,
    attestation: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    decidedAt: null,
    supersededAt: null,
    caseIds: [],
  };
  patchRelease(tx, release.id, { openRevisionId: id, revisionIds: [...release.revisionIds, id] });
  emit(tx, release.id, 'update_started', { revisionId: id, seq });
  return commit(tx);
}

function discardUpdate(state: LifecycleState, a: ActionOf<'discard_update'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const open = openOf(state, release);
  const rule = matchRule('discard_update', actor.kind, scopeOf(release), release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!open) return fail('invalid_state');

  const tx = begin(state, actor, now);
  dismissOpenCases(tx, open);
  patchRevision(tx, open.id, { status: 'withdrawn' });
  patchRelease(tx, release.id, { openRevisionId: null });
  emit(tx, release.id, 'update_discarded', { revisionId: open.id, seq: open.seq });
  return commit(tx);
}

function deleteRelease(state: LifecycleState, a: ActionOf<'delete_release'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const subject = subjectOf(state, release);
  const rule = matchRule('delete_release', actor.kind, scopeOf(release), release.status, subject?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (Object.values(state.appeals).some((ap) => ap.releaseId === release.id && ap.status === 'open')) return fail('invalid_state');

  const tx = begin(state, actor, now);
  for (const revision of revisionsOf(state, release)) {
    dismissOpenCases(tx, revision);
    if (revision.status !== 'withdrawn' && revision.status !== 'approved') patchRevision(tx, revision.id, { status: 'withdrawn' });
  }
  emit(tx, release.id, 'deleted', { revisionId: subject?.id ?? null, seq: subject?.seq ?? null });
  delete tx.state.releases[release.id];
  return commit(tx);
}

function unpublish(state: LifecycleState, a: ActionOf<'unpublish'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const open = openOf(state, release);
  const rule = matchRule('unpublish', actor.kind, scopeOf(release), release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);

  const tx = begin(state, actor, now);
  // Unpublishing a scheduled release cancels its date, so a later relist is public at once.
  patchRelease(tx, release.id, {
    status: 'unpublished',
    unpublished: { by: 'seller', cause: null, at: now, caseId: null },
    goesPublicAt: null,
  });
  emit(tx, release.id, 'unpublished', { version: currentOf(state, release)?.version ?? null });
  return commit(tx);
}

function relist(state: LifecycleState, a: ActionOf<'relist'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  const open = openOf(state, release);
  const rule = matchRule('relist', actor.kind, scopeOf(release), release.status, open?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  const by = release.unpublished;
  if (!by || by.by === 'platform' || (by.by === 'system' && by.cause !== 'storage_over_quota')) return fail('not_relistable');

  const tx = begin(state, actor, now);
  patchRelease(tx, release.id, { status: 'live', unpublished: null });
  emit(tx, release.id, 'relisted', { version: currentOf(state, release)?.version ?? null });
  return commit(tx);
}

export const APPEAL_MESSAGE_MIN = 20;

function fileAppeal(state: LifecycleState, a: ActionOf<'file_appeal'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = sellerRelease(state, actor, a.releaseId);
  if (typeof release === 'string') return fail(release);
  if (!actorMayTake('file_appeal', actor.kind)) return fail('not_allowed_for_actor');
  const decided = state.cases[a.appealedCaseId];
  if (!decided || decided.releaseId !== release.id) return fail('not_found');
  const decision = restrictiveDecision(decided);
  if (!decision) return fail('invalid_state');

  let subject: RevisionStatus | 'none' = 'none';
  let revision: Revision | null = null;
  if (decision.target === 'rejection') {
    revision = decided.revisionId ? state.revisions[decided.revisionId] ?? null : null;
    if (!revision || revision.status !== 'rejected') return fail('invalid_state');
    subject = 'rejected';
  } else if (decision.target === 'suspension') {
    if (release.status !== 'suspended' || release.suspension?.caseId !== decided.id) return fail('invalid_state');
  } else if (release.unpublished?.by !== 'platform' || release.unpublished.caseId !== decided.id) {
    return fail('invalid_state');
  }

  if (Object.values(state.appeals).some((ap) => ap.appealedCaseId === decided.id)) return fail('appeal_exists');
  // One open appeal per release: Studio shows one appeal at a time (`openAppeal`).
  if (openAppealOn(state, release.id)) return fail('appeal_exists');
  if (Date.parse(now) > Date.parse(addDays(decision.at, APPEAL_WINDOW_DAYS))) return fail('appeal_window_closed');
  if (decision.target === 'rejection' && release.currentRevisionId !== null && release.openRevisionId !== null) {
    return fail('open_revision_exists');
  }
  if (a.message.trim().length < APPEAL_MESSAGE_MIN) return fail('validation_failed');
  const rule = matchRule('file_appeal', actor.kind, scopeOf(release), release.status, subject);
  if (typeof rule === 'string') return fail(rule);

  const tx = begin(state, actor, now);
  const appealCase = newCase(tx, {
    releaseId: release.id,
    revisionId: decided.revisionId,
    kind: 'appeal',
    priority: 40,
    depth: decided.depth,
    appealOfCaseId: decided.id,
  });
  const appealId = `ap-${Object.keys(state.appeals).length + 1}`;
  tx.state.appeals[appealId] = {
    id: appealId,
    releaseId: release.id,
    revisionId: decided.revisionId,
    target: decision.target,
    appealedCaseId: decided.id,
    appealCaseId: appealCase.id,
    message: a.message.trim(),
    status: 'open',
    filedAt: now,
    decidedAt: null,
  };
  if (revision) {
    patchRevision(tx, revision.id, { caseIds: [...revision.caseIds, appealCase.id] });
    patchRelease(tx, release.id, { openRevisionId: revision.id });
  } else {
    patchRelease(tx, release.id, {});
  }
  emit(tx, release.id, 'appeal_filed', {
    revisionId: revision?.id ?? null,
    seq: revision?.seq ?? null,
    caseId: appealCase.id,
    appealId,
    note: a.message.trim(),
  });
  return commit(tx);
}

/* ------------------------------------------------------------------ */
/* Reviewer and system actions on a case                               */
/* ------------------------------------------------------------------ */

interface CaseContext {
  reviewCase: ReviewCase;
  release: Release;
  revision: Revision | null;
}

function caseContext(state: LifecycleState, caseId: Id): CaseContext | LifecycleErrorCode {
  const reviewCase = state.cases[caseId];
  if (!reviewCase) return 'not_found';
  const release = state.releases[reviewCase.releaseId];
  if (!release) return 'not_found';
  const revision = reviewCase.revisionId ? state.revisions[reviewCase.revisionId] ?? null : null;
  return { reviewCase, release, revision };
}

/** L19: review of new releases and updates pauses while the release is on hold. */
function pausedBySuspension(ctx: CaseContext): boolean {
  return ctx.release.status === 'suspended' && (ctx.reviewCase.kind === 'new_release' || ctx.reviewCase.kind === 'update');
}

function isOpenCase(c: ReviewCase): boolean {
  return c.status === 'queued' || c.status === 'in_progress';
}

function startReview(state: LifecycleState, a: ActionOf<'start_review'>, actor: Actor, now: IsoDateTime): ApplyResult {
  if (!actorMayTake('start_review', actor.kind)) return fail('not_allowed_for_actor');
  const ctx = caseContext(state, a.caseId);
  if (typeof ctx === 'string') return fail(ctx);
  if (pausedBySuspension(ctx)) return fail('release_suspended');
  const rule = matchRule('start_review', actor.kind, scopeOf(ctx.release), ctx.release.status, ctx.revision?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (ctx.reviewCase.status === 'in_progress') return fail('review_already_started');
  if (ctx.reviewCase.status !== 'queued') return fail('invalid_state');

  const tx = begin(state, actor, now);
  autoStart(tx, ctx.reviewCase, ctx.release);
  return commit(tx);
}

/** Approve, request changes and reject act on the open review case of a new release or update. */
function decisionContext(state: LifecycleState, caseId: Id, actor: Actor, action: 'approve' | 'request_changes' | 'reject'): CaseContext | LifecycleErrorCode {
  if (!actorMayTake(action, actor.kind)) return 'not_allowed_for_actor';
  const ctx = caseContext(state, caseId);
  if (typeof ctx === 'string') return ctx;
  if (ctx.reviewCase.kind !== 'new_release' && ctx.reviewCase.kind !== 'update') return 'invalid_state';
  if (pausedBySuspension(ctx)) return 'release_suspended';
  const rule = matchRule(action, actor.kind, scopeOf(ctx.release), ctx.release.status, ctx.revision?.status ?? 'none');
  if (typeof rule === 'string') return rule;
  if (!isOpenCase(ctx.reviewCase) || !ctx.revision) return 'invalid_state';
  return ctx;
}

function approve(state: LifecycleState, a: ActionOf<'approve'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const ctx = decisionContext(state, a.caseId, actor, 'approve');
  if (typeof ctx === 'string') return fail(ctx);
  if (reviewerId(actor) === ctx.release.sellerId) return fail('not_allowed_for_actor');
  const revision = ctx.revision as Revision;

  const tx = begin(state, actor, now);
  autoStart(tx, ctx.reviewCase, ctx.release);
  patchCase(tx, ctx.reviewCase.id, {
    status: 'decided',
    decision: { outcome: 'approved', at: now, note: a.note },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  if (scopeOf(ctx.release) === 'first') promoteFirst(tx, ctx.release, revision);
  else promoteUpdate(tx, ctx.release, revision);
  return commit(tx);
}

function requestChanges(state: LifecycleState, a: ActionOf<'request_changes'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const ctx = decisionContext(state, a.caseId, actor, 'request_changes');
  if (typeof ctx === 'string') return fail(ctx);
  if (a.reasons.length === 0 || a.reasons.some((r) => !r.message.trim())) return fail('validation_failed');
  const revision = ctx.revision as Revision;

  const tx = begin(state, actor, now);
  autoStart(tx, ctx.reviewCase, ctx.release);
  patchCase(tx, ctx.reviewCase.id, {
    status: 'decided',
    decision: { outcome: 'changes_requested', at: now, reasons: a.reasons, note: a.note },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  patchRevision(tx, revision.id, { status: 'changes_requested', decidedAt: now });
  patchRelease(tx, ctx.release.id, scopeOf(ctx.release) === 'first' ? { status: 'changes_requested' } : {});
  emit(tx, ctx.release.id, 'changes_requested', {
    revisionId: revision.id,
    seq: revision.seq,
    caseId: ctx.reviewCase.id,
    reasons: a.reasons,
    note: a.note,
  });
  return commit(tx);
}

function reject(state: LifecycleState, a: ActionOf<'reject'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const ctx = decisionContext(state, a.caseId, actor, 'reject');
  if (typeof ctx === 'string') return fail(ctx);
  if (!statementComplete(a.statement)) return fail('validation_failed');
  const revision = ctx.revision as Revision;
  const first = scopeOf(ctx.release) === 'first';

  const tx = begin(state, actor, now);
  autoStart(tx, ctx.reviewCase, ctx.release);
  patchCase(tx, ctx.reviewCase.id, {
    status: 'decided',
    decision: { outcome: 'rejected', at: now, statement: a.statement },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  patchRevision(tx, revision.id, { status: 'rejected', decidedAt: now });
  // A rejected update frees the slot; the live version is untouched (L4).
  patchRelease(tx, ctx.release.id, first ? { status: 'rejected', openRevisionId: null } : { openRevisionId: null });
  emit(tx, ctx.release.id, 'rejected', {
    revisionId: revision.id,
    seq: revision.seq,
    caseId: ctx.reviewCase.id,
    statement: a.statement,
  });
  return commit(tx);
}

function autoChecks(state: LifecycleState, a: ActionOf<'auto_checks_completed'>, actor: Actor, now: IsoDateTime): ApplyResult {
  if (!actorMayTake('auto_checks_completed', actor.kind)) return fail('not_allowed_for_actor');
  const ctx = caseContext(state, a.caseId);
  if (typeof ctx === 'string') return fail(ctx);
  if (pausedBySuspension(ctx)) return fail('release_suspended');
  const rule = matchRule('auto_checks_completed', actor.kind, scopeOf(ctx.release), ctx.release.status, ctx.revision?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!isOpenCase(ctx.reviewCase)) return fail('invalid_state');

  // Flags only raise priority (§4.8): duplicate 10, closer listen 20. People decide.
  let priority = ctx.reviewCase.priority;
  if (a.checks.some((c) => c.id === 'duplicate_sha256' && c.result === 'flag')) priority = Math.min(priority, 10);
  if (a.checks.some((c) => c.id === 'human_made_triage' && c.result === 'flag')) priority = Math.min(priority, 20);

  const tx = begin(state, actor, now);
  patchCase(tx, ctx.reviewCase.id, { checks: a.checks, priority });
  emit(tx, ctx.release.id, 'auto_checks_completed', {
    revisionId: ctx.revision?.id ?? null,
    seq: ctx.revision?.seq ?? null,
    caseId: ctx.reviewCase.id,
  });
  return commit(tx);
}

function publishFailed(state: LifecycleState, a: ActionOf<'publish_failed'>, actor: Actor, now: IsoDateTime): ApplyResult {
  if (!actorMayTake('publish_failed', actor.kind)) return fail('not_allowed_for_actor');
  const ctx = caseContext(state, a.caseId);
  if (typeof ctx === 'string') return fail(ctx);
  if (pausedBySuspension(ctx)) return fail('release_suspended');
  const rule = matchRule('publish_failed', actor.kind, scopeOf(ctx.release), ctx.release.status, ctx.revision?.status ?? 'none');
  if (typeof rule === 'string') return fail(rule);
  if (!isOpenCase(ctx.reviewCase)) return fail('invalid_state');

  const tx = begin(state, actor, now);
  patchCase(tx, ctx.reviewCase.id, { status: 'in_progress' });
  emit(tx, ctx.release.id, 'publish_failed', { revisionId: ctx.revision?.id ?? null, seq: ctx.revision?.seq ?? null, caseId: ctx.reviewCase.id, note: a.detail });
  return commit(tx);
}

/* ------------------------------------------------------------------ */
/* Reviewer and system actions on a release                            */
/* ------------------------------------------------------------------ */

function releaseRule(state: LifecycleState, release: Release, action: LifecycleActionType, actor: Actor): TransitionRule | LifecycleErrorCode {
  const subject = subjectOf(state, release);
  return matchRule(action, actor.kind, scopeOf(release), release.status, subject?.status ?? 'none');
}

function suspend(state: LifecycleState, a: ActionOf<'suspend'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = state.releases[a.releaseId];
  if (!release) return fail('not_found');
  const rule = releaseRule(state, release, 'suspend', actor);
  if (typeof rule === 'string') return fail(rule);
  if (!statementComplete(a.statement)) return fail('validation_failed');

  const tx = begin(state, actor, now);
  const reviewCase = newCase(tx, {
    releaseId: release.id,
    revisionId: null,
    kind: 'report',
    priority: 30,
    depth: 'standard',
    status: 'decided',
    assignedReviewerId: reviewerId(actor),
    decision: { outcome: 'suspended', at: now, statement: a.statement },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  patchRelease(tx, release.id, {
    status: 'suspended',
    suspension: {
      at: now,
      caseId: reviewCase.id,
      restoreTo: release.status === 'unpublished' ? 'unpublished' : 'live',
      downloadsDisabled: a.disableDownloads,
    },
  });
  emit(tx, release.id, 'suspended', { caseId: reviewCase.id, statement: a.statement });
  return commit(tx);
}

function reinstate(state: LifecycleState, a: ActionOf<'reinstate'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = state.releases[a.releaseId];
  if (!release) return fail('not_found');
  const rule = releaseRule(state, release, 'reinstate', actor);
  if (typeof rule === 'string') return fail(rule);

  const tx = begin(state, actor, now);
  // Lifting the hold gives an open appeal against it what it asked for, so the
  // appeal is settled as overturned and its review case closes as moot.
  const suspensionCaseId = release.suspension?.caseId;
  for (const appeal of Object.values(state.appeals)) {
    if (appeal.status !== 'open' || appeal.target !== 'suspension' || appeal.appealedCaseId !== suspensionCaseId) continue;
    tx.state.appeals[appeal.id] = { ...appeal, status: 'overturned', decidedAt: now };
    if (tx.state.cases[appeal.appealCaseId]) patchCase(tx, appeal.appealCaseId, { status: 'dismissed', decidedAt: now });
  }
  patchRelease(tx, release.id, { status: release.suspension?.restoreTo ?? 'live', suspension: null });
  emit(tx, release.id, 'reinstated', { caseId: suspensionCaseId, note: a.note });
  return commit(tx);
}

function openAppealOn(state: LifecycleState, releaseId: Id): Appeal | null {
  return Object.values(state.appeals).find((ap) => ap.releaseId === releaseId && ap.status === 'open') ?? null;
}

function remove(state: LifecycleState, a: ActionOf<'remove'>, actor: Actor, now: IsoDateTime): ApplyResult {
  const release = state.releases[a.releaseId];
  if (!release) return fail('not_found');
  const rule = releaseRule(state, release, 'remove', actor);
  if (typeof rule === 'string') return fail(rule);
  // A removal would replace the decision an open appeal is about (or withdraw the
  // appealed update), so the appeal is decided first.
  if (openAppealOn(state, release.id)) return fail('invalid_state');
  if (!statementComplete(a.statement)) return fail('validation_failed');

  const tx = begin(state, actor, now);
  const open = openOf(state, release);
  if (open) {
    dismissOpenCases(tx, open);
    patchRevision(tx, open.id, { status: 'withdrawn' });
  }
  const reviewCase = newCase(tx, {
    releaseId: release.id,
    revisionId: null,
    kind: 'report',
    priority: 30,
    depth: 'standard',
    status: 'decided',
    assignedReviewerId: reviewerId(actor),
    decision: { outcome: 'removed', at: now, statement: a.statement },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  patchRelease(tx, release.id, {
    status: 'unpublished',
    unpublished: { by: 'platform', cause: null, at: now, caseId: reviewCase.id },
    suspension: null,
    openRevisionId: null,
    goesPublicAt: null,
  });
  emit(tx, release.id, 'removed', { caseId: reviewCase.id, statement: a.statement });
  return commit(tx);
}

function decideAppeal(state: LifecycleState, a: ActionOf<'decide_appeal'>, actor: Actor, now: IsoDateTime): ApplyResult {
  if (!actorMayTake('decide_appeal', actor.kind)) return fail('not_allowed_for_actor');
  const appeal = state.appeals[a.appealId];
  if (!appeal) return fail('not_found');
  const release = state.releases[appeal.releaseId];
  if (!release) return fail('not_found');
  if (appeal.status !== 'open') return fail('invalid_state');
  const appealed = state.cases[appeal.appealedCaseId];
  if (appealed?.decidedBy && reviewerId(actor) === appealed.decidedBy) return fail('same_reviewer');

  const revision = appeal.revisionId ? state.revisions[appeal.revisionId] ?? null : null;
  // An update rejection's appeal waits while the release is on hold (T18: review
  // of the open revision pauses until T19 or T24c decides the hold).
  if (appeal.target === 'rejection' && release.status === 'suspended') return fail('release_suspended');
  // §4.6: the rule follows the appeal's target and scope, never whichever rule the
  // current state happens to match. A suspension or removal appeal is decided only
  // while that same restriction is still in place.
  if (appeal.target === 'suspension' && (release.status !== 'suspended' || release.suspension?.caseId !== appeal.appealedCaseId)) {
    return fail('invalid_state');
  }
  if (appeal.target === 'removal' && (release.unpublished?.by !== 'platform' || release.unpublished.caseId !== appeal.appealedCaseId)) {
    return fail('invalid_state');
  }
  const overturnRule = { rejection: scopeOf(release) === 'first' ? 'T24a' : 'T24b', suspension: 'T24c', removal: 'T24d' }[appeal.target];
  const ids = a.outcome === 'upheld' ? ['T23'] : [overturnRule];
  const rule = matchRule('decide_appeal', actor.kind, scopeOf(release), release.status, revision?.status ?? 'none', ids);
  if (typeof rule === 'string') return fail(rule);
  if (a.outcome === 'upheld' && !statementComplete(a.statement)) return fail('validation_failed');

  const tx = begin(state, actor, now);
  tx.state.appeals[appeal.id] = { ...appeal, status: a.outcome, decidedAt: now };
  patchCase(tx, appeal.appealCaseId, {
    status: 'decided',
    assignedReviewerId: reviewerId(actor),
    decision:
      a.outcome === 'upheld'
        ? { outcome: 'appeal_upheld', at: now, statement: a.statement as StatementOfReasons }
        : { outcome: 'appeal_overturned', at: now, note: a.note },
    decidedBy: reviewerId(actor),
    decidedAt: now,
  });
  const eventBase = { revisionId: revision?.id ?? null, seq: revision?.seq ?? null, caseId: appeal.appealCaseId, appealId: appeal.id };

  if (a.outcome === 'upheld') {
    // The appealed rejection stops occupying the slot (L1).
    patchRelease(tx, release.id, release.openRevisionId === revision?.id ? { openRevisionId: null } : {});
    emit(tx, release.id, 'appeal_upheld', { ...eventBase, statement: a.statement });
    return commit(tx);
  }

  emit(tx, release.id, 'appeal_overturned', { ...eventBase, note: a.note });
  const fresh = tx.state.releases[release.id];
  switch (rule.id) {
    case 'T24a':
      promoteFirst(tx, fresh, revision as Revision);
      break;
    case 'T24b': {
      const current = currentOf(tx.state, fresh);
      const target = revision as Revision;
      if (target.baseVersion === current?.version) {
        promoteUpdate(tx, fresh, target);
        break;
      }
      // Stale update (T24): promoting it would undo a newer version. The decision is
      // reversed on record and its changes come back as a new update draft.
      const freed = patchRelease(tx, fresh.id, { openRevisionId: null });
      const seq = Math.max(...revisionsOf(tx.state, freed).map((r) => r.seq)) + 1;
      const id = `${fresh.id}-rev${seq}`;
      const payload = JSON.parse(JSON.stringify(target.payload));
      tx.state.revisions[id] = {
        ...target,
        id,
        seq,
        version: null,
        baseVersion: current?.version ?? null,
        status: 'draft',
        payload,
        changes: current ? diffRevision(current.payload, payload) : null,
        replyToReviewer: null,
        attestation: null,
        createdAt: now,
        updatedAt: now,
        submittedAt: null,
        decidedAt: null,
        supersededAt: null,
        caseIds: [],
      };
      patchRelease(tx, fresh.id, { openRevisionId: id, revisionIds: [...freed.revisionIds, id] });
      const systemProcess: SystemProcess = isSimulatedActor(actor) ? 'demo_simulator' : 'publisher';
      const previous = tx.actor;
      tx.actor = { kind: 'system', process: systemProcess };
      emit(tx, fresh.id, 'update_started', { revisionId: id, seq });
      tx.actor = previous;
      break;
    }
    case 'T24c':
      patchRelease(tx, fresh.id, { status: fresh.suspension?.restoreTo ?? 'live', suspension: null });
      emit(tx, fresh.id, 'reinstated', { caseId: appeal.appealCaseId });
      break;
    case 'T24d':
      patchRelease(tx, fresh.id, { status: 'live', unpublished: null });
      break;
  }
  return commit(tx);
}

function systemUnpublish(
  state: LifecycleState,
  releaseId: Id,
  actor: Actor,
  now: IsoDateTime,
  action: 'quota_unpublish' | 'exclusive_sold' | 'account_closed',
): ApplyResult {
  if (!actorMayTake(action, actor.kind)) return fail('not_allowed_for_actor');
  const release = state.releases[releaseId];
  if (!release) return fail('not_found');
  const rule = releaseRule(state, release, action, actor);
  if (typeof rule === 'string') return fail(rule);
  const current = currentOf(state, release);
  if (action === 'exclusive_sold') {
    const exclusiveOn = current?.payload.kind === 'beat' && current.payload.tiers.some((t) => t.tier === 'exclusive' && t.enabled);
    if (!exclusiveOn) return fail('invalid_state');
  }

  const tx = begin(state, actor, now);
  const open = subjectOf(state, release);
  if (rule.revision.to === 'withdrawn' && open && open.status !== 'approved') {
    dismissOpenCases(tx, open);
    patchRevision(tx, open.id, { status: 'withdrawn' });
  }
  if (rule.release.to === 'deleted') {
    emit(tx, release.id, 'deleted');
    delete tx.state.releases[release.id];
    return commit(tx);
  }
  const cause = action === 'quota_unpublish' ? 'storage_over_quota' : action;
  patchRelease(tx, release.id, {
    status: 'unpublished',
    unpublished: { by: 'system', cause, at: now, caseId: null },
    goesPublicAt: null,
    suspension: null,
    ...(rule.revision.to === 'withdrawn' ? { openRevisionId: null } : {}),
  });
  // The cause rides on the event so the timeline can say "storage limit" or "account closed" (§9.5).
  emit(tx, release.id, action === 'exclusive_sold' ? 'exclusive_sold' : 'unpublished', {
    version: current?.version ?? null,
    ...(action === 'exclusive_sold' ? {} : { note: cause }),
  });
  return commit(tx);
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export const applyAction: ApplyAction = (state, action, actor, now) => {
  switch (action.type) {
    case 'create_release':
      return createRelease(state, action, actor, now);
    case 'save_draft':
      return saveDraft(state, action, actor, now);
    case 'submit':
      return submit(state, action, actor, now);
    case 'pull_back':
      return pullBack(state, action, actor, now);
    case 'resubmit':
      return resubmit(state, action, actor, now);
    case 'start_update':
      return startUpdate(state, action, actor, now);
    case 'discard_update':
      return discardUpdate(state, action, actor, now);
    case 'delete_release':
      return deleteRelease(state, action, actor, now);
    case 'unpublish':
      return unpublish(state, action, actor, now);
    case 'relist':
      return relist(state, action, actor, now);
    case 'file_appeal':
      return fileAppeal(state, action, actor, now);
    case 'start_review':
      return startReview(state, action, actor, now);
    case 'approve':
      return approve(state, action, actor, now);
    case 'request_changes':
      return requestChanges(state, action, actor, now);
    case 'reject':
      return reject(state, action, actor, now);
    case 'suspend':
      return suspend(state, action, actor, now);
    case 'reinstate':
      return reinstate(state, action, actor, now);
    case 'remove':
      return remove(state, action, actor, now);
    case 'decide_appeal':
      return decideAppeal(state, action, actor, now);
    case 'auto_checks_completed':
      return autoChecks(state, action, actor, now);
    case 'publish_failed':
      return publishFailed(state, action, actor, now);
    case 'quota_unpublish':
      return systemUnpublish(state, action.releaseId, actor, now, 'quota_unpublish');
    case 'exclusive_sold':
      return systemUnpublish(state, action.releaseId, actor, now, 'exclusive_sold');
    case 'account_closed':
      return systemUnpublish(state, action.releaseId, actor, now, 'account_closed');
  }
};
