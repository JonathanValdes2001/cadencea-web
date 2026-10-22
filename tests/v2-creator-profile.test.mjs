import { test } from 'node:test'
import assert from 'node:assert/strict'

// PUBLISH-PROCEDURE §1–§2: the creator gate in front of Publish and the one
// set of Publish steps the website and the Vault share.
import {
  ACCOUNT_CHECKS,
  CREATOR_SEED,
  CREATOR_STEPS,
  PAYOUT_COUNTRIES,
  approveProfile,
  connectPayouts,
  editProfile,
  firstOpenStep,
  goToStep,
  handleLocked,
  isCreatorVerified,
  profileErrors,
  skipToVerified,
  startSetup,
  stepComplete,
  submitProfile,
  verifyIdentity,
} from '../lib/v2-demo/release-lifecycle/creator.ts'
import {
  CREATOR_COPY,
  PUBLISH_FOOTER,
  PUBLISH_STEP_ASKS,
  PUBLISH_STEP_LABELS,
  PUBLISH_STEP_ORDER,
  TYPE_STEP,
} from '../lib/v2-demo/release-lifecycle/publish-copy.ts'
import { PREFILL_COPY } from '../lib/v2-demo/release-lifecycle/copy.ts'
import { RELEASE_TYPE_INFO } from '../lib/v2-demo/release-lifecycle/types.ts'
import { SEED_STATE } from '../lib/v2-demo/release-lifecycle/seeds.ts'
import { PERSONA } from '../lib/v2-demo/sellers.ts'

test('the demo person starts at "none", as Nightjar, and is not eligible to publish', () => {
  assert.equal(CREATOR_SEED.status, 'none')
  assert.equal(CREATOR_SEED.displayName, PERSONA.artistName)
  assert.equal(CREATOR_SEED.handle, PERSONA.sellerHandle)
  assert.equal(isCreatorVerified(CREATOR_SEED), false)
  assert.deepEqual(CREATOR_STEPS, ['profile', 'identity', 'payouts', 'review'])
  assert.ok(ACCOUNT_CHECKS.every((c) => c.met), 'all three account checks are met for the demo person')
})

test('none → in_progress → under_review → verified, one step at a time', () => {
  let p = startSetup(CREATOR_SEED)
  assert.equal(p.status, 'in_progress')
  assert.equal(p.step, 'profile')
  assert.ok(stepComplete(p, 'profile'), 'Nightjar and @nightjar are prefilled')
  assert.equal(firstOpenStep(p), 'identity')

  // Nothing can be submitted until identity and payouts are done.
  assert.equal(submitProfile(p), p)
  p = verifyIdentity(p)
  assert.ok(stepComplete(p, 'identity'))
  assert.equal(firstOpenStep(p), 'payouts')

  p = connectPayouts(p)
  assert.ok(p.payoutsConnected)
  assert.equal(firstOpenStep(p), null)

  p = submitProfile(p)
  assert.equal(p.status, 'under_review')
  assert.equal(isCreatorVerified(p), false)
  assert.equal(editProfile(p, { displayName: 'Changed' }), p, 'no edits while in review')

  p = approveProfile(p)
  assert.equal(p.status, 'verified')
  assert.ok(isCreatorVerified(p))
})

test('profile rules: display name 2–40, handle 3–32 of a–z 0–9 _ -, bio at most 160', () => {
  const p = startSetup(CREATOR_SEED)
  assert.deepEqual(profileErrors(p), [])
  assert.deepEqual(profileErrors(editProfile(p, { displayName: ' N ' })), ['displayName'])
  assert.deepEqual(profileErrors(editProfile(p, { displayName: 'x'.repeat(41) })), ['displayName'])
  assert.deepEqual(profileErrors(editProfile(p, { handle: 'ab' })), ['handle'])
  assert.deepEqual(profileErrors(editProfile(p, { handle: 'Night Jar' })), ['handle'])
  assert.deepEqual(profileErrors(editProfile(p, { handle: 'night_jar-2' })), [])
  assert.deepEqual(profileErrors(editProfile(p, { handle: 'x'.repeat(33) })), ['handle'])
  assert.deepEqual(profileErrors(editProfile(p, { bio: 'x'.repeat(160) })), [])
  assert.deepEqual(profileErrors(editProfile(p, { bio: 'x'.repeat(161) })), ['bio'])
  // An invalid profile sends Submit back to Profile.
  const broken = connectPayouts(verifyIdentity(editProfile(p, { displayName: '' })))
  assert.equal(firstOpenStep(broken), 'profile')
  assert.equal(submitProfile(broken), broken)
})

