'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';
import { TextAreaField } from '@/components/ui/Field';
import { Alert, ArrowRight } from '@/components/ui/Icons';
import Stepper from '@/components/ui/Stepper';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { useHydrated } from '@/components/v2/studio/useHydrated';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { CONFIRM_COPY, NOTICE_COPY, WIZARD_COPY, WIZARD_STEP_LABELS } from '@/lib/v2-demo/release-lifecycle/copy';
import { diffRevision } from '@/lib/v2-demo/release-lifecycle/diff';
import { releaseView, revisionsOf } from '@/lib/v2-demo/release-lifecycle/selectors';
import { SELLER_ACTOR, dispatch, lifecycleStore } from '@/lib/v2-demo/release-lifecycle/store';
import {
  isPublic,
  type Attestation,
  type LifecycleState,
  type ProvenanceEvidence,
  type Release,
  type ReleasePayload,
  type ValidationIssue,
  type WizardStepId,
} from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI, WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { validateSubmission, VALIDATION_COPY } from '@/lib/v2-demo/release-lifecycle/validation';
import {
  DEMO_VAULT_ID,
  findProject,
  isWizardType,
  prefillPayload,
  stemFiles,
  tierFiles,
  VAULT_PROJECTS,
  type SellerIdentity,
  type VaultProject,
  type WizardType,
} from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { sellerProfileStore } from '@/lib/v2-demo/release-lifecycle/viewer-prefs';
import { PERSONA } from '@/lib/v2-demo/sellers';
import ChangesPanel from './ChangesPanel';
import ContentsStep from './ContentsStep';
import CoverStep from './CoverStep';
import DetailsStep from './DetailsStep';
import LicensePriceStep from './LicensePriceStep';
import ReviewSubmitStep, { type AttestationChecks } from './ReviewSubmitStep';
import SourceStep from './SourceStep';
import WizardSummary from './WizardSummary';
import { evidenceFor, fieldId, issueLookup, setBpm, setKey, STEP_ORDER } from './wizard-shared';

const AUTOSAVE_MS = 500;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Maya Lind as Nightjar, with the display name from the first-time seller step. */
function sellerIdentity(): SellerIdentity {
  return { displayName: sellerProfileStore.getSnapshot().displayName, personName: PERSONA.personName, userId: PERSONA.userId };
}

/** "Refresh from Vault project" (RL §5.6): re-read what the project knows; keep what only the seller decides. */
function refreshFromProject(current: ReleasePayload, project: VaultProject, type: WizardType): ReleasePayload {
  const fresh = prefillPayload(project, type, sellerIdentity(), DEMO_NOW);
  let next: ReleasePayload = { ...current, title: fresh.title, description: fresh.description, tags: fresh.tags, cover: fresh.cover };
  next = setKey(setBpm(next, fresh.bpm), fresh.key);
  if (next.kind === 'sample_pack' && fresh.kind === 'sample_pack') return { ...next, samples: fresh.samples, contents: fresh.contents, demo: fresh.demo };
  if (next.kind === 'preset_pack' && fresh.kind === 'preset_pack') return { ...next, presets: fresh.presets, perPresetDemos: fresh.perPresetDemos, demo: fresh.demo };
  if (next.kind === 'beat' && fresh.kind === 'beat') {
    const stems = stemFiles(project);
    return { ...next, mainMix: fresh.mainMix, stems, tiers: next.tiers.map((t) => ({ ...t, files: tierFiles(t.tier, fresh.mainMix, stems, project) })) };
  }
  if (next.kind === 'song' && fresh.kind === 'song') {
    return { ...next, tracks: next.tracks.map((t, i) => (i === 0 ? { ...t, audio: fresh.tracks[0].audio } : t)) };
  }
  return next;
}

interface WizardInit {
  type: WizardType;
  releaseId: string | null;
  isUpdate: boolean;
  title: string | null;
  liveVersion: number | null;
  /** The live payload an update is compared with. */
  baseline: ReleasePayload | null;
  payload: ReleasePayload | null;
  projectId: string | null;
  projectName: string | null;
  changeNote: string;
  openStatus: 'draft' | 'changes_requested' | null;
  saveOnly: boolean;
  releaseDateLocked: boolean;
  lockedTerritories: string[];
  evidenceFallback: ProvenanceEvidence | null;
  attestation: Attestation | null;
  step: WizardStepId;
}

