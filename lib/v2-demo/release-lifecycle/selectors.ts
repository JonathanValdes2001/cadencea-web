/**
 * Read-only views of the lifecycle state for Studio, Publish and the Market
 * (RELEASE-LIFECYCLE §6, §8.1). Pure, so the seed test and the server render
 * use the same answers as the browser. Every date check takes `now`, which is
 * the demo clock (§7.2), never the machine's clock.
 */
import type {
  Appeal,
  IsoDateTime,
  LifecycleState,
  PrimaryChipId,
  Release,
  ReviewCase,
  ReviewEvent,
  Revision,
  SecondaryChipId,
  StatementOfReasons,
  StatusChips,
  StudioTab,
} from './types.ts';
import type { PublicReleaseListing, PublicReleaseView } from './public.ts';
import { APPEAL_WINDOW_DAYS, STUDIO_TABS, getStatusChips, inStudioTab, isPublic, pendingVersionNumber } from './types.ts';
import { CHIP_COPY, CHIP_LIVE_SONG_HINT, EVENT_COPY, VERSION_COPY } from './copy.ts';
import { ACTIVITY_LABEL, CHANNEL_LABEL, TIMELINE_UI, VERSION_ONLY } from './ui-copy.ts';
import { addDays } from '../clock.ts';
import { fill, formatDate, formatRelative } from '../format.ts';

export interface ReleaseView {
  release: Release;
  current: Revision | null;
  open: Revision | null;
  /** The newest revision by seq. */
  latest: Revision;
  /** The revision whose details the row shows: the open one, else the live one, else the latest. */
  shown: Revision;
  openAppeal: Appeal | null;
  chips: StatusChips;
}

export function revisionsOf(state: LifecycleState, release: Release): Revision[] {
  return release.revisionIds.map((id) => state.revisions[id]).filter(Boolean);
}

function openAppealOf(state: LifecycleState, releaseId: string): Appeal | null {
  return Object.values(state.appeals).find((a) => a.releaseId === releaseId && a.status === 'open') ?? null;
}

export function releaseView(state: LifecycleState, release: Release, now: IsoDateTime): ReleaseView {
  const revisions = revisionsOf(state, release);
  const current = release.currentRevisionId ? state.revisions[release.currentRevisionId] ?? null : null;
  const open = release.openRevisionId ? state.revisions[release.openRevisionId] ?? null : null;
  const latest = revisions.reduce((a, b) => (b.seq > a.seq ? b : a), revisions[0]);
  const openAppeal = openAppealOf(state, release.id);
  return {
    release,
    current,
    open,
    latest,
    shown: open ?? current ?? latest,
    openAppeal,
    chips: getStatusChips(release, open, openAppeal !== null, now),
  };
}

export function allViews(state: LifecycleState, now: IsoDateTime): ReleaseView[] {
  return Object.values(state.releases).map((r) => releaseView(state, r, now));
}

export function inTab(view: ReleaseView, tab: StudioTab): boolean {
  return inStudioTab(tab, view.release, view.open);
}

export function tabCounts(state: LifecycleState, now: IsoDateTime): Record<StudioTab, number> {
  const views = allViews(state, now);
  const counts = {} as Record<StudioTab, number>;
  for (const tab of STUDIO_TABS) counts[tab] = views.filter((v) => inTab(v, tab)).length;
  return counts;
}

/* ------------------------------------------------------------------ */
/* Decisions, reasons and appeals                                      */
/* ------------------------------------------------------------------ */

export interface AppealOption {
  caseId: string;
  target: Appeal['target'];
  /** Last day of the 6-month window. */
  until: IsoDateTime;
  /** Any appeal ever filed on this decision (one per decision). */
  appeal: Appeal | null;
  windowClosed: boolean;
  /** True for a rejected update (the "Appeal update decision" action). */
  isUpdate: boolean;
}

function decisionCaseOf(state: LifecycleState, revision: Revision, outcome: 'rejected' | 'changes_requested'): ReviewCase | null {
  for (let i = revision.caseIds.length - 1; i >= 0; i -= 1) {
    const c = state.cases[revision.caseIds[i]];
    if (c?.decision?.outcome === outcome) return c;
  }
  return null;
}

/**
 * The restrictive decision a seller could appeal right now: a first rejection,
 * a suspension, a removal, or the rejection of the latest update.
 */
