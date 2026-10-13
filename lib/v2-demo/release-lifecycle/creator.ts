/**
 * The creator profile (PUBLISH-PROCEDURE §1): nobody publishes without a
 * verified one. Once per account, shared by Market sellers and Stream artists.
 *
 * none → in_progress (Profile · Identity · Payouts · Review) → under_review →
 * verified. The demo person starts at `none` so the gate can be tried; "Skip to
 * verified (demo)" and "Reset creator profile (demo)" jump straight to either
 * end. Pure transitions plus one demo store, so pages, the reducer guard
 * (`create_release.sellerEligible`) and tests agree. No payment or identity
 * provider is called: identity and payouts are demo buttons.
 */
import type { Id, LifecycleState } from './types.ts';
import { createDemoStore, DEMO_STORAGE_KEYS } from '../storage.ts';
import { PERSONA } from '../sellers.ts';

export const CREATOR_STATUSES = ['none', 'in_progress', 'under_review', 'verified'] as const;
export type CreatorStatus = (typeof CREATOR_STATUSES)[number];

export const CREATOR_STEPS = ['profile', 'identity', 'payouts', 'review'] as const;
export type CreatorStepId = (typeof CREATOR_STEPS)[number];

export type PayoutRegion = 'EEA' | 'UK' | 'US' | 'CA' | 'CH';

/** Where payouts can go (§1 step 3): the EEA, the UK, the US, Canada and Switzerland. */
export const PAYOUT_COUNTRIES: readonly { code: string; label: string; region: PayoutRegion }[] = [
  { code: 'NO', label: 'Norway', region: 'EEA' },
  { code: 'SE', label: 'Sweden', region: 'EEA' },
  { code: 'DK', label: 'Denmark', region: 'EEA' },
  { code: 'FI', label: 'Finland', region: 'EEA' },
  { code: 'IS', label: 'Iceland', region: 'EEA' },
  { code: 'DE', label: 'Germany', region: 'EEA' },
  { code: 'NL', label: 'Netherlands', region: 'EEA' },
  { code: 'FR', label: 'France', region: 'EEA' },
  { code: 'ES', label: 'Spain', region: 'EEA' },
  { code: 'IT', label: 'Italy', region: 'EEA' },
  { code: 'IE', label: 'Ireland', region: 'EEA' },
  { code: 'PL', label: 'Poland', region: 'EEA' },
  { code: 'GB', label: 'United Kingdom', region: 'UK' },
  { code: 'US', label: 'United States', region: 'US' },
  { code: 'CA', label: 'Canada', region: 'CA' },
  { code: 'CH', label: 'Switzerland', region: 'CH' },
];

export interface CreatorProfile {
  status: CreatorStatus;
  /** Where setup resumes while `in_progress`. */
  step: CreatorStepId;
  displayName: string;
  handle: string;
  /** Demo: a generated avatar stands in for an uploaded photo. */
  photo: boolean;
  bio: string;
  identityVerified: boolean;
  /** A PAYOUT_COUNTRIES code, or '' before one is picked. */
  country: string;
  payoutsConnected: boolean;
}

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 32;
export const HANDLE_PATTERN = /^[a-z0-9_-]+$/;
export const BIO_MAX = 160;

/** Maya Lind, releasing as Nightjar (DECISIONS.md D1), at `none`. Tromsø, so Norway is prefilled. */
export const CREATOR_SEED: CreatorProfile = {
  status: 'none',
  step: 'profile',
  displayName: PERSONA.artistName,
  handle: PERSONA.sellerHandle,
  photo: false,
  bio: '',
  identityVerified: false,
  country: 'NO',
  payoutsConnected: false,
};

/** §1 step 4: all three are met for the demo person. */
export const ACCOUNT_CHECKS: readonly { id: 'email' | 'twoFactor' | 'accountAge'; met: boolean }[] = [
  { id: 'email', met: true },
  { id: 'twoFactor', met: true },
  { id: 'accountAge', met: true },
];

export const creatorProfileStore = createDemoStore<CreatorProfile>({
  key: DEMO_STORAGE_KEYS.creatorProfile,
  version: '1',
  seed: CREATOR_SEED,
});

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

export function isCreatorVerified(profile: CreatorProfile): boolean {
  return profile.status === 'verified';
}

/** The handle locks after the first approved release (ADR-0042 `handle_locked`). */
export function handleLocked(state: LifecycleState, userId: Id): boolean {
  return Object.values(state.releases).some((r) => r.sellerId === userId && r.firstLiveAt !== null);
}