type Blocked = keyof typeof WIZARD_UI.blocked;

function newInit(type: WizardType, projectId: string | null): WizardInit {
  const project = projectId ? VAULT_PROJECTS.find((p) => p.id === projectId) ?? null : null;
  return {
    type,
    releaseId: null,
    isUpdate: false,
    title: null,
    liveVersion: null,
    baseline: null,
    payload: project ? prefillPayload(project, type, sellerIdentity(), DEMO_NOW) : null,
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    changeNote: '',
    openStatus: null,
    saveOnly: false,
    releaseDateLocked: false,
    lockedTerritories: [],
    evidenceFallback: null,
    attestation: null,
    step: project ? 'details' : 'source',
  };
}

/** The wizard for an existing release, or why it can't be edited now (RL §5.6, §6.4, L1, L19). */
function editInit(state: LifecycleState, release: Release, step: WizardStepId | null): WizardInit | Blocked {
  if (!isWizardType(release.type)) return 'closed';
  const view = releaseView(state, release, DEMO_NOW);
  const { open, current } = view;
  const isUpdate = current !== null;
  if (!isUpdate) {
    if (open?.status === 'in_review') return 'in_review';
    if (view.openAppeal) return 'appeal';
    if (release.status === 'rejected') return 'rejected';
  } else {
    const by = release.unpublished;
    if (by && (by.by === 'platform' || (by.by === 'system' && by.cause !== 'storage_over_quota'))) return 'closed';
    if (open?.status === 'in_review') return 'in_review';
    if (open?.status === 'rejected') return 'appeal';
    if (release.status === 'suspended' && !open) return 'on_hold';
  }
  const base = open ?? current;
  if (!base) return 'closed';
  const project = release.source ? findProject(release.source.projectName) : null;
  const evidenceFallback = [...revisionsOf(state, release)].reverse().find((r) => r.evidence)?.evidence ?? null;
  return {
    type: release.type,
    releaseId: release.id,
    isUpdate,
    title: (current ?? base).payload.title,
    liveVersion: current?.version ?? null,
    baseline: current ? clone(current.payload) : null,
    payload: clone(base.payload),
    projectId: project?.id ?? null,
    projectName: release.source?.projectName ?? null,
    changeNote: open?.changeNote ?? '',
    openStatus: open?.status === 'draft' || open?.status === 'changes_requested' ? open.status : null,
    saveOnly: release.status === 'suspended',
    releaseDateLocked: isUpdate && isPublic(release, DEMO_NOW),
    lockedTerritories: current?.payload.kind === 'song' ? current.payload.territories : [],
    evidenceFallback,
    attestation: open?.attestation ?? null,
    step: step ?? 'details',
  };
}

function toChecks(a: Attestation | null): AttestationChecks {
  return {
    madeByMe: Boolean(a?.madeByMe && a.noGeneratedAudio),
    licensedMaterialListed: Boolean(a?.licensedMaterialListed),
    coverRights: Boolean(a?.coverRights),
    falseStatementConsequences: Boolean(a?.falseStatementConsequences),
  };
}

function toAttestation(c: AttestationChecks): Attestation {
  return {
    standardVersion: 'human-made-2026-10',
    madeByMe: c.madeByMe,
    noGeneratedAudio: c.madeByMe,
    licensedMaterialListed: c.licensedMaterialListed,
    coverRights: c.coverRights,
    falseStatementConsequences: c.falseStatementConsequences,
    acceptedAt: null,
  };
}

/* ------------------------------------------------------------------ */
/* The form                                                            */
/* ------------------------------------------------------------------ */