export function appealOption(state: LifecycleState, view: ReleaseView, now: IsoDateTime): AppealOption | null {
  const { release, latest } = view;
  let reviewCase: ReviewCase | null = null;
  let isUpdate = false;
  if (release.status === 'rejected') {
    reviewCase = decisionCaseOf(state, latest, 'rejected');
  } else if (release.status === 'suspended' && release.suspension) {
    reviewCase = state.cases[release.suspension.caseId] ?? null;
  } else if (release.status === 'unpublished' && release.unpublished?.by === 'platform' && release.unpublished.caseId) {
    reviewCase = state.cases[release.unpublished.caseId] ?? null;
  } else if (release.currentRevisionId !== null && latest.status === 'rejected') {
    reviewCase = decisionCaseOf(state, latest, 'rejected');
    isUpdate = true;
  }
  const decision = reviewCase?.decision;
  if (!reviewCase || !decision) return null;
  const target = decision.outcome === 'rejected' ? 'rejection' : decision.outcome === 'suspended' ? 'suspension' : decision.outcome === 'removed' ? 'removal' : null;
  if (!target) return null;
  const until = addDays(decision.at, APPEAL_WINDOW_DAYS);
  return {
    caseId: reviewCase.id,
    target,
    until,
    appeal: Object.values(state.appeals).find((a) => a.appealedCaseId === reviewCase.id) ?? null,
    windowClosed: Date.parse(now) > Date.parse(until),
    isUpdate,
  };
}

/** §6.1: in Needs changes, or a first rejection, suspension or removal that can still be appealed and hasn't been. */
function needsAttention(state: LifecycleState, view: ReleaseView, now: IsoDateTime): boolean {
  if (inTab(view, 'needs_changes')) return true;
  const option = appealOption(state, view, now);
  return Boolean(option && !option.isUpdate && !option.appeal && !option.windowClosed);
}

export function attentionCount(state: LifecycleState, now: IsoDateTime): number {
  return allViews(state, now).filter((v) => needsAttention(state, v, now)).length;
}

/** The latest "request changes" decision on the open revision: its reasons and note. */
export function changesRequestedOf(state: LifecycleState, view: ReleaseView): ReviewCase | null {
  if (!view.open || view.open.status !== 'changes_requested') return null;
  return decisionCaseOf(state, view.open, 'changes_requested');
}

export interface StatementEntry {
  caseId: string;
  kind: 'rejected' | 'suspended' | 'removed' | 'appeal_upheld';
  at: IsoDateTime;
  statement: StatementOfReasons;
  /** For update rejections: the revision that wasn't published. */
  revision: Revision | null;
}

