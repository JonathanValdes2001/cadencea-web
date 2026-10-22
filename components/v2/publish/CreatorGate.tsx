'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/ui/CoverArt';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { ArrowRight, Check, Clock, User } from '@/components/ui/Icons';
import Stepper from '@/components/ui/Stepper';
import { useToast } from '@/components/ui/Toast';
import { useHydrated } from '@/components/v2/studio/useHydrated';
import { fill } from '@/lib/v2-demo/format';
import {
  ACCOUNT_CHECKS,
  BIO_MAX,
  CREATOR_SEED,
  CREATOR_STEPS,
  DISPLAY_NAME_MAX,
  HANDLE_MAX,
  PAYOUT_COUNTRIES,
  approveProfile,
  connectPayouts,
  creatorProfileStore,
  editProfile,
  firstOpenStep,
  goToStep,
  handleLocked,
  profileErrors,
  skipToVerified,
  startSetup,
  stepComplete,
  submitProfile,
  verifyIdentity,
  type CreatorProfile,
  type CreatorStepId,
} from '@/lib/v2-demo/release-lifecycle/creator';
import { CREATOR_COPY, PUBLISH_WINDOW } from '@/lib/v2-demo/release-lifecycle/publish-copy';
import { useLifecycle } from '@/lib/v2-demo/release-lifecycle/store';
import { PERSONA } from '@/lib/v2-demo/sellers';
import { useDemoStore } from '@/lib/v2-demo/use-demo-store';
import PublishWindow from './PublishWindow';

const C = CREATOR_COPY;
/** "Verify identity (demo)" waits about this long (§1 step 2). */
const VERIFY_MS = 1500;

const update = (fn: (p: CreatorProfile) => CreatorProfile) => creatorProfileStore.update(fn);

function Done({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <span role={live ? 'status' : undefined} className="flex items-center gap-1.5 text-sm font-semibold text-tone-success">
      <Check size={16} />
      {children}
    </span>
  );
}

function Avatar({ profile, size = 'w-16' }: { profile: CreatorProfile; size?: string }) {
  return (
    <div className={`${size} shrink-0`}>
      {profile.photo ? (
        <CoverArt seed={`creator-${profile.handle}`} kind="avatar" title={profile.displayName} decorative rounded="full" />
      ) : (
        <div aria-hidden="true" className="flex aspect-square w-full items-center justify-center rounded-full bg-elevated text-ink-subtle">
          <User size={24} />
        </div>
      )}
    </div>
  );
}

/* Steps ----------------------------------------------------------------- */

function ProfileStep({ profile, flagged, locked }: { profile: CreatorProfile; flagged: boolean; locked: boolean }) {
  const nameId = useId();
  const handleId = useId();
  const bioId = useId();
  const errors = flagged ? profileErrors(profile) : [];
  const P = C.profile;
  return (
    <div className="max-w-xl space-y-5">
      <TextField
        id={nameId}
        label={P.displayName}
        hint={P.displayNameHint}
        value={profile.displayName}
        maxLength={DISPLAY_NAME_MAX + 10}
        autoComplete="nickname"
        error={errors.includes('displayName') ? P.displayNameError : undefined}
        onChange={(e) => update((p) => editProfile(p, { displayName: e.target.value }))}
      />
      {locked ? (
        <TextField id={handleId} label={P.handle} value={`@${profile.handle}`} readOnly hint={P.handleLocked} />
      ) : (
        <TextField
          id={handleId}
          label={P.handle}
          hint={P.handleHint}
          value={profile.handle}
          maxLength={HANDLE_MAX + 10}
          autoCapitalize="none"
          spellCheck={false}
          error={errors.includes('handle') ? P.handleError : undefined}
          onChange={(e) => update((p) => editProfile(p, { handle: e.target.value }))}
        />
      )}
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">
          {P.photo} <span className="font-normal text-ink-subtle">· {P.photoOptional}</span>
        </p>
        <div className="flex items-center gap-4">
          <Avatar profile={profile} />
          <Button size="sm" variant="secondary" onClick={() => update((p) => editProfile(p, { photo: !p.photo }))}>
            {profile.photo ? P.removePhoto : P.addPhoto}
          </Button>
        </div>
      </div>
      <TextAreaField
        id={bioId}
        label={P.bio}
        rows={3}
        hint={fill(P.bioHint, { n: profile.bio.length })}
        value={profile.bio}
        maxLength={BIO_MAX + 40}
        error={errors.includes('bio') ? P.bioError : undefined}
        onChange={(e) => update((p) => editProfile(p, { bio: e.target.value }))}
      />
    </div>
  );
}

function IdentityStep({ profile, flagged }: { profile: CreatorProfile; flagged: boolean }) {
  const [working, setWorking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const verify = () => {
    setWorking(true);
    timer.current = setTimeout(() => {
      update(verifyIdentity);
      setWorking(false);
    }, VERIFY_MS);
  };
  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-ink-muted">{C.identity.body}</p>
      {profile.identityVerified ? (
        <Done live>{C.identity.done}</Done>
      ) : (
        <>
          <Button onClick={verify} loading={working}>
            {working ? C.identity.working : C.identity.button}
          </Button>
          {flagged && !working && <p className="text-xs font-medium text-danger">{C.identity.needed}</p>}
        </>
      )}
    </div>
  );
}