function WizardForm({ init }: { init: WizardInit }) {
  const router = useRouter();
  const toast = useToast();
  const replyId = useId();
  const labels = WIZARD_STEP_LABELS[init.type];

  const [payload, setPayload] = useState<ReleasePayload | null>(init.payload);
  const [projectId, setProjectId] = useState<string | null>(init.projectId);
  const [releaseId, setReleaseId] = useState<string | null>(init.releaseId);
  const [changeNote, setChangeNoteState] = useState(init.changeNote);
  const [checks, setChecks] = useState<AttestationChecks>(() => toChecks(init.attestation));
  const [nothingToList, setNothingToList] = useState(false);
  const [howMadeNote, setHowMadeNote] = useState(init.evidenceFallback?.howMadeNote ?? '');
  const [step, setStep] = useState<WizardStepId>(init.step);
  const [flagged, setFlagged] = useState<ReadonlySet<WizardStepId>>(() => new Set(init.step === 'review_submit' ? STEP_ORDER : []));
  const [visited, setVisited] = useState<ReadonlySet<WizardStepId>>(() => new Set());
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepChanged = useRef(false);

  // Autosave reads these, so a debounced save always writes the latest edit.
  const payloadRef = useRef(init.payload);
  const changeNoteRef = useRef(init.changeNote);
  const projectIdRef = useRef(init.projectId);
  const releaseIdRef = useRef(init.releaseId);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const project = useMemo(() => (projectId ? findProject(projectId) : null), [projectId]);

  /** Writes the draft now: T01 on a new release's first save, T07 on an update's first change, else T02. */
  const save = useCallback((): string | null => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const current = payloadRef.current;
    if (!dirty.current || !current) return releaseIdRef.current;
    dirty.current = false;
    let id = releaseIdRef.current;
    if (!id) {
      const source = projectIdRef.current ? findProject(projectIdRef.current) : null;
      if (!source) return null;
      const created = dispatch(
        {
          type: 'create_release',
          releaseType: init.type,
          source: { vaultId: DEMO_VAULT_ID, projectName: source.name, pushedAtCapture: true, capturedAt: DEMO_NOW },
          payload: current,
        },
        SELLER_ACTOR,
      );
      if (!created.ok) {
        setSaveError(created.message);
        return null;
      }
      id = created.events[0].releaseId;
      releaseIdRef.current = id;
      setReleaseId(id);
      // The draft now lives in Studio; a reload continues it instead of starting over.
      window.history.replaceState(null, '', `/studio/${id}/edit`);
    } else {
      const release = lifecycleStore.getSnapshot().releases[id];
      if (release?.currentRevisionId && !release.openRevisionId) {
        const started = dispatch({ type: 'start_update', releaseId: id }, SELLER_ACTOR);
        if (!started.ok) {
          setSaveError(started.message);
          return null;
        }
        toast.show(`Demo: ${fill(NOTICE_COPY.toastUpdateStarted, { n: init.liveVersion ?? 1 })}`);
      }
      const saved = dispatch(
        { type: 'save_draft', releaseId: id, payload: current, changeNote: init.isUpdate ? changeNoteRef.current : undefined },
        SELLER_ACTOR,
      );
      if (!saved.ok) {
        setSaveError(saved.message);
        return null;
      }
    }
    setSaveError(null);
    setSaveState('saved');
    return id;
  }, [init.type, init.isUpdate, init.liveVersion, toast]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // "Back to Studio never loses work": flush on leave and when the tab is hidden.
  useEffect(() => {
    const flush = () => saveRef.current();
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const schedule = () => {
    dirty.current = true;
    setSaveState('pending');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(), AUTOSAVE_MS);
  };

  const update = (next: ReleasePayload) => {
    payloadRef.current = next;
    setPayload(next);
    schedule();
  };

  const setChangeNote = (value: string) => {
    changeNoteRef.current = value;
    setChangeNoteState(value);
    schedule();
  };

  const start = (picked: VaultProject) => {
    projectIdRef.current = picked.id;
    setProjectId(picked.id);
    update(prefillPayload(picked, init.type, sellerIdentity(), DEMO_NOW));
    setVisited((v) => new Set(v).add('source'));
    goTo('details');
  };

  /* Validation ------------------------------------------------------- */

  const evidence = useMemo(() => evidenceFor(project, init.evidenceFallback, howMadeNote), [project, init.evidenceFallback, howMadeNote]);
  const changes = useMemo(() => (init.baseline && payload ? diffRevision(init.baseline, payload) : null), [init.baseline, payload]);
  const issues: ValidationIssue[] = useMemo(() => {
    if (!payload) {
      return [{ step: 'source', field: 'source', code: 'required', message: fill(VALIDATION_COPY.required, { field: 'a Vault project' }) }];
    }
    return validateSubmission(payload, {
      now: DEMO_NOW,
      attestation: toAttestation(checks),
      evidence,
      update: init.isUpdate ? { changeNote, hasChanges: (changes?.kinds.length ?? 0) > 0 } : undefined,
      releaseDateLocked: init.releaseDateLocked,
    });
  }, [payload, checks, evidence, init.isUpdate, init.releaseDateLocked, changeNote, changes]);
  const errorFor = useMemo(() => issueLookup(issues, flagged), [issues, flagged]);

  /* Navigation ------------------------------------------------------- */

  const index = STEP_ORDER.indexOf(step);
  function goTo(next: WizardStepId) {
    stepChanged.current = true;
    // Until a project is picked there is nothing to show on the other steps.
    setStep(payloadRef.current ? next : 'source');
  }
  const advance = () => {
    // "Continue" flags issues on the step it leaves; "Back" never validates (RL §5.2).
    setFlagged((f) => new Set(f).add(step));
    setVisited((v) => new Set(v).add(step));
    goTo(STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)]);
  };
  const back = () => goTo(STEP_ORDER[Math.max(index - 1, 0)]);
  const goToIssue = (issue: ValidationIssue) => {
    setFlagged((f) => new Set(f).add(issue.step));
    goTo(issue.step);
    setFocusTarget(issue.field);
  };

  useEffect(() => {
    if (focusTarget) {
      // The field itself, or the closest group that holds it ("credits.master" → "credits").
      const parts = focusTarget.split('.');
      const el = parts.map((_, i) => document.getElementById(fieldId(parts.slice(0, parts.length - i).join('.')))).find(Boolean);
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
      setFocusTarget(null);
    } else if (stepChanged.current) {
      headingRef.current?.focus();
    }
    stepChanged.current = false;
  }, [step, focusTarget]);

  /* Submit ----------------------------------------------------------- */

  const resubmitting = init.openStatus === 'changes_requested';
  const onlyNothingChanged = issues.length === 1 && issues[0].code === 'nothing_changed';
  const submitLabel = init.isUpdate ? WIZARD_COPY.buttons.submitUpdate : WIZARD_COPY.buttons.submit;
  const confirmCopy = resubmitting ? CONFIRM_COPY.resubmit : init.isUpdate ? CONFIRM_COPY.submit_update : CONFIRM_COPY.submit_first;
  const n = init.liveVersion ?? 1;
  const confirmVars = { title: payload?.title ?? '', n, next: n + 1 };
  const confirmBody =
    !resubmitting && init.isUpdate && init.type === 'song' && 'bodyAlt' in confirmCopy ? confirmCopy.bodyAlt : confirmCopy.body;

  const submit = () => {
    const id = save() ?? releaseIdRef.current;
    if (!id) {
      setSubmitError(WIZARD_UI.pickProjectFirst);
      return;
    }
    const result = dispatch(
      resubmitting
        ? { type: 'resubmit', releaseId: id, replyToReviewer: reply.trim() || null }
        : { type: 'submit', releaseId: id, attestation: toAttestation(checks), evidence },
      SELLER_ACTOR,
    );
    if (!result.ok) {
      setSubmitError(fill(WIZARD_UI.submitError, { message: result.issues?.[0]?.message ?? result.message }));
      return;
    }
    setConfirmOpen(false);
    toast.show(`Demo: ${NOTICE_COPY.toastSubmitted}`);
    router.push(`/studio/${id}`);
  };

  const saveDraft = () => {
    if (payloadRef.current && !releaseIdRef.current) dirty.current = true;
    const id = save();
    if (id) router.push(`/studio/${id}`);
  };

  /* Render ------------------------------------------------------------ */

  const stepItems = STEP_ORDER.map((id) => ({ id, label: labels[id] }));
  const issueCounts = Object.fromEntries(STEP_ORDER.map((s) => [s, flagged.has(s) ? issues.filter((i) => i.step === s).length : 0]));
  const completed = STEP_ORDER.filter((s) => visited.has(s) && !issues.some((i) => i.step === s));
  const h1 = init.isUpdate && init.title ? fill(WIZARD_COPY.h1Edit, { title: init.title }) : fill(WIZARD_COPY.h1, { type: WIZARD_COPY.typeName[init.type] });
  const coverBase = releaseId ?? projectId ?? init.type;
  const stepProps = payload ? { payload, update, project, errorFor, isUpdate: init.isUpdate } : null;
  const hasDraft = saveState === 'saved' || init.openStatus !== null;
  const saveText = saveError ?? (saveState === 'pending' ? WIZARD_UI.saving : hasDraft ? WIZARD_UI.saved : WIZARD_UI.notSaved);

  let body: React.ReactNode = null;
  if (step === 'source' || !stepProps) {
    body = (
      <SourceStep
        payload={payload}
        project={project}
        projectName={init.projectName}
        locked={payload !== null}
        onStart={start}
        refreshed={payload && project ? refreshFromProject(payload, project, init.type) : null}
        onApplyRefresh={() => payload && project && update(refreshFromProject(payload, project, init.type))}
      />
    );
  } else if (step === 'details') body = <DetailsStep {...stepProps} />;
  else if (step === 'contents') body = <ContentsStep {...stepProps} />;
  else if (step === 'cover_preview') body = <CoverStep {...stepProps} coverBase={coverBase} />;
  else if (step === 'license_price') {
    body = <LicensePriceStep {...stepProps} releaseDateLocked={init.releaseDateLocked} lockedTerritories={init.lockedTerritories} />;
  } else {
    body = (
      <ReviewSubmitStep
        {...stepProps}
        issues={issues}
        stepLabel={(s) => labels[s]}
        onGoTo={goToIssue}
        attestation={checks}
        setAttestation={setChecks}
        nothingToList={nothingToList}
        setNothingToList={setNothingToList}
        evidence={evidence}
        howMadeNote={howMadeNote}
        setHowMadeNote={setHowMadeNote}
        changeNote={changeNote}
        setChangeNote={setChangeNote}
        changes={changes}
      />
    );
  }

  const last = index === STEP_ORDER.length - 1;
  const blockedReason = init.saveOnly
    ? NOTICE_COPY.disabled.onHold
    : onlyNothingChanged
      ? VALIDATION_COPY.nothing_changed
      : issues.length > 0
        ? WIZARD_UI.review.issuesTitle
        : undefined;
  const submitText =
    issues.length === 0 || onlyNothingChanged || init.saveOnly
      ? submitLabel
      : issues.length === 1
        ? WIZARD_UI.fixOne
        : fill(WIZARD_COPY.buttons.fixToSubmit, { n: issues.length });

  return (
    <>
      <Container className="pb-36 pt-10 lg:pt-14">
        <Link href={releaseId ? `/studio/${releaseId}` : '/studio'} className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-ink hover:underline">
          {WIZARD_UI.backToStudio}
        </Link>
        <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-ink md:text-4xl">{h1}</h1>
        {init.saveOnly && (
          <p className="mt-4 flex items-center gap-2 rounded-md bg-tone-warning-bg px-4 py-3 text-sm text-tone-warning">
            <Alert size={16} />
            {WIZARD_UI.saveOnly}
          </p>
        )}
        <div className="mt-6">
          <Stepper steps={stepItems} current={step} completed={completed} issues={issueCounts} onStepClick={(id) => goTo(id as WizardStepId)} label={WIZARD_UI.stepsLabel} />
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold tracking-tight text-ink focus:outline-none">
              {labels[step]}
            </h2>
            <div className="mt-5">{body}</div>
          </div>
          <aside className="min-w-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              {init.isUpdate && changes && init.liveVersion !== null ? (
                <ChangesPanel changes={changes} liveVersion={init.liveVersion} />
              ) : (
                <WizardSummary type={init.type} payload={payload} coverSeed={coverBase} />
              )}
            </div>
          </aside>
        </div>
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas">
        <Container className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <Button variant="ghost" onClick={back} disabled={index === 0}>
            {WIZARD_COPY.buttons.back}
          </Button>
          <p aria-live="polite" className={`text-xs ${saveError ? 'text-danger' : 'text-ink-subtle'}`}>
            {saveText}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={saveDraft} disabled={!payload} disabledReason={payload ? undefined : WIZARD_UI.pickProjectFirst}>
              {WIZARD_COPY.buttons.saveDraft}
            </Button>
            {last ? (
              <Button
                onClick={() => {
                  setSubmitError(null);
                  setConfirmOpen(true);
                }}
                disabled={Boolean(blockedReason)}
                disabledReason={blockedReason}
                iconRight={blockedReason ? undefined : <ArrowRight size={16} />}
              >
                {submitText}
              </Button>
            ) : (
              <Button onClick={advance} iconRight={<ArrowRight size={16} />}>
                {WIZARD_COPY.buttons.continue}
              </Button>
            )}
          </div>
        </Container>
      </div>

      <DemoConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title={fill(confirmCopy.title, confirmVars)}
        body={fill(confirmBody, confirmVars)}
        confirmLabel={confirmCopy.confirm}
        cancelLabel={confirmCopy.cancel}
      >
        {resubmitting && (
          <TextAreaField id={replyId} label={WIZARD_UI.review.reply} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
        )}
        {submitError && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {submitError}
          </p>
        )}
      </DemoConfirm>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

