'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { TextAreaField } from '@/components/ui/Field';
import { Alert, ArrowRight, Check } from '@/components/ui/Icons';
import Stepper from '@/components/ui/Stepper';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { CONFIRM_COPY, NOTICE_COPY, WIZARD_COPY, WIZARD_STEP_LABELS } from '@/lib/v2-demo/release-lifecycle/copy';
import { creatorProfileStore, isCreatorVerified } from '@/lib/v2-demo/release-lifecycle/creator';
import { diffRevision } from '@/lib/v2-demo/release-lifecycle/diff';
import {
  PROJECT_STEP,
  PUBLISH_FOOTER,
  PUBLISH_STEP_ASKS,
  PUBLISH_STEP_LABELS,
  PUBLISH_WINDOW,
  REVIEW_STEP,
  TYPE_STEP,
} from '@/lib/v2-demo/release-lifecycle/publish-copy';
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
import { PERSONA } from '@/lib/v2-demo/sellers';
import ChangesPanel from './ChangesPanel';
import ContentsStep from './ContentsStep';
import CoverStep from './CoverStep';
import CreatorGate from './CreatorGate';
import DetailsStep from './DetailsStep';
import LicensePriceStep from './LicensePriceStep';
import PublishWindow from './PublishWindow';
import ReviewSubmitStep, { type AttestationChecks } from './ReviewSubmitStep';
import SourceStep from './SourceStep';
import TypeStep from './TypeStep';
import WizardSummary from './WizardSummary';
import { evidenceFor, fieldId, issueLookup, setBpm, setKey, STEP_ORDER, type PublishStepId } from './wizard-shared';

const AUTOSAVE_MS = 500;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Maya Lind, releasing under the creator profile's display name (PUBLISH-PROCEDURE §1). */
function sellerIdentity(): SellerIdentity {
  const displayName = creatorProfileStore.getSnapshot().displayName.trim() || PERSONA.artistName;
  return { displayName, personName: PERSONA.personName, userId: PERSONA.userId };
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
  /** Null on /publish until step 1 picks one. */
  type: WizardType | null;
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
  step: PublishStepId;
}

type Blocked = keyof typeof WIZARD_UI.blocked;

