/**
 * Strings from docs/v2/PUBLISH-PROCEDURE.md, the one Publish procedure the
 * website and the Vault share. That doc overrides older Publish wording in
 * RELEASE-LIFECYCLE and WEB-V2-SPEC, so where it names a label, a step or a
 * line, it is copied here word for word and the Vault uses the same text.
 * Short on purpose: one line per explanation, and never "AI" (§0).
 */
import type { WizardStepId } from './types.ts';

/** §2: the Publish steps. "type" is a UI step; the release's own steps keep RL's ids. */
export type PublishStepId = 'type' | WizardStepId;

export const PUBLISH_STEP_ORDER: readonly PublishStepId[] = [
  'type',
  'source',
  'details',
  'contents',
  'cover_preview',
  'license_price',
  'review_submit',
];

/** §2: "Type · Project · Details · Files · Cover · Price · Review", the same for every type. */
export const PUBLISH_STEP_LABELS: Readonly<Record<PublishStepId, string>> = {
  type: 'Type',
  source: 'Project',
  details: 'Details',
  contents: 'Files',
  cover_preview: 'Cover',
  license_price: 'Price',
  review_submit: 'Review',
};

/** §2 "Asks": the heading of each step's body. */
export const PUBLISH_STEP_ASKS: Readonly<Record<PublishStepId, string>> = {
  type: 'What are you publishing?',
  source: 'Which project is this from?',
  details: 'Details',
  contents: 'Which audio should listeners hear?',
  cover_preview: 'Cover, plus a preview or demo',
  license_price: 'Price and license',
  review_submit: 'Ready to submit?',
};

/** §3: the window around the steps. */
export const PUBLISH_WINDOW = {
  title: 'Publish',
  /** "{project} · {type}" before either is chosen. */
  newRelease: 'New release',
  creatorSubtitle: 'Creator profile',
  close: 'Back to Studio',
  stepsLabel: 'Publish steps',
} as const;

/** §2 footer, on both surfaces. */
export const PUBLISH_FOOTER = {
  back: 'Back',
  saveDraft: 'Save draft',
  next: 'Next',
  submit: 'Submit for review (demo)',
} as const;

/** §2 step 1. */
export const TYPE_STEP = {
  legend: 'Release type',
  songSubtitle: 'On Cadencea Stream, not the Market',
  comingLater: 'Coming later',
  themeNote: 'Made by Cadencea for now',
  fixed: 'Fixed for this draft.',
  pickOne: 'Pick what you are publishing.',
} as const;

/** §2 step 2. */
export const PROJECT_STEP = {
  lead: 'Choose one of your Vault projects. Publishing never changes it.',
  pickOne: 'Pick a Vault project.',
} as const;

/** §2 step 4. */
export const FILES_STEP = {
  mainAudio: 'Main audio',
  lossless: 'WAV or FLAC. Cadencea never converts it.',
  losslessBeat: 'WAV. Cadencea never converts it.',
  chooseOther: 'Choose a different file',
  keep: 'Keep this file',
  pick: 'Main audio file',
  contents: 'Contents',
} as const;

/** §2 step 7 and "After you submit". */
export const REVIEW_STEP = {
  fixOne: 'Fix 1 thing to submit',
  fixMany: 'Fix {n} things to submit',
  submitted: "Submitted. We'll review it within 1–2 days.",
  openInStudio: 'Open in Studio',
} as const;

/** §1: who can publish. */
export const CREATOR_COPY = {
  stepsLabel: 'Creator setup steps',
  steps: { profile: 'Profile', identity: 'Identity', payouts: 'Payouts', review: 'Review' },
  intro: {
    title: 'Become a creator',
    body: 'One verified profile per account, for the Market and Stream.',
    start: 'Start',
  },
  profile: {
    displayName: 'Display name',
    displayNameHint: 'Shown on your releases. 2–40 characters.',
    displayNameError: 'Use 2 to 40 characters.',
    handle: 'Handle',
    handleHint: '3–32 characters: a–z, 0–9, _ and -. Locked after your first approved release.',
    handleLocked: 'Locked: you already have an approved release.',
    handleError: 'Use 3 to 32 characters: a–z, 0–9, _ and -.',
    photo: 'Photo',
    photoOptional: 'Optional.',
    addPhoto: 'Add a demo photo',
    removePhoto: 'Remove photo',
    bio: 'Short bio',
    bioHint: 'Optional. {n} / 160.',
    bioError: 'Keep it to 160 characters.',
  },
  identity: {
    body: 'Verify your identity with Stripe. Cadencea never sees your ID.',
    button: 'Verify identity (demo)',
    working: 'Verifying…',
    done: 'Verified',
    needed: 'Verify your identity to continue.',
  },
  payouts: {
    country: 'Country',
    countryHint: 'EEA, UK, US, Canada or Switzerland.',
    countryPlaceholder: 'Pick a country',
    countryNeeded: 'Pick your country.',
    button: 'Connect payouts with Stripe (demo)',
    done: 'Connected',
    tax: 'Tax details are collected by Stripe.',
    needed: 'Connect payouts to continue.',
  },
  review: {
    summary: 'Your profile',
    checks: 'Account checks',
    checkItems: { email: 'Email verified', twoFactor: 'Two-factor on', accountAge: 'Account at least 7 days old' },
    submit: 'Submit for review',
    edit: 'Edit',
    noBio: 'No bio',
  },
  underReview: {
    title: "We're reviewing your profile. This usually takes 1–2 days.",
    approve: 'Approve now (demo)',
  },
  next: 'Next',
  back: 'Back',
  demo: {
    label: 'Demo',
    skip: 'Skip to verified (demo)',
    reset: 'Reset creator profile (demo)',
    resetToast: 'Demo: the creator profile is back at the start.',
    verifiedToast: 'Demo: your creator profile is verified.',
  },
} as const;