function BlockedState({ reason, releaseId }: { reason: Blocked; releaseId: string }) {
  const copy = WIZARD_UI.blocked[reason];
  return (
    <Container className="py-10 lg:py-14">
      <EmptyState headingLevel="h1" title={copy.title} body={copy.body} action={<Button href={`/studio/${releaseId}`}>{WIZARD_UI.backToStudio}</Button>} />
    </Container>
  );
}

/** A new release; the prefill reads the seller profile, which lives in this browser. */
function NewEntry({ type, projectId }: { type: WizardType; projectId: string | null }) {
  const [init] = useState(() => newInit(type, projectId));
  return <WizardForm init={init} />;
}

/** Reads the store once, after hydration, so later autosaves never re-initialise the form. */
function EditEntry({ releaseId, step }: { releaseId: string; step: WizardStepId | null }) {
  const [prepared] = useState(() => {
    const state = lifecycleStore.getSnapshot();
    const release = state.releases[releaseId];
    return release ? editInit(state, release, step) : null;
  });
  if (prepared === null) {
    return (
      <Container className="py-10 lg:py-14">
        <EmptyState
          headingLevel="h1"
          title={DETAIL_UI.notFoundTitle}
          body={DETAIL_UI.notFoundBody}
          action={<Button href="/studio">{WIZARD_UI.backToStudio}</Button>}
        />
      </Container>
    );
  }
  if (typeof prepared === 'string') return <BlockedState reason={prepared} releaseId={releaseId} />;
  return <WizardForm init={prepared} />;
}

/**
 * The Publish wizard (RL §5, WEB-V2-SPEC §4.6): `/publish/[type]` starts a new
 * release; `/studio/[releaseId]/edit` continues a draft or creates a pending
 * revision while the live version stays up. Everything waits for hydration,
 * because the draft and the seller profile live in this browser.
 */
export default function PublishWizard(
  props: { mode: 'new'; type: WizardType; projectId: string | null } | { mode: 'edit'; releaseId: string; step: WizardStepId | null },
) {
  const hydrated = useHydrated();
  if (!hydrated) return <Container className="min-h-[60vh] py-10" aria-busy="true">{null}</Container>;
  if (props.mode === 'edit') return <EditEntry releaseId={props.releaseId} step={props.step} />;
  return <NewEntry type={props.type} projectId={props.projectId} />;
}