export type ProfileField = 'displayName' | 'handle' | 'bio';

/** Which Profile fields are wrong; the copy lives with the form. */
export function profileErrors(profile: CreatorProfile): ProfileField[] {
  const errors: ProfileField[] = [];
  const name = profile.displayName.trim();
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) errors.push('displayName');
  const handle = profile.handle;
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX || !HANDLE_PATTERN.test(handle)) errors.push('handle');
  if (profile.bio.length > BIO_MAX) errors.push('bio');
  return errors;
}

/** True when a setup step is done. Review is done once submitted. */
export function stepComplete(profile: CreatorProfile, step: CreatorStepId): boolean {
  switch (step) {
    case 'profile':
      return profileErrors(profile).length === 0;
    case 'identity':
      return profile.identityVerified;
    case 'payouts':
      return profile.payoutsConnected && PAYOUT_COUNTRIES.some((c) => c.code === profile.country);
    case 'review':
      return profile.status === 'under_review' || profile.status === 'verified';
  }
}

/** The first step that still needs something, or null when the profile can be submitted. */
export function firstOpenStep(profile: CreatorProfile): CreatorStepId | null {
  return CREATOR_STEPS.slice(0, 3).find((s) => !stepComplete(profile, s)) ?? null;
}

/* ------------------------------------------------------------------ */
/* Transitions (pure; each returns the same object when nothing applies) */
/* ------------------------------------------------------------------ */

/** "Start": from the intro into setup at Profile. Later visits resume at `step`. */
export function startSetup(profile: CreatorProfile): CreatorProfile {
  if (profile.status !== 'none') return profile;
  return { ...profile, status: 'in_progress', step: 'profile' };
}

/** Edits during setup. Status and the demo checks can't be set this way. */
export function editProfile(
  profile: CreatorProfile,
  patch: Partial<Pick<CreatorProfile, 'displayName' | 'handle' | 'photo' | 'bio' | 'country'>>,
): CreatorProfile {
  if (profile.status !== 'in_progress') return profile;
  const next = { ...profile, ...patch };
  // A different country needs payouts connected again.
  if (patch.country !== undefined && patch.country !== profile.country) next.payoutsConnected = false;
  return next;
}

export function goToStep(profile: CreatorProfile, step: CreatorStepId): CreatorProfile {
  if (profile.status !== 'in_progress' || profile.step === step) return profile;
  return { ...profile, step };
}

/** "Verify identity (demo)" (§1 step 2). */
export function verifyIdentity(profile: CreatorProfile): CreatorProfile {
  if (profile.status !== 'in_progress' || profile.identityVerified) return profile;
  return { ...profile, identityVerified: true };
}

/** The payouts demo button (§1 step 3): needs a supported country. */
export function connectPayouts(profile: CreatorProfile): CreatorProfile {
  if (profile.status !== 'in_progress' || !PAYOUT_COUNTRIES.some((c) => c.code === profile.country)) return profile;
  return profile.payoutsConnected ? profile : { ...profile, payoutsConnected: true };
}

/** "Submit for review" (§1 step 4): only with every step done and every account check met. */
export function submitProfile(profile: CreatorProfile): CreatorProfile {
  if (profile.status !== 'in_progress' || firstOpenStep(profile) !== null) return profile;
  if (!ACCOUNT_CHECKS.every((c) => c.met)) return profile;
  return { ...profile, status: 'under_review', step: 'review', displayName: profile.displayName.trim() };
}

/** "Approve now (demo)". */
export function approveProfile(profile: CreatorProfile): CreatorProfile {
  if (profile.status !== 'under_review') return profile;
  return { ...profile, status: 'verified' };
}

/** "Skip to verified (demo)": every step done, keeping what was typed when it is valid. */
export function skipToVerified(profile: CreatorProfile): CreatorProfile {
  if (profile.status === 'verified') return profile;
  const errors = profileErrors(profile);
  return {
    ...profile,
    status: 'verified',
    step: 'review',
    displayName: errors.includes('displayName') ? CREATOR_SEED.displayName : profile.displayName.trim(),
    handle: errors.includes('handle') ? CREATOR_SEED.handle : profile.handle,
    bio: profile.bio.slice(0, BIO_MAX),
    identityVerified: true,
    country: PAYOUT_COUNTRIES.some((c) => c.code === profile.country) ? profile.country : CREATOR_SEED.country,
    payoutsConnected: true,
  };
}