test('payouts need a supported country, and a new country needs connecting again', () => {
  const regions = new Set(PAYOUT_COUNTRIES.map((c) => c.region))
  assert.deepEqual([...regions].sort(), ['CA', 'CH', 'EEA', 'UK', 'US'])
  let p = verifyIdentity(startSetup(CREATOR_SEED))
  const none = editProfile(p, { country: '' })
  assert.equal(connectPayouts(none), none)
  p = connectPayouts(p)
  assert.ok(p.payoutsConnected)
  p = editProfile(p, { country: 'GB' })
  assert.equal(p.payoutsConnected, false)
  assert.equal(goToStep(p, 'review').step, 'review')
})

test('the handle locks after the first approved release', () => {
  assert.ok(handleLocked(SEED_STATE, PERSONA.userId), 'Nightjar has approved releases in the seeds')
  assert.equal(handleLocked(SEED_STATE, 'someone-new'), false)
})

test('the demo switch jumps to verified, keeping valid input', () => {
  const typed = editProfile(startSetup(CREATOR_SEED), { displayName: 'Maya Beats', handle: 'NOT VALID' })
  const p = skipToVerified(typed)
  assert.equal(p.status, 'verified')
  assert.equal(p.displayName, 'Maya Beats')
  assert.equal(p.handle, CREATOR_SEED.handle, 'an invalid handle falls back to the seed')
  assert.ok(p.identityVerified && p.payoutsConnected)
  assert.equal(skipToVerified(p), p)
  assert.equal(skipToVerified(CREATOR_SEED).status, 'verified')
})

test('Publish steps and labels are PUBLISH-PROCEDURE §2, word for word', () => {
  assert.deepEqual(
    PUBLISH_STEP_ORDER.map((s) => PUBLISH_STEP_LABELS[s]),
    ['Type', 'Project', 'Details', 'Files', 'Cover', 'Price', 'Review'],
  )
  assert.deepEqual(PUBLISH_STEP_ORDER, ['type', 'source', 'details', 'contents', 'cover_preview', 'license_price', 'review_submit'])
  assert.equal(PUBLISH_STEP_ASKS.type, 'What are you publishing?')
  assert.equal(PUBLISH_STEP_ASKS.source, 'Which project is this from?')
  assert.equal(PUBLISH_STEP_ASKS.contents, 'Which audio should listeners hear?')
  assert.equal(PUBLISH_STEP_ASKS.review_submit, 'Ready to submit?')
  assert.deepEqual(PUBLISH_FOOTER, { back: 'Back', saveDraft: 'Save draft', next: 'Next', submit: 'Submit for review (demo)' })
  assert.equal(TYPE_STEP.songSubtitle, 'On Cadencea Stream, not the Market')
  assert.equal(TYPE_STEP.comingLater, 'Coming later')
  assert.equal(TYPE_STEP.themeNote, 'Made by Cadencea for now')
  assert.deepEqual(Object.values(CREATOR_COPY.steps), ['Profile', 'Identity', 'Payouts', 'Review'])
  assert.equal(CREATOR_COPY.intro.title, 'Become a creator')
  assert.equal(CREATOR_COPY.underReview.title, "We're reviewing your profile. This usually takes 1–2 days.")
  assert.equal(CREATOR_COPY.demo.skip, 'Skip to verified (demo)')
  assert.equal(CREATOR_COPY.demo.reset, 'Reset creator profile (demo)')
  assert.deepEqual([PREFILL_COPY.fromProject, PREFILL_COPY.detected, PREFILL_COPY.needsInput], [
    'From your project',
    'Detected, please confirm',
    'Needs your input',
  ])
  // Songs stay a type, published to Stream only (D19).
  assert.deepEqual(RELEASE_TYPE_INFO.song.surfaces, ['stream'])
})

test('Publish copy never says "AI" (PUBLISH-PROCEDURE §0)', () => {
  const text = JSON.stringify({ CREATOR_COPY, PUBLISH_STEP_ASKS, PUBLISH_STEP_LABELS, PUBLISH_FOOTER, TYPE_STEP })
  assert.doesNotMatch(text, /\bAI\b/)
})