/** A new release: /publish starts at Type; /publish/[type] has Type filled in, and `?project=` Project too. */
function newInit(type: WizardType | null, projectId: string | null): WizardInit {
  const project = type && projectId ? VAULT_PROJECTS.find((p) => p.id === projectId) ?? null : null;
  return {
    type,
    releaseId: null,
    isUpdate: false,
    title: null,
    liveVersion: null,
    baseline: null,
    payload: project && type ? prefillPayload(project, type, sellerIdentity(), DEMO_NOW) : null,
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    changeNote: '',
    openStatus: null,
    saveOnly: false,
    releaseDateLocked: false,
    lockedTerritories: [],
    evidenceFallback: null,
    attestation: null,
    step: !type ? 'type' : project ? 'details' : 'source',
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

/** "{project} · {type}" in the window header (§3). */
function windowSubtitle(projectName: string | null, type: WizardType | null): string {
  return [projectName, type ? WIZARD_COPY.tiles[type].title : null].filter(Boolean).join(' · ') || PUBLISH_WINDOW.newRelease;
}

/** The Cover step's heading: "Cover and preview" for songs and beats, "Cover and demo" for packs. */
function stepHeading(step: PublishStepId, type: WizardType | null): string {
  if (step === 'cover_preview' && type) return WIZARD_STEP_LABELS[type].cover_preview;
  return PUBLISH_STEP_ASKS[step];
}

/* ------------------------------------------------------------------ */
/* After submit                                                        */
/* ------------------------------------------------------------------ */

function Submitted({ releaseId, subtitle }: { releaseId: string; subtitle: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <PublishWindow subtitle={subtitle} closeHref={`/studio/${releaseId}`}>
      <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center md:py-16">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tone-success-bg text-tone-success">
          <Check size={24} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-xl font-bold tracking-tight text-ink focus:outline-none">
          {REVIEW_STEP.submitted}
        </h2>
        <Button className="mt-6" href={`/studio/${releaseId}`} iconRight={<ArrowRight size={16} />}>
          {REVIEW_STEP.openInStudio}
        </Button>
      </div>
    </PublishWindow>
  );
}

/* ------------------------------------------------------------------ */
/* The form                                                            */
/* ------------------------------------------------------------------ */

function WizardForm({ init }: { init: WizardInit }) {
  const router = useRouter();
  const toast = useToast();
  const replyId = useId();

  const [type, setTypeState] = useState<WizardType | null>(init.type);
  const [payload, setPayload] = useState<ReleasePayload | null>(init.payload);
  const [projectId, setProjectId] = useState<string | null>(init.projectId);
  const [pickedProjectId, setPickedProjectId] = useState<string | null>(init.projectId);
  const [releaseId, setReleaseId] = useState<string | null>(init.releaseId);
  const [changeNote, setChangeNoteState] = useState(init.changeNote);
  const [checks, setChecks] = useState<AttestationChecks>(() => toChecks(init.attestation));
  const [nothingToList, setNothingToList] = useState(false);
  const [howMadeNote, setHowMadeNote] = useState(init.evidenceFallback?.howMadeNote ?? '');
  const [step, setStep] = useState<PublishStepId>(init.step);
  const [flagged, setFlagged] = useState<ReadonlySet<PublishStepId>>(() => new Set(init.step === 'review_submit' ? STEP_ORDER : []));
  const [visited, setVisited] = useState<ReadonlySet<PublishStepId>>(
    () => new Set<PublishStepId>([...(init.type ? (['type'] as const) : []), ...(init.payload ? (['source'] as const) : [])]),
  );
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);

  // Autosave reads these, so a debounced save always writes the latest edit.
  const typeRef = useRef(init.type);
  const payloadRef = useRef(init.payload);
  const changeNoteRef = useRef(init.changeNote);
  const projectIdRef = useRef(init.projectId);
  const releaseIdRef = useRef(init.releaseId);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const project = useMemo(() => (projectId ? findProject(projectId) : null), [projectId]);
  // Type and project are fixed once a project is started (and the draft saves).
  const locked = payload !== null;

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
      const releaseType = typeRef.current;
      if (!source || !releaseType) return null;
      const created = dispatch(
        {
          type: 'create_release',
          releaseType,
          source: { vaultId: DEMO_VAULT_ID, projectName: source.name, pushedAtCapture: true, capturedAt: DEMO_NOW },
          payload: current,
          // T01 "seller eligible" (PUBLISH-PROCEDURE §1): the reducer refuses without a verified creator profile.
          sellerEligible: isCreatorVerified(creatorProfileStore.getSnapshot()),
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
  }, [init.isUpdate, init.liveVersion, toast]);

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

  const pickType = (next: WizardType) => {
    if (locked) return;
    typeRef.current = next;
    setTypeState(next);
  };

  /** Starts from the chosen project, with everything it knows filled in (§2 step 2). */
  const start = (picked: VaultProject) => {
    const releaseType = typeRef.current;
    if (!releaseType) return;
    projectIdRef.current = picked.id;
    setProjectId(picked.id);
    update(prefillPayload(picked, releaseType, sellerIdentity(), DEMO_NOW));
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
  const issueCount = (s: PublishStepId) => (s === 'type' ? (type ? 0 : 1) : issues.filter((i) => i.step === s).length);

  /* Navigation ------------------------------------------------------- */

  const index = STEP_ORDER.indexOf(step);
  function goTo(next: PublishStepId) {
    stepChanged.current = true;
    // Nothing to show past Type without a type, or past Project without a project.
    if (!typeRef.current) setStep('type');
    else if (!payloadRef.current && next !== 'type') setStep('source');
    else setStep(next);
  }
  const advance = () => {
    // "Next" flags issues on the step it leaves; "Back" never validates (§2).
    setFlagged((f) => new Set(f).add(step));
    setVisited((v) => new Set(v).add(step));
    if (step === 'type' && !typeRef.current) return;
    if (step === 'source' && !payloadRef.current) {
      const picked = pickedProjectId ? findProject(pickedProjectId) : null;
      if (picked) start(picked);
      return;
    }
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
      bodyRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
    }
    stepChanged.current = false;
  }, [step, focusTarget]);

  /* Submit ----------------------------------------------------------- */

  const resubmitting = init.openStatus === 'changes_requested';
  const onlyNothingChanged = issues.length === 1 && issues[0].code === 'nothing_changed';
  const confirmCopy = resubmitting ? CONFIRM_COPY.resubmit : init.isUpdate ? CONFIRM_COPY.submit_update : CONFIRM_COPY.submit_first;
  const n = init.liveVersion ?? 1;
  const confirmVars = { title: payload?.title ?? '', n, next: n + 1 };
  const confirmBody =
    !resubmitting && init.isUpdate && type === 'song' && 'bodyAlt' in confirmCopy ? confirmCopy.bodyAlt : confirmCopy.body;

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
    setSubmitted(id);
  };

  const saveDraft = () => {
    if (payloadRef.current && !releaseIdRef.current) dirty.current = true;
    const id = save();
    if (id) router.push(`/studio/${id}`);
  };

  /* Render ------------------------------------------------------------ */

  const subtitle = windowSubtitle(
    init.projectName ?? findProject(projectId ?? pickedProjectId ?? '')?.name ?? null,
    type,
  );
  if (submitted) return <Submitted releaseId={submitted} subtitle={subtitle} />;

  const stepItems = STEP_ORDER.map((id) => ({ id, label: PUBLISH_STEP_LABELS[id] }));
  const issueCounts = Object.fromEntries(STEP_ORDER.map((s) => [s, flagged.has(s) ? issueCount(s) : 0]));
  const completed = STEP_ORDER.filter((s) => visited.has(s) && issueCount(s) === 0);
  const coverBase = releaseId ?? projectId ?? type ?? 'release';
  const stepProps = payload ? { payload, update, project, errorFor, isUpdate: init.isUpdate } : null;
  const hasDraft = saveState === 'saved' || init.openStatus !== null;
  const saveText = saveError ?? (saveState === 'pending' ? WIZARD_UI.saving : hasDraft ? WIZARD_UI.saved : WIZARD_UI.notSaved);

  let body: React.ReactNode = null;
  if (step === 'type') {
    body = <TypeStep value={type} locked={locked} onPick={pickType} error={flagged.has('type') && !type ? TYPE_STEP.pickOne : undefined} />;
  } else if (step === 'source' || !stepProps || !type) {
    body = (
      <SourceStep
        payload={payload}
        project={project}
        projectName={init.projectName}
        locked={locked}
        picked={pickedProjectId}
        onPick={setPickedProjectId}
        error={flagged.has('source') && !payload && !pickedProjectId ? PROJECT_STEP.pickOne : undefined}
        refreshed={payload && project && type ? refreshFromProject(payload, project, type) : null}
        onApplyRefresh={() => payload && project && type && update(refreshFromProject(payload, project, type))}
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
        stepLabel={(s) => PUBLISH_STEP_LABELS[s]}
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
        ? issues.length === 1
          ? REVIEW_STEP.fixOne
          : fill(REVIEW_STEP.fixMany, { n: issues.length })
        : undefined;
  const showChanges = init.isUpdate && changes !== null && init.liveVersion !== null;
  const showSummary = !showChanges && type !== null && step !== 'type';

  return (
    <>
      <PublishWindow
        subtitle={subtitle}
        closeHref={releaseId ? `/studio/${releaseId}` : '/studio'}
        status={<span className={saveError ? 'text-danger' : undefined}>{saveText}</span>}
        bodyRef={bodyRef}
        stepper={
          <Stepper
            steps={stepItems}
            current={step}
            completed={completed}
            issues={issueCounts}
            onStepClick={(id) => goTo(id as PublishStepId)}
            label={PUBLISH_WINDOW.stepsLabel}
          />
        }
        footer={
          <>
            <Button variant="ghost" onClick={back} disabled={index === 0} className="max-sm:px-3">
              {PUBLISH_FOOTER.back}
            </Button>
            {/* A wrapper, so the spacing holds when the disabled button sits inside its tooltip. */}
            <span className="ml-auto">
              <Button
                variant="secondary"
                onClick={saveDraft}
                disabled={!payload}
                disabledReason={payload ? undefined : WIZARD_UI.pickProjectFirst}
                className="max-sm:px-4"
              >
                {PUBLISH_FOOTER.saveDraft}
              </Button>
            </span>
            {last ? (
              // On a phone the long label takes its own row under Back and Save draft.
              <span className="max-sm:w-full">
                <Button
                  fullWidth
                  onClick={() => {
                    setSubmitError(null);
                    setConfirmOpen(true);
                  }}
                  disabled={Boolean(blockedReason)}
                  disabledReason={blockedReason}
                >
                  {PUBLISH_FOOTER.submit}
                </Button>
              </span>
            ) : (
              <Button onClick={advance} iconRight={<ArrowRight size={16} />} className="max-sm:px-4">
                {PUBLISH_FOOTER.next}
              </Button>
            )}
          </>
        }
      >
        <div className={showChanges || showSummary ? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]' : ''}>
          <div className="min-w-0">
            {init.saveOnly && (
              <p className="mb-5 flex items-center gap-2 rounded-md bg-tone-warning-bg px-4 py-3 text-sm text-tone-warning">
                <Alert size={16} />
                {WIZARD_UI.saveOnly}
              </p>
            )}
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold tracking-tight text-ink focus:outline-none">
              {stepHeading(step, type)}
            </h2>
            <div className="mt-5">{body}</div>
          </div>
          {showChanges && changes && init.liveVersion !== null && (
            <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
              <ChangesPanel changes={changes} liveVersion={init.liveVersion} />
            </aside>
          )}
          {showSummary && type && (
            <aside className="hidden min-w-0 lg:sticky lg:top-0 lg:block lg:self-start">
              <WizardSummary type={type} payload={payload} coverSeed={coverBase} />
            </aside>
          )}
        </div>
      </PublishWindow>

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
    <PublishWindow closeHref={`/studio/${releaseId}`}>
      <EmptyState title={copy.title} body={copy.body} action={<Button href={`/studio/${releaseId}`}>{WIZARD_UI.backToStudio}</Button>} />
    </PublishWindow>
  );
}

/** A new release; the prefill reads the creator profile, which lives in this browser. */
function NewEntry({ type, projectId }: { type: WizardType | null; projectId: string | null }) {
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
      <PublishWindow>
        <EmptyState title={DETAIL_UI.notFoundTitle} body={DETAIL_UI.notFoundBody} action={<Button href="/studio">{WIZARD_UI.backToStudio}</Button>} />
      </PublishWindow>
    );
  }
  if (typeof prepared === 'string') return <BlockedState reason={prepared} releaseId={releaseId} />;
  return <WizardForm init={prepared} />;
}

/**
 * The Publish window (PUBLISH-PROCEDURE §2–§3, RL §5): Type · Project · Details
 * · Files · Cover · Price · Review. `/publish` starts at Type, `/publish/[type]`
 * has it filled in, and `/studio/[releaseId]/edit` continues a draft or creates
 * a pending revision while the live version stays up. Behind the creator gate
 * (§1): without a verified creator profile it shows "Become a creator" instead.
 * Everything waits for hydration, because the draft and the profile live in
 * this browser.
 */
export default function PublishWizard(
  props: { mode: 'new'; type: WizardType | null; projectId: string | null } | { mode: 'edit'; releaseId: string; step: WizardStepId | null },
) {
  return (
    <CreatorGate closeHref={props.mode === 'edit' ? `/studio/${props.releaseId}` : '/studio'}>
      {props.mode === 'edit' ? <EditEntry releaseId={props.releaseId} step={props.step} /> : <NewEntry type={props.type} projectId={props.projectId} />}
    </CreatorGate>
  );
}