function PayoutsStep({ profile, flagged }: { profile: CreatorProfile; flagged: boolean }) {
  const countryId = useId();
  const P = C.payouts;
  const hasCountry = PAYOUT_COUNTRIES.some((c) => c.code === profile.country);
  return (
    <div className="max-w-xl space-y-5">
      <SelectField
        id={countryId}
        label={P.country}
        hint={P.countryHint}
        value={profile.country}
        error={flagged && !hasCountry ? P.countryNeeded : undefined}
        onChange={(e) => update((p) => editProfile(p, { country: e.target.value }))}
        options={[{ value: '', label: P.countryPlaceholder }, ...PAYOUT_COUNTRIES.map((c) => ({ value: c.code, label: c.label }))]}
      />
      {profile.payoutsConnected ? (
        <Done live>{P.done}</Done>
      ) : (
        <div>
          <Button variant="secondary" disabled={!hasCountry} onClick={() => update(connectPayouts)}>
            {P.button}
          </Button>
          {flagged && hasCountry && <p className="mt-1.5 text-xs font-medium text-danger">{P.needed}</p>}
        </div>
      )}
      <p className="text-xs text-ink-subtle">{P.tax}</p>
    </div>
  );
}

function ProfileSummary({ profile, onEdit }: { profile: CreatorProfile; onEdit?: (step: CreatorStepId) => void }) {
  const country = PAYOUT_COUNTRIES.find((c) => c.code === profile.country)?.label ?? '—';
  const rows: [CreatorStepId, string, React.ReactNode][] = [
    ['profile', C.profile.displayName, profile.displayName.trim() || '—'],
    ['profile', C.profile.handle, `@${profile.handle}`],
    ['profile', C.profile.bio, profile.bio.trim() || <span className="text-ink-subtle">{C.review.noBio}</span>],
    ['identity', C.steps.identity, profile.identityVerified ? <Done>{C.identity.done}</Done> : '—'],
    ['payouts', C.steps.payouts, profile.payoutsConnected ? <Done>{`${C.payouts.done} · ${country}`}</Done> : country],
  ];
  return (
    <section aria-labelledby="creator-summary" className="rounded-md border border-line p-4">
      <div className="flex items-center gap-3">
        <Avatar profile={profile} size="w-12" />
        <h3 id="creator-summary" className="text-sm font-semibold text-ink">
          {C.review.summary}
        </h3>
      </div>
      <dl className="mt-4 divide-y divide-line text-sm">
        {rows.map(([step, label, value]) => (
          <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-start gap-3 py-2.5">
            <dt className="text-ink-subtle">{label}</dt>
            <dd className="min-w-0 break-words text-ink">{value}</dd>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(step)}
                className="text-sm font-medium text-accent-ink underline-offset-2 hover:underline"
                aria-label={`${C.review.edit} ${label}`}
              >
                {C.review.edit}
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

function AccountChecks() {
  return (
    <section aria-labelledby="creator-checks">
      <h3 id="creator-checks" className="text-sm font-semibold text-ink">
        {C.review.checks}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {ACCOUNT_CHECKS.map((check) => (
          <li key={check.id} className="flex items-center gap-2 text-sm text-ink">
            <Check size={16} className="text-tone-success" />
            {C.review.checkItems[check.id]}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* The window ------------------------------------------------------------ */

function Intro() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center md:py-10">
      <div className="w-16">
        <CoverArt seed={PERSONA.sellerHandle} kind="avatar" title={PERSONA.personName} decorative rounded="full" />
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink">{C.intro.title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{C.intro.body}</p>
      <ol className="mt-6 flex flex-wrap justify-center gap-2" aria-label={C.stepsLabel}>
        {CREATOR_STEPS.map((step, i) => (
          <li key={step} className="inline-flex h-9 items-center gap-2 rounded-sm border border-line px-3 text-sm text-ink-muted">
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold">
              {i + 1}
            </span>
            {C.steps[step]}
          </li>
        ))}
      </ol>
      <Button className="mt-8" size="lg" onClick={() => update(startSetup)} iconRight={<ArrowRight size={16} />}>
        {C.intro.start}
      </Button>
    </div>
  );
}

function UnderReview({ profile }: { profile: CreatorProfile }) {
  const toast = useToast();
  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div className="flex items-start gap-3 rounded-md bg-tone-info-bg px-4 py-3 text-sm text-tone-info">
        <Clock size={20} className="mt-0.5 shrink-0" />
        <p className="font-medium">{C.underReview.title}</p>
      </div>
      <ProfileSummary profile={profile} />
      <Button
        onClick={() => {
          update(approveProfile);
          toast.show(C.demo.verifiedToast);
        }}
      >
        {C.underReview.approve}
      </Button>
    </div>
  );
}

function Setup({ profile, closeHref }: { profile: CreatorProfile; closeHref: string }) {
  const state = useLifecycle();
  const locked = handleLocked(state, PERSONA.userId);
  const [flagged, setFlagged] = useState<ReadonlySet<CreatorStepId>>(() => new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const step = profile.step;
  const index = CREATOR_STEPS.indexOf(step);
  const last = index === CREATOR_STEPS.length - 1;

  const go = (next: CreatorStepId) => {
    update((p) => goToStep(p, next));
    bodyRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const flag = (s: CreatorStepId) => setFlagged((f) => new Set(f).add(s));
  const next = () => {
    // Next flags what's missing on the step it leaves and stays there (like Publish, §2).
    flag(step);
    if (!stepComplete(profile, step)) return;
    go(CREATOR_STEPS[index + 1]);
  };
  const submit = () => {
    const open = firstOpenStep(profile);
    if (open) {
      flag(open);
      go(open);
      return;
    }
    update(submitProfile);
  };

  const issues = Object.fromEntries(
    CREATOR_STEPS.map((s) => [s, flagged.has(s) && s !== 'review' && !stepComplete(profile, s) ? 1 : 0]),
  );
  const completed = CREATOR_STEPS.filter((s) => s !== 'review' && stepComplete(profile, s));

  let body: React.ReactNode;
  if (step === 'profile') body = <ProfileStep profile={profile} flagged={flagged.has('profile')} locked={locked} />;
  else if (step === 'identity') body = <IdentityStep profile={profile} flagged={flagged.has('identity')} />;
  else if (step === 'payouts') body = <PayoutsStep profile={profile} flagged={flagged.has('payouts')} />;
  else {
    body = (
      <div className="max-w-xl space-y-6">
        <ProfileSummary profile={profile} onEdit={go} />
        <AccountChecks />
      </div>
    );
  }

  return (
    <PublishWindow
      subtitle={PUBLISH_WINDOW.creatorSubtitle}
      closeHref={closeHref}
      bodyRef={bodyRef}
      stepper={
        <Stepper
          steps={CREATOR_STEPS.map((id) => ({ id, label: C.steps[id] }))}
          current={step}
          completed={completed}
          issues={issues}
          onStepClick={(id) => go(id as CreatorStepId)}
          label={C.stepsLabel}
        />
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => go(CREATOR_STEPS[Math.max(index - 1, 0)])} disabled={index === 0}>
            {C.back}
          </Button>
          <div className="ml-auto">
            {last ? (
              <Button onClick={submit} iconRight={<ArrowRight size={16} />}>
                {C.review.submit}
              </Button>
            ) : (
              <Button onClick={next} iconRight={<ArrowRight size={16} />}>
                {C.next}
              </Button>
            )}
          </div>
        </>
      }
    >
      <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-xl font-bold tracking-tight text-ink focus:outline-none">
        {C.steps[step]}
      </h2>
      {body}
    </PublishWindow>
  );
}

/**
 * "Become a creator" (PUBLISH-PROCEDURE §1), in the Publish window in place of
 * the Publish steps until the creator profile is verified. Waits for
 * hydration: the profile lives in this browser.
 */
export default function CreatorGate({ closeHref = '/studio', children }: { closeHref?: string; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const profile = useDemoStore(creatorProfileStore);
  if (!hydrated) {
    return (
      <PublishWindow closeHref={closeHref}>
        <div aria-busy="true" className="h-full" />
      </PublishWindow>
    );
  }
  if (profile.status === 'verified') return <>{children}</>;
  if (profile.status === 'in_progress') return <Setup profile={profile} closeHref={closeHref} />;
  return (
    <PublishWindow subtitle={PUBLISH_WINDOW.creatorSubtitle} closeHref={closeHref}>
      {profile.status === 'none' ? <Intro /> : <UnderReview profile={profile} />}
    </PublishWindow>
  );
}

/** A small on/off switch on the design tokens. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-inset'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 rounded-full bg-canvas shadow-dropdown transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm text-ink">
        {label}
      </label>
    </div>
  );
}

/** Resets the creator profile to the demo person's start (`none`). Also used by Studio. */
export function resetCreatorProfile(): void {
  creatorProfileStore.reset();
}

/**
 * The demo controls under the Publish window (§1 "Demo switch"): "Skip to
 * verified (demo)" and "Reset creator profile (demo)". Switching the skip off
 * goes back to the start too.
 */
export function CreatorDemoControls({ className = '' }: { className?: string }) {
  const hydrated = useHydrated();
  const profile = useDemoStore(creatorProfileStore);
  const toast = useToast();
  const verified = hydrated && profile.status === 'verified';
  const reset = () => {
    resetCreatorProfile();
    toast.show(C.demo.resetToast);
  };
  const untouched = hydrated && JSON.stringify(profile) === JSON.stringify(CREATOR_SEED);
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      <Badge tone="demo">{C.demo.label}</Badge>
      <Switch
        checked={verified}
        label={C.demo.skip}
        onChange={(on) => {
          if (on) {
            update(skipToVerified);
            toast.show(C.demo.verifiedToast);
          } else reset();
        }}
      />
      <Button size="sm" variant="ghost" onClick={reset} disabled={!hydrated || untouched}>
        {C.demo.reset}
      </Button>
    </div>
  );
}