/** Every statement of reasons on a release, newest first (§4.10). */
export function statementsOf(state: LifecycleState, releaseId: string): StatementEntry[] {
  const out: StatementEntry[] = [];
  for (const c of Object.values(state.cases)) {
    if (c.releaseId !== releaseId || !c.decision) continue;
    const d = c.decision;
    if (d.outcome === 'rejected' || d.outcome === 'suspended' || d.outcome === 'removed' || d.outcome === 'appeal_upheld') {
      out.push({
        caseId: c.id,
        kind: d.outcome,
        at: d.at,
        statement: d.statement,
        revision: c.revisionId ? state.revisions[c.revisionId] ?? null : null,
      });
    }
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/* ------------------------------------------------------------------ */
/* Row and header text                                                 */
/* ------------------------------------------------------------------ */

export function chipText(view: ReleaseView, id: PrimaryChipId | SecondaryChipId): { label: string; hint: string } {
  const copy = CHIP_COPY[id];
  const n = view.current?.version ?? 1;
  const hint =
    id === 'live' && view.release.type === 'song'
      ? CHIP_LIVE_SONG_HINT
      : fill(copy.hint, {
          n,
          next: pendingVersionNumber(view.current),
          date: view.release.goesPublicAt ? formatDate(view.release.goesPublicAt) : '',
        });
  return { label: copy.label, hint };
}

/** §6.2 version line: "v2 live · v3 in review", "v1 live", "Revision #1", "Not live yet". */
export function versionLine(view: ReleaseView): string {
  const { release, current, open, latest } = view;
  if (current?.version) {
    const n = current.version;
    if (release.status !== 'live') return fill(VERSION_ONLY, { n });
    if (open?.status === 'in_review') return fill(VERSION_COPY.liveUpdateInReview, { n, next: n + 1 });
    if (open?.status === 'draft') return fill(VERSION_COPY.liveUpdateDraft, { n });
    return fill(VERSION_COPY.live, { n });
  }
  if (release.status === 'draft') return fill(VERSION_COPY.revision, { seq: latest.seq });
  return VERSION_COPY.notLive;
}

export function channelLabel(release: Release): string {
  const market = release.channels.includes('market');
  const stream = release.channels.includes('stream');
  if (market && stream) return CHANNEL_LABEL.both;
  return stream ? CHANNEL_LABEL.stream : CHANNEL_LABEL.market;
}

export interface Activity {
  at: IsoDateTime;
  text: string;
}

/** §6.2 last activity, from the latest event (edits included) on the release. */
export function lastActivity(state: LifecycleState, release: Release): Activity {
  let latest: ReviewEvent | null = null;
  for (const e of state.events) {
    if (e.releaseId !== release.id || !ACTIVITY_LABEL[e.type]) continue;
    if (!latest || Date.parse(e.at) >= Date.parse(latest.at)) latest = e;
  }
  const open = release.openRevisionId ? state.revisions[release.openRevisionId] : null;
  if (open && (!latest || Date.parse(open.updatedAt) > Date.parse(latest.at)) && open.status === 'draft') {
    return { at: open.updatedAt, text: `${ACTIVITY_LABEL.draft_saved} ${formatRelative(open.updatedAt)}` };
  }
  if (!latest) return { at: release.updatedAt, text: formatRelative(release.updatedAt) };
  return { at: latest.at, text: `${ACTIVITY_LABEL[latest.type]} ${formatRelative(latest.at)}` };
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

/** Seller-visible events, newest first (§6.3). Internal events are never shown. */
export function sellerTimeline(state: LifecycleState, releaseId: string): ReviewEvent[] {
  return state.events
    .filter((e) => e.releaseId === releaseId && e.visibility === 'seller' && e.type !== 'deleted')
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** §9.5 timeline titles, picking the variant for first releases, updates and unpublish causes. */
export function timelineTitle(state: LifecycleState, event: ReviewEvent): string {
  const revision = event.revisionId ? state.revisions[event.revisionId] : null;
  const isUpdate = revision ? revision.baseVersion !== null : false;
  switch (event.type) {
    case 'release_created':
      return TIMELINE_UI.created;
    case 'rejected':
      return isUpdate ? EVENT_COPY.rejected_update.timeline : EVENT_COPY.rejected.timeline;
    case 'scheduled': {
      const date = revision?.payload.kind === 'song' && revision.payload.releaseDate ? formatDate(`${revision.payload.releaseDate}T00:00:00Z`) : '';
      return fill(EVENT_COPY.scheduled.timeline, { date });
    }
    case 'unpublished':
      if (event.note === 'storage_over_quota') return EVENT_COPY.unpublished_storage.timeline;
      if (event.note === 'account_closed') return EVENT_COPY.unpublished_account.timeline;
      return EVENT_COPY.unpublished.timeline;
    case 'update_went_live':
    case 'update_approved':
      return fill(EVENT_COPY[event.type].timeline, { n: event.version ?? '' });
    case 'draft_saved':
    case 'auto_checks_completed':
    case 'publish_failed':
    case 'deleted':
      return '';
    default:
      return EVENT_COPY[event.type].timeline;
  }
}

/** "v3" for decisions on approved versions, "Revision #3" otherwise. */
export function timelineLabel(event: ReviewEvent): string | null {
  if (event.version !== null) return fill(TIMELINE_UI.version, { n: event.version });
  if (event.seq !== null) return fill(TIMELINE_UI.revision, { seq: event.seq });
  return null;
}

/* ------------------------------------------------------------------ */
/* The Market's view (WEB-V2-SPEC §6.1)                                */
/* ------------------------------------------------------------------ */

/** What buyers see: only the current approved revision, never a pending one (§6.7). */
export function toPublicView(state: LifecycleState, releaseId: string, now: IsoDateTime): PublicReleaseView | null {
  const release = state.releases[releaseId];
  if (!release?.currentRevisionId) return null;
  const current = state.revisions[release.currentRevisionId];
  if (!current?.version) return null;
  const payload = current.payload;
  return {
    isPublic: isPublic(release, now),
    status: release.status,
    version: current.version,
    updatedAt: current.decidedAt ?? release.updatedAt,
    whatsNew: current.version > 1 ? current.changeNote : null,
    title: payload.title,
    coverSeed: payload.cover?.file.demoAssetKey ?? release.id,
    price: payload.price,
    ...(payload.kind === 'beat' ? { leaseTiers: payload.tiers } : {}),
    ...(payload.kind === 'splits_pack' ? { splitTerms: payload.terms } : {}),
  };
}

/** Every release that is public at `now`, newest first. */
export function publicListings(state: LifecycleState, now: IsoDateTime): PublicReleaseListing[] {
  const out: PublicReleaseListing[] = [];
  for (const release of Object.values(state.releases)) {
    const view = toPublicView(state, release.id, now);
    if (!view?.isPublic) continue;
    const payload = state.revisions[release.currentRevisionId as string].payload;
    out.push({
      ...view,
      releaseId: release.id,
      slug: release.slug,
      type: release.type,
      sellerHandle: release.sellerHandle,
      bpm: payload.bpm?.value ?? null,
      key: payload.key?.value ?? null,
      tags: payload.tags,
    });
  }
  return out.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
