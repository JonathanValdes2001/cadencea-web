import { test } from 'node:test'
import assert from 'node:assert/strict'

// RELEASE-LIFECYCLE §4.6 and §7.6: the reducer behind Studio and Publish. Every
// rule in TRANSITIONS is exercised from a state it lists, unlisted states and
// wrong actors are refused, and the lifecycle rules (L1, L4, L12, L17, L19),
// appeals and the change summary behave as the spec says. Loaded through Node's
// type stripping, like the other v2 tests.
import { TRANSITIONS, isPublic } from '../lib/v2-demo/release-lifecycle/types.ts'
import { applyAction } from '../lib/v2-demo/release-lifecycle/machine.ts'
import { SEED_STATE } from '../lib/v2-demo/release-lifecycle/seeds.ts'
import { diffRevision } from '../lib/v2-demo/release-lifecycle/diff.ts'
import { validateSubmission } from '../lib/v2-demo/release-lifecycle/validation.ts'
import { buildEvidence, findProject, prefillPayload } from '../lib/v2-demo/release-lifecycle/vault-projects.ts'
import { demoCover } from '../lib/v2-demo/release-lifecycle/demo-files.ts'
import { publicHrefFor, releaseActions } from '../lib/v2-demo/release-lifecycle/actions.ts'
import { demoEarnings } from '../lib/v2-demo/release-lifecycle/earnings.ts'
import { publicListings, releaseView, sellerTimeline, tabCounts, toPublicView } from '../lib/v2-demo/release-lifecycle/selectors.ts'
import { getItem } from '../lib/v2-demo/market/items.ts'
import { addDays, DEMO_NOW, toIso } from '../lib/v2-demo/clock.ts'

const SELLER = { kind: 'seller', userId: 'demo-maya' }
const OTHER_SELLER = { kind: 'seller', userId: 'someone-else' }
const REVIEWER = { kind: 'reviewer', reviewerId: 'demo-reviewer' }
const APPEAL_REVIEWER = { kind: 'reviewer', reviewerId: 'demo-reviewer-2' }
const SYSTEM = { kind: 'system', process: 'demo_simulator' }
const ATTESTATION = {
  standardVersion: 'human-made-2026-10',
  madeByMe: true,
  noGeneratedAudio: true,
  licensedMaterialListed: true,
  coverRights: true,
  falseStatementConsequences: true,
  acceptedAt: null,
}

let tick = 0
/** Demo time, one second per action, like the store's dispatch. */
const next = () => toIso(Date.parse(DEMO_NOW) + ++tick * 1000)
const id = (n) => `demo-r${String(n).padStart(2, '0')}`
const clone = (value) => JSON.parse(JSON.stringify(value))

function apply(state, action, actor = SELLER, now = next()) {
  return applyAction(state, action, actor, now)
}

function ok(state, action, actor = SELLER, now = next()) {
  const result = apply(state, action, actor, now)
  assert.ok(result.ok, `${action.type} failed: ${result.error} ${JSON.stringify(result.issues ?? '')}`)
  // Events are appended, never edited (§4.4 invariant 9).
  assert.deepEqual(result.state.events.slice(0, state.events.length), state.events)
  return result.state
}

function refused(state, action, actor, error, now = next()) {
  const result = apply(state, action, actor, now)
  assert.equal(result.ok, false, `${action.type} should be refused`)
  assert.equal(result.error, error)
}

function statement(restriction, code, issuedAt = DEMO_NOW) {
  return {
    restriction,
    reasons: [{ code, message: 'A reason the test gives.' }],
    facts: 'What the test found.',
    ground: { kind: 'terms', clause: 'Cadencea Content Policy' },
    automatedDetection: false,
    appealUntil: addDays(issuedAt, 183),
    issuedAt,
  }
}

const open = (state, releaseId) => state.revisions[state.releases[releaseId].openRevisionId]
const current = (state, releaseId) => state.revisions[state.releases[releaseId].currentRevisionId]
const lastCaseOf = (state, revision) => revision.caseIds[revision.caseIds.length - 1]
const openAppeal = (state, releaseId) => Object.values(state.appeals).find((a) => a.releaseId === releaseId && a.status === 'open')
const lastEvent = (state) => state.events[state.events.length - 1]

/* ------------------------------------------------------------------ */
/* Rule coverage                                                       */
/* ------------------------------------------------------------------ */

const covered = new Set()

/**
 * Applies an action that must match rule `ruleId`: the fixture is in one of the
 * rule's `from` states, and the result is in its `to` states.
 */
function viaRule(ruleId, state, action, actor, { releaseId, revisionId } = {}) {
  const rule = TRANSITIONS.find((r) => r.id === ruleId)
  assert.ok(rule, `unknown rule ${ruleId}`)
  assert.ok(rule.actors.includes(actor.kind), `${ruleId} doesn't allow ${actor.kind}`)
  const releaseBefore = releaseId ? state.releases[releaseId] : null
  const revisionBefore = revisionId ? state.revisions[revisionId] : null
  assert.ok(rule.release.from.includes(releaseBefore?.status ?? 'none'), `${ruleId} from release ${releaseBefore?.status}`)
  assert.ok(rule.revision.from.includes(revisionBefore?.status ?? 'none'), `${ruleId} from revision ${revisionBefore?.status}`)

  const after = ok(state, action, actor)
  const rid = releaseId ?? Object.keys(after.releases).find((k) => !state.releases[k])
  const releaseAfter = after.releases[rid]
  if (rule.release.to === 'unchanged') assert.equal(releaseAfter.status, releaseBefore.status, `${ruleId} release`)
  else if (rule.release.to === 'deleted') assert.equal(releaseAfter, undefined, `${ruleId} deletes`)
  else if (rule.release.to === 'restore') assert.equal(releaseAfter.status, releaseBefore.suspension.restoreTo, `${ruleId} restores`)
  else assert.equal(releaseAfter.status, rule.release.to, `${ruleId} release`)

  const revisionAfter = revisionId
    ? after.revisions[revisionId]
    : releaseAfter?.openRevisionId && !state.revisions[releaseAfter.openRevisionId]
      ? after.revisions[releaseAfter.openRevisionId]
      : null
  if (revisionAfter && rule.revision.to !== 'unchanged') assert.equal(revisionAfter.status, rule.revision.to, `${ruleId} revision`)
  if (revisionAfter && revisionBefore && rule.revision.to === 'unchanged') {
    assert.equal(revisionAfter.status, revisionBefore.status, `${ruleId} revision unchanged`)
  }
  covered.add(ruleId)
  return after
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function newSamplePack(state) {
  const project = findProject('saltmarsh-kit')
  const payload = { ...prefillPayload(project, 'sample_pack', { displayName: 'Nightjar', personName: 'Maya Lind', userId: 'demo-maya' }, DEMO_NOW), genre: 'Downtempo' }
  const source = { vaultId: 'demo-vault-nightjar', projectName: project.name, pushedAtCapture: true, capturedAt: DEMO_NOW }
  const after = viaRule('T01', state, { type: 'create_release', releaseType: 'sample_pack', source, payload, sellerEligible: true }, SELLER)
  const releaseId = Object.keys(after.releases).find((k) => !state.releases[k])
  return { state: after, releaseId, evidence: buildEvidence(project, DEMO_NOW, null) }
}

/** Untitled Loop Kit (R5) fixed as in §7.5 step 5: 20 files and a confirmed key. */
function fixedR05(state) {
  const project = findProject('untitled-loop-kit')
  const revision = open(state, id(5))
  const payload = {
    ...revision.payload,
    samples: project.files.filter((f) => f.path.startsWith('Loops/')),
    contents: { oneShots: 0, loops: 20 },
    key: { ...revision.payload.key, confirmed: true },
  }
  return { state: ok(state, { type: 'save_draft', releaseId: id(5), payload }), evidence: buildEvidence(project, DEMO_NOW, null) }
}

function submitR13Update(state) {
  return viaRule('T04', state, { type: 'submit', releaseId: id(13), attestation: ATTESTATION, evidence: current(state, id(13)).evidence }, SELLER, {
    releaseId: id(13),
    revisionId: open(state, id(13)).id,
  })
}

/* ------------------------------------------------------------------ */
/* Seller rules                                                        */
/* ------------------------------------------------------------------ */

test('T01 creates a draft release with revision #1 and no Market slug clash', () => {
  const { state, releaseId } = newSamplePack(SEED_STATE)
  const release = state.releases[releaseId]
  assert.equal(release.status, 'draft')
  assert.equal(release.sellerHandle, 'nightjar')
  assert.equal(release.slug, 'saltmarsh-kit')
  assert.equal(open(state, releaseId).seq, 1)
  assert.equal(lastEvent(state).type, 'release_created')
})

test('T02 saves drafts in every state it lists, and coalesces draft_saved', () => {
  let state = SEED_STATE
  const r5 = open(state, id(5))
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(5), payload: { ...r5.payload, title: 'Tromsø Loops' } }, SELLER, { releaseId: id(5), revisionId: r5.id })
  assert.equal(state.releases[id(5)].slug, 'tromso-loops', 'a never-approved release follows its title')
  const before = state.events.length
  state = ok(state, { type: 'save_draft', releaseId: id(5), payload: { ...r5.payload, title: 'Tromsø Loops 2' } })
  assert.equal(state.events.length, before, 'draft_saved is coalesced')

  const r4 = open(state, id(4))
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(4), payload: r4.payload }, SELLER, { releaseId: id(4), revisionId: r4.id })
  const r13 = open(state, id(13))
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(13), payload: r13.payload, changeNote: r13.changeNote }, SELLER, { releaseId: id(13), revisionId: r13.id })
  assert.equal(state.releases[id(13)].slug, 'kitchen-percussion', 'the slug is fixed after first approval (L8)')
  const r7 = open(state, id(7))
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(7), payload: r7.payload }, SELLER, { releaseId: id(7), revisionId: r7.id })

  // Unpublished with an update draft, and suspended with an update draft (save only, §6.4).
  state = viaRule('T07', state, { type: 'start_update', releaseId: id(9) }, SELLER, { releaseId: id(9) })
  const r9 = open(state, id(9))
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(9), payload: { ...r9.payload, price: { kind: 'credits', credits: 40 } } }, SELLER, { releaseId: id(9), revisionId: r9.id })
  state = ok(state, { type: 'suspend', releaseId: id(13), statement: statement('suspended', 'copyright_claim'), disableDownloads: false }, REVIEWER)
  state = viaRule('T02', state, { type: 'save_draft', releaseId: id(13), payload: r13.payload }, SELLER, { releaseId: id(13), revisionId: r13.id })
})

test('T03 submits a first release once validation, attestation and evidence pass (R5, §7.5 step 5)', () => {
  const r5 = open(SEED_STATE, id(5))
  const issues = validateSubmission(r5.payload, { now: DEMO_NOW, attestation: null, evidence: buildEvidence(findProject('untitled-loop-kit'), DEMO_NOW, null) })
  assert.deepEqual(issues.map((i) => i.code).sort(), ['attestation_needed', 'confirm_detected', 'min_count'], 'Fix 3 things to submit')
  refused(SEED_STATE, { type: 'submit', releaseId: id(5), attestation: ATTESTATION, evidence: null }, SELLER, 'validation_failed')

  const { state: fixed, evidence } = fixedR05(SEED_STATE)
  const state = viaRule('T03', fixed, { type: 'submit', releaseId: id(5), attestation: ATTESTATION, evidence }, SELLER, { releaseId: id(5), revisionId: open(fixed, id(5)).id })
  const revision = open(state, id(5))
  assert.equal(revision.attestation.acceptedAt !== null, true)
  const reviewCase = state.cases[lastCaseOf(state, revision)]
  assert.equal(reviewCase.kind, 'new_release')
  assert.equal(reviewCase.status, 'queued')
  assert.equal(reviewCase.depth, 'standard')
})

test('T04 submits an update from live and unpublished; an empty change or note is refused', () => {
  let state = submitR13Update(SEED_STATE)
  const reviewCase = state.cases[lastCaseOf(state, open(state, id(13)))]
  assert.equal(reviewCase.kind, 'update')
  assert.equal(reviewCase.depth, 'standard')

  state = viaRule('T07', SEED_STATE, { type: 'start_update', releaseId: id(9) }, SELLER, { releaseId: id(9) })
  refused(state, { type: 'submit', releaseId: id(9), attestation: ATTESTATION, evidence: current(state, id(9)).evidence }, SELLER, 'nothing_changed')
  const r9 = open(state, id(9))
  state = ok(state, { type: 'save_draft', releaseId: id(9), payload: { ...r9.payload, price: { kind: 'credits', credits: 40 } } })
  const noNote = apply(state, { type: 'submit', releaseId: id(9), attestation: ATTESTATION, evidence: current(state, id(9)).evidence })
  assert.equal(noNote.ok, false)
  assert.ok(noNote.issues.some((i) => i.code === 'change_note_length'))
  state = ok(state, { type: 'save_draft', releaseId: id(9), payload: { ...r9.payload, price: { kind: 'credits', credits: 40 } }, changeNote: 'Lowered the price for the relaunch.' })
  viaRule('T04', state, { type: 'submit', releaseId: id(9), attestation: ATTESTATION, evidence: current(state, id(9)).evidence }, SELLER, { releaseId: id(9), revisionId: r9.id })
})

test('T05 moves a queued submission back to draft, never once review started', () => {
  viaRule('T05a', SEED_STATE, { type: 'pull_back', releaseId: id(3) }, SELLER, { releaseId: id(3), revisionId: open(SEED_STATE, id(3)).id })
  const state = viaRule('T05b', SEED_STATE, { type: 'pull_back', releaseId: id(2) }, SELLER, { releaseId: id(2), revisionId: open(SEED_STATE, id(2)).id })
  assert.equal(state.cases['case-r02-3'].status, 'dismissed')
  refused(SEED_STATE, { type: 'pull_back', releaseId: id(12) }, SELLER, 'review_already_started')
})

test('T06 resubmits after a change or with a reply', () => {
  const r4 = open(SEED_STATE, id(4))
  refused(SEED_STATE, { type: 'resubmit', releaseId: id(4), replyToReviewer: null }, SELLER, 'nothing_changed')
  const demo = findProject('fog-choir-pads').files.find((f) => f.path === 'Fog Choir Pads demo.wav')
  let state = ok(SEED_STATE, { type: 'save_draft', releaseId: id(4), payload: { ...r4.payload, demo, minSynthVersion: '2.0' } })
  state = viaRule('T06a', state, { type: 'resubmit', releaseId: id(4), replyToReviewer: 'Added the demo and fixed the version.' }, SELLER, { releaseId: id(4), revisionId: r4.id })
  assert.equal(open(state, id(4)).replyToReviewer, 'Added the demo and fixed the version.')

  // §7.5 step 8: Ice Road gets another demo cover and is resubmitted.
  const r7 = open(SEED_STATE, id(7))
  state = ok(SEED_STATE, { type: 'save_draft', releaseId: id(7), payload: { ...r7.payload, cover: demoCover('demo-r07-cover-v3') } })
  viaRule('T06b', state, { type: 'resubmit', releaseId: id(7), replyToReviewer: null }, SELLER, { releaseId: id(7), revisionId: r7.id })
})

test('T07 starts an update from live and seller-unpublished releases, copying the live payload', () => {
  const state = viaRule('T07', SEED_STATE, { type: 'start_update', releaseId: id(1) }, SELLER, { releaseId: id(1) })
  const update = open(state, id(1))
  assert.equal(update.seq, 3)
  assert.equal(update.baseVersion, 2)
  assert.deepEqual(update.payload, current(state, id(1)).payload)
  viaRule('T07', SEED_STATE, { type: 'start_update', releaseId: id(9) }, SELLER, { releaseId: id(9) })
})

test('T08 withdraws an update in draft, in review or needing changes, also on hold', () => {
  viaRule('T08', SEED_STATE, { type: 'discard_update', releaseId: id(13) }, SELLER, { releaseId: id(13), revisionId: open(SEED_STATE, id(13)).id })
  const state = viaRule('T08', SEED_STATE, { type: 'discard_update', releaseId: id(2) }, SELLER, { releaseId: id(2), revisionId: open(SEED_STATE, id(2)).id })
  assert.equal(state.cases['case-r02-3'].status, 'dismissed')
  assert.equal(state.releases[id(2)].openRevisionId, null)
  viaRule('T08', SEED_STATE, { type: 'discard_update', releaseId: id(7) }, SELLER, { releaseId: id(7), revisionId: open(SEED_STATE, id(7)).id })
  const held = ok(SEED_STATE, { type: 'suspend', releaseId: id(13), statement: statement('suspended', 'copyright_claim'), disableDownloads: false }, REVIEWER)
  viaRule('T08', held, { type: 'discard_update', releaseId: id(13) }, SELLER, { releaseId: id(13), revisionId: open(held, id(13)).id })
})

test('T09 deletes never-approved releases, not ones with an open appeal', () => {
  viaRule('T09', SEED_STATE, { type: 'delete_release', releaseId: id(5) }, SELLER, { releaseId: id(5), revisionId: 'demo-r05-rev1' })
  viaRule('T09', SEED_STATE, { type: 'delete_release', releaseId: id(4) }, SELLER, { releaseId: id(4), revisionId: 'demo-r04-rev1' })
  const state = viaRule('T09', SEED_STATE, { type: 'delete_release', releaseId: id(6) }, SELLER, { releaseId: id(6), revisionId: 'demo-r06-rev1' })
  assert.equal(state.revisions['demo-r06-rev1'].status, 'withdrawn')
  const appealed = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(6), appealedCaseId: 'case-r06-1', message: 'This vocal is my own recording from 2019.' })
  refused(appealed, { type: 'delete_release', releaseId: id(6) }, SELLER, 'invalid_state')
})

test('T10 and T11: unpublishing is always available and relisting needs no review (L12)', () => {
  let state = viaRule('T10', SEED_STATE, { type: 'unpublish', releaseId: id(1) }, SELLER, { releaseId: id(1) })
  assert.equal(isPublic(state.releases[id(1)], DEMO_NOW), false)
  const cases = Object.keys(state.cases).length
  state = viaRule('T11', state, { type: 'relist', releaseId: id(1) }, SELLER, { releaseId: id(1) })
  assert.equal(Object.keys(state.cases).length, cases, 'no review case for a relist')
  assert.equal(isPublic(state.releases[id(1)], DEMO_NOW), true)

  // Unpublishing a scheduled release cancels its date, so a relist is public at once.
  state = ok(SEED_STATE, { type: 'unpublish', releaseId: id(8) })
  assert.equal(state.releases[id(8)].goesPublicAt, null)
  state = ok(state, { type: 'relist', releaseId: id(8) })
  assert.equal(isPublic(state.releases[id(8)], DEMO_NOW), true)

  // §7.5 step 7.
  state = viaRule('T11', SEED_STATE, { type: 'relist', releaseId: id(9) }, SELLER, { releaseId: id(9) })
  assert.equal(lastEvent(state).type, 'relisted')
  refused(SEED_STATE, { type: 'relist', releaseId: id(11) }, SELLER, 'not_relistable')
  refused(SEED_STATE, { type: 'relist', releaseId: id(15) }, SELLER, 'not_relistable')
})

test('T12 files appeals on rejections, suspensions and removals', () => {
  let state = viaRule('T12', SEED_STATE, { type: 'file_appeal', releaseId: id(6), appealedCaseId: 'case-r06-1', message: 'This vocal is my own recording from 2019.' }, SELLER, { releaseId: id(6), revisionId: 'demo-r06-rev1' })
  assert.equal(state.releases[id(6)].openRevisionId, 'demo-r06-rev1', 'the appealed rejection is open again')
  const appeal = openAppeal(state, id(6))
  assert.equal(state.cases[appeal.appealCaseId].kind, 'appeal')
  assert.equal(state.cases[appeal.appealCaseId].priority, 40)

  viaRule('T12', SEED_STATE, { type: 'file_appeal', releaseId: id(10), appealedCaseId: 'case-r10-2', message: 'These snares were recorded in my kitchen.' }, SELLER, { releaseId: id(10) })
  viaRule('T12', SEED_STATE, { type: 'file_appeal', releaseId: id(11), appealedCaseId: 'case-r11-3', message: 'The other release copied my beat after I posted it.' }, SELLER, { releaseId: id(11) })

  // An update rejection on a live release (§7.5 steps 3–4).
  state = submitR13Update(SEED_STATE)
  const caseId = lastCaseOf(state, open(state, id(13)))
  state = ok(state, { type: 'reject', caseId, statement: statement('update_not_published', 'duplicate_content') }, REVIEWER)
  state = viaRule('T12', state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: caseId, message: 'I published these on my own site first.' }, SELLER, { releaseId: id(13), revisionId: 'demo-r13-rev2' })
  refused(state, { type: 'start_update', releaseId: id(13) }, SELLER, 'open_revision_exists')
})

test('appeals: one per decision, within the window, at least 20 characters', () => {
  refused(SEED_STATE, { type: 'file_appeal', releaseId: id(16), appealedCaseId: 'case-r16-1', message: 'Please look at this again, they are mine.' }, SELLER, 'appeal_exists')
  refused(
    SEED_STATE,
    { type: 'file_appeal', releaseId: id(6), appealedCaseId: 'case-r06-1', message: 'This vocal is my own recording from 2019.' },
    SELLER,
    'appeal_window_closed',
    addDays('2026-10-03T12:00:00Z', 184),
  )
  refused(SEED_STATE, { type: 'file_appeal', releaseId: id(6), appealedCaseId: 'case-r06-1', message: 'Too short.' }, SELLER, 'validation_failed')
  refused(SEED_STATE, { type: 'file_appeal', releaseId: id(1), appealedCaseId: 'case-r01-1', message: 'An approval is not a restriction.' }, SELLER, 'invalid_state')
})

/* ------------------------------------------------------------------ */
/* Reviewer and system rules                                           */
/* ------------------------------------------------------------------ */

test('T13 starts the review of a queued case, including an appeal case', () => {
  const state = viaRule('T13', SEED_STATE, { type: 'start_review', caseId: 'case-r03-1' }, REVIEWER, { releaseId: id(3), revisionId: 'demo-r03-rev1' })
  assert.equal(state.cases['case-r03-1'].status, 'in_progress')
  refused(state, { type: 'start_review', caseId: 'case-r03-1' }, REVIEWER, 'review_already_started')
  viaRule('T13', SEED_STATE, { type: 'start_review', caseId: 'case-r14-3' }, APPEAL_REVIEWER, { releaseId: id(14), revisionId: 'demo-r14-rev2' })
})

test('T14 approves a first release; a queued case gets "Review started" first', () => {
  const state = viaRule('T14', SEED_STATE, { type: 'approve', caseId: 'case-r03-1' }, REVIEWER, { releaseId: id(3), revisionId: 'demo-r03-rev1' })
  const types = state.events.slice(SEED_STATE.events.length).map((e) => e.type)
  assert.deepEqual(types, ['review_started', 'went_live'])
  assert.ok(state.events.slice(SEED_STATE.events.length).every((e) => e.simulated === true), 'Demo reviewer events are simulated')
  const release = state.releases[id(3)]
  assert.equal(current(state, id(3)).version, 1)
  assert.equal(release.openRevisionId, null)
  assert.equal(release.firstLiveAt !== null, true)
})

test('T14 with a future release date schedules the song and sets goesPublicAt', () => {
  const project = findProject('northern-wake')
  const base = prefillPayload(project, 'song', { displayName: 'Nightjar', personName: 'Maya Lind', userId: 'demo-maya' }, DEMO_NOW)
  const payload = {
    ...base,
    genre: 'Electronic',
    releaseDate: '2026-11-06',
    key: { ...base.key, confirmed: true },
    tracks: base.tracks.map((t) => ({ ...t, language: 'en', key: { ...t.key, confirmed: true } })),
  }
  const source = { vaultId: 'demo-vault-nightjar', projectName: project.name, pushedAtCapture: true, capturedAt: DEMO_NOW }
  let state = ok(SEED_STATE, { type: 'create_release', releaseType: 'song', source, payload, sellerEligible: true })
  const releaseId = Object.keys(state.releases).find((k) => !SEED_STATE.releases[k])
  state = ok(state, { type: 'submit', releaseId, attestation: ATTESTATION, evidence: buildEvidence(project, DEMO_NOW, null) })
  const caseId = lastCaseOf(state, open(state, releaseId))
  assert.equal(state.cases[caseId].depth, 'strict')
  state = ok(state, { type: 'approve', caseId }, REVIEWER)
  assert.equal(lastEvent(state).type, 'scheduled')
  assert.equal(state.releases[releaseId].goesPublicAt, '2026-11-06T00:00:00Z')
  assert.equal(isPublic(state.releases[releaseId], DEMO_NOW), false)
})

test('T15 approving an update bumps the version, supersedes the old one and swaps current in one update (§7.5 step 2)', () => {
  const state = viaRule('T15', SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER, { releaseId: id(2), revisionId: 'demo-r02-rev3' })
  const release = state.releases[id(2)]
  assert.equal(release.currentRevisionId, 'demo-r02-rev3')
  assert.equal(release.openRevisionId, null)
  assert.equal(state.revisions['demo-r02-rev3'].version, 3)
  assert.equal(state.revisions['demo-r02-rev2'].supersededAt !== null, true)
  assert.equal(lastEvent(state).type, 'update_went_live')
  assert.equal(lastEvent(state).version, 3)
})

test('an approved update that moves a scheduled date recomputes goesPublicAt (R8)', () => {
  let state = ok(SEED_STATE, { type: 'start_update', releaseId: id(8) })
  const draft = open(state, id(8))
  state = ok(state, { type: 'save_draft', releaseId: id(8), payload: { ...draft.payload, releaseDate: '2026-11-07' }, changeNote: 'Moved the release a fortnight later.' })
  state = ok(state, { type: 'submit', releaseId: id(8), attestation: ATTESTATION, evidence: current(state, id(8)).evidence })
  state = ok(state, { type: 'approve', caseId: lastCaseOf(state, open(state, id(8))) }, REVIEWER)
  assert.equal(state.releases[id(8)].goesPublicAt, '2026-11-07T00:00:00Z')
  assert.equal(isPublic(state.releases[id(8)], DEMO_NOW), false)
})

test('T16 requests changes (reviewer or system); on an update the live version is untouched (L4)', () => {
  viaRule('T16a', SEED_STATE, { type: 'request_changes', caseId: 'case-r03-1', reasons: [{ code: 'metadata_inaccurate', message: 'Check the key.' }] }, REVIEWER, { releaseId: id(3), revisionId: 'demo-r03-rev1' })
  const state = viaRule('T16b', SEED_STATE, { type: 'request_changes', caseId: 'case-r02-3', reasons: [{ code: 'files_changed_since_submit', message: 'Resubmit.' }] }, SYSTEM, { releaseId: id(2), revisionId: 'demo-r02-rev3' })
  assert.equal(state.releases[id(2)].currentRevisionId, 'demo-r02-rev2')
  assert.equal(state.releases[id(2)].status, 'live')
  refused(SEED_STATE, { type: 'request_changes', caseId: 'case-r03-1', reasons: [] }, REVIEWER, 'validation_failed')
})

test('T17 rejects; rejecting an update frees the slot and leaves the live version (L4)', () => {
  viaRule('T17a', SEED_STATE, { type: 'reject', caseId: 'case-r12-1', statement: statement('not_published', 'human_made_violation') }, REVIEWER, { releaseId: id(12), revisionId: 'demo-r12-rev1' })
  const state = viaRule('T17b', SEED_STATE, { type: 'reject', caseId: 'case-r02-3', statement: statement('update_not_published', 'cover_art_rights') }, REVIEWER, { releaseId: id(2), revisionId: 'demo-r02-rev3' })
  const release = state.releases[id(2)]
  assert.equal(release.currentRevisionId, 'demo-r02-rev2')
  assert.equal(release.openRevisionId, null)
  assert.equal(release.status, 'live')
  const incomplete = { ...statement('not_published', 'other'), facts: '' }
  refused(SEED_STATE, { type: 'reject', caseId: 'case-r12-1', statement: incomplete }, REVIEWER, 'validation_failed')
})

test('T18 and T19: on hold from live or unpublished, and back to where it was', () => {
  let state = viaRule('T18', SEED_STATE, { type: 'suspend', releaseId: id(1), statement: statement('suspended', 'copyright_claim'), disableDownloads: true }, REVIEWER, { releaseId: id(1) })
  assert.equal(state.releases[id(1)].suspension.restoreTo, 'live')
  assert.equal(state.releases[id(1)].suspension.downloadsDisabled, true)
  state = viaRule('T18', SEED_STATE, { type: 'suspend', releaseId: id(9), statement: statement('suspended', 'copyright_claim'), disableDownloads: false }, REVIEWER, { releaseId: id(9) })
  assert.equal(state.releases[id(9)].suspension.restoreTo, 'unpublished')
  state = viaRule('T19', state, { type: 'reinstate', releaseId: id(9) }, REVIEWER, { releaseId: id(9) })
  assert.equal(state.releases[id(9)].status, 'unpublished')
  viaRule('T19', SEED_STATE, { type: 'reinstate', releaseId: id(10) }, REVIEWER, { releaseId: id(10) })
})

test('T20 and T21: automated checks only flag and prioritise; publish failures stay internal', () => {
  const checks = [{ id: 'duplicate_sha256', result: 'flag', sellerVisible: false }]
  let state = viaRule('T20', SEED_STATE, { type: 'auto_checks_completed', caseId: 'case-r03-1', checks }, SYSTEM, { releaseId: id(3), revisionId: 'demo-r03-rev1' })
  assert.equal(state.cases['case-r03-1'].priority, 10)
  assert.equal(state.releases[id(3)].status, 'in_review', 'a flag is never a decision (L10)')
  assert.equal(lastEvent(state).visibility, 'internal')
  state = viaRule('T21', SEED_STATE, { type: 'publish_failed', caseId: 'case-r12-1', detail: 'Copy timed out.' }, SYSTEM, { releaseId: id(12), revisionId: 'demo-r12-rev1' })
  assert.equal(lastEvent(state).visibility, 'internal')
})

test('T22 removes a live or held release and withdraws its open update', () => {
  let state = viaRule('T22', SEED_STATE, { type: 'remove', releaseId: id(13), statement: statement('removed', 'legal_order') }, REVIEWER, { releaseId: id(13), revisionId: 'demo-r13-rev2' })
  assert.equal(state.releases[id(13)].unpublished.by, 'platform')
  assert.equal(state.releases[id(13)].openRevisionId, null)
  state = viaRule('T22', SEED_STATE, { type: 'remove', releaseId: id(10), statement: statement('removed', 'copyright_claim') }, REVIEWER, { releaseId: id(10) })
  assert.equal(state.releases[id(10)].suspension, null)
})

test('T23 and T24: appeal decisions, by a different reviewer', () => {
  refused(SEED_STATE, { type: 'decide_appeal', appealId: 'appeal-r14', outcome: 'overturned' }, { kind: 'reviewer', reviewerId: 'reviewer-1' }, 'same_reviewer')
  const upheld = viaRule('T23', SEED_STATE, { type: 'decide_appeal', appealId: 'appeal-r14', outcome: 'upheld', statement: statement('update_not_published', 'new_recording_needs_new_release') }, APPEAL_REVIEWER, { releaseId: id(14), revisionId: 'demo-r14-rev2' })
  assert.equal(upheld.releases[id(14)].openRevisionId, null)
  assert.equal(upheld.revisions['demo-r14-rev2'].status, 'rejected')
  refused(upheld, { type: 'decide_appeal', appealId: 'appeal-r14', outcome: 'overturned' }, APPEAL_REVIEWER, 'invalid_state')

  // T24b: the update's base is still current, so it is promoted.
  const overturned = viaRule('T24b', SEED_STATE, { type: 'decide_appeal', appealId: 'appeal-r14', outcome: 'overturned' }, APPEAL_REVIEWER, { releaseId: id(14), revisionId: 'demo-r14-rev2' })
  assert.equal(current(overturned, id(14)).version, 2)
  assert.deepEqual(overturned.events.slice(SEED_STATE.events.length).map((e) => e.type), ['appeal_overturned', 'update_went_live'])

  // T24a: a first rejection overturned goes live as version 1.
  let state = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(6), appealedCaseId: 'case-r06-1', message: 'This vocal is my own recording from 2019.' })
  state = viaRule('T24a', state, { type: 'decide_appeal', appealId: openAppeal(state, id(6)).id, outcome: 'overturned' }, APPEAL_REVIEWER, { releaseId: id(6), revisionId: 'demo-r06-rev1' })
  assert.equal(current(state, id(6)).version, 1)

  // T24c: a suspension overturned is restored.
  state = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(10), appealedCaseId: 'case-r10-2', message: 'These snares were recorded in my kitchen.' })
  state = viaRule('T24c', state, { type: 'decide_appeal', appealId: openAppeal(state, id(10)).id, outcome: 'overturned' }, APPEAL_REVIEWER, { releaseId: id(10) })
  assert.equal(state.releases[id(10)].suspension, null)

  // T24d: a removal overturned goes back on sale.
  state = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(11), appealedCaseId: 'case-r11-3', message: 'The other release copied my beat after I posted it.' })
  state = viaRule('T24d', state, { type: 'decide_appeal', appealId: openAppeal(state, id(11)).id, outcome: 'overturned' }, APPEAL_REVIEWER, { releaseId: id(11) })
  assert.equal(isPublic(state.releases[id(11)], DEMO_NOW), true)
})

test('§7.5 steps 3–4: Kitchen Percussion is rejected, appealed and overturned into version 2', () => {
  let state = submitR13Update(SEED_STATE)
  const caseId = lastCaseOf(state, open(state, id(13)))
  state = ok(state, { type: 'reject', caseId, statement: statement('update_not_published', 'duplicate_content') }, REVIEWER)
  assert.equal(current(state, id(13)).version, 1)
  state = ok(state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: caseId, message: 'I published these on my own site first.' })
  state = ok(state, { type: 'decide_appeal', appealId: openAppeal(state, id(13)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  assert.equal(current(state, id(13)).version, 2)
  assert.deepEqual(current(state, id(13)).payload.price, { kind: 'credits', credits: 30 })
})

test('overturning a stale update rejection creates a new update draft instead of promoting it (T24)', () => {
  let state = submitR13Update(SEED_STATE)
  const rejectedCase = lastCaseOf(state, open(state, id(13)))
  state = ok(state, { type: 'reject', caseId: rejectedCase, statement: statement('update_not_published', 'duplicate_content') }, REVIEWER)
  // Another update is approved meanwhile, so version 2 exists.
  state = ok(state, { type: 'start_update', releaseId: id(13) })
  const other = open(state, id(13))
  state = ok(state, { type: 'save_draft', releaseId: id(13), payload: { ...other.payload, tags: ['percussion', 'foley'] }, changeNote: 'Tidied the tags only.' })
  state = ok(state, { type: 'submit', releaseId: id(13), attestation: ATTESTATION, evidence: current(state, id(13)).evidence })
  state = ok(state, { type: 'approve', caseId: lastCaseOf(state, open(state, id(13))) }, REVIEWER)
  assert.equal(current(state, id(13)).version, 2)

  state = ok(state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: rejectedCase, message: 'I published these on my own site first.' })
  state = ok(state, { type: 'decide_appeal', appealId: openAppeal(state, id(13)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  assert.equal(current(state, id(13)).version, 2, 'version 2 is not undone')
  assert.equal(state.revisions['demo-r13-rev2'].status, 'rejected')
  const draft = open(state, id(13))
  assert.equal(draft.status, 'draft')
  assert.equal(draft.baseVersion, 2)
  assert.deepEqual(draft.payload.price, { kind: 'credits', credits: 30 })
  assert.equal(lastEvent(state).type, 'update_started')
  assert.equal(lastEvent(state).actor.kind, 'system')
})

test('T25, T26 and T27: system closures', () => {
  let state = viaRule('T25', SEED_STATE, { type: 'quota_unpublish', releaseId: id(1) }, SYSTEM, { releaseId: id(1) })
  assert.equal(state.releases[id(1)].unpublished.cause, 'storage_over_quota')
  state = ok(state, { type: 'relist', releaseId: id(1) })
  assert.equal(state.releases[id(1)].status, 'live')

  // T26 needs a live beat with the Exclusive tier on.
  const withExclusive = clone(SEED_STATE)
  const live = withExclusive.revisions['demo-r07-rev1']
  live.payload.tiers = live.payload.tiers.map((t) => (t.tier === 'exclusive' ? { ...t, enabled: true } : t))
  refused(SEED_STATE, { type: 'exclusive_sold', releaseId: id(7) }, SYSTEM, 'invalid_state')
  state = viaRule('T26', withExclusive, { type: 'exclusive_sold', releaseId: id(7) }, SYSTEM, { releaseId: id(7), revisionId: 'demo-r07-rev2' })
  assert.equal(state.releases[id(7)].unpublished.cause, 'exclusive_sold')
  assert.equal(state.releases[id(7)].openRevisionId, null)

  viaRule('T27a', SEED_STATE, { type: 'account_closed', releaseId: id(1) }, SYSTEM, { releaseId: id(1) })
  viaRule('T27b', SEED_STATE, { type: 'account_closed', releaseId: id(5) }, SYSTEM, { releaseId: id(5), revisionId: 'demo-r05-rev1' })
})

/* ------------------------------------------------------------------ */
/* Lifecycle rules and refusals                                        */
/* ------------------------------------------------------------------ */

test('L1: one open revision per release; "Edit release" never makes a second one', () => {
  refused(SEED_STATE, { type: 'start_update', releaseId: id(2) }, SELLER, 'open_revision_exists')
  refused(SEED_STATE, { type: 'start_update', releaseId: id(13) }, SELLER, 'open_revision_exists')
  refused(SEED_STATE, { type: 'start_update', releaseId: id(14) }, SELLER, 'open_revision_exists')
})

test('L17: an exclusive sale ends the release for good', () => {
  refused(SEED_STATE, { type: 'relist', releaseId: id(15) }, SELLER, 'not_relistable')
  refused(SEED_STATE, { type: 'start_update', releaseId: id(15) }, SELLER, 'invalid_state')
})

test('L19: on hold, no update starts or is submitted, and its review pauses', () => {
  refused(SEED_STATE, { type: 'start_update', releaseId: id(10) }, SELLER, 'release_suspended')
  const held = ok(SEED_STATE, { type: 'suspend', releaseId: id(2), statement: statement('suspended', 'copyright_claim'), disableDownloads: false }, REVIEWER)
  refused(held, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER, 'release_suspended')
  refused(held, { type: 'start_review', caseId: 'case-r02-3' }, REVIEWER, 'release_suspended')
  refused(held, { type: 'auto_checks_completed', caseId: 'case-r02-3', checks: [] }, SYSTEM, 'release_suspended')
  const heldDraft = ok(SEED_STATE, { type: 'suspend', releaseId: id(13), statement: statement('suspended', 'copyright_claim'), disableDownloads: false }, REVIEWER)
  refused(heldDraft, { type: 'submit', releaseId: id(13), attestation: ATTESTATION, evidence: current(heldDraft, id(13)).evidence }, SELLER, 'release_suspended')

  // Overturning the hold restores the release and the paused update stays in review.
  let state = ok(held, { type: 'file_appeal', releaseId: id(2), appealedCaseId: held.releases[id(2)].suspension.caseId, message: 'These drums are all my own recordings.' })
  state = ok(state, { type: 'decide_appeal', appealId: openAppeal(state, id(2)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  assert.equal(state.releases[id(2)].status, 'live')
  assert.equal(open(state, id(2)).status, 'in_review')
})

test('actions outside the rules return invalid_state, wrong actors not_allowed_for_actor', () => {
  refused(SEED_STATE, { type: 'submit', releaseId: id(1), attestation: ATTESTATION, evidence: null }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'pull_back', releaseId: id(5) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'resubmit', releaseId: id(5), replyToReviewer: 'x' }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'discard_update', releaseId: id(1) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'delete_release', releaseId: id(1) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'unpublish', releaseId: id(9) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'relist', releaseId: id(1) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'save_draft', releaseId: id(1), payload: current(SEED_STATE, id(1)).payload }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'start_update', releaseId: id(3) }, SELLER, 'invalid_state')
  refused(SEED_STATE, { type: 'approve', caseId: 'case-r01-1' }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'request_changes', caseId: 'case-r01-2', reasons: [{ code: 'other', message: 'x' }] }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'reject', caseId: 'case-r06-1', statement: statement('not_published', 'other') }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'suspend', releaseId: id(3), statement: statement('suspended', 'other'), disableDownloads: false }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'reinstate', releaseId: id(1) }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'remove', releaseId: id(9), statement: statement('removed', 'other') }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'quota_unpublish', releaseId: id(9) }, SYSTEM, 'invalid_state')
  refused(SEED_STATE, { type: 'start_review', caseId: 'case-r01-1' }, REVIEWER, 'invalid_state')
  refused(SEED_STATE, { type: 'auto_checks_completed', caseId: 'case-r01-1', checks: [] }, SYSTEM, 'invalid_state')

  refused(SEED_STATE, { type: 'approve', caseId: 'case-r03-1' }, SELLER, 'not_allowed_for_actor')
  refused(SEED_STATE, { type: 'submit', releaseId: id(5), attestation: ATTESTATION, evidence: null }, REVIEWER, 'not_allowed_for_actor')
  refused(SEED_STATE, { type: 'reject', caseId: 'case-r03-1', statement: statement('not_published', 'other') }, SYSTEM, 'not_allowed_for_actor')
  refused(SEED_STATE, { type: 'exclusive_sold', releaseId: id(7) }, REVIEWER, 'not_allowed_for_actor')
  refused(SEED_STATE, { type: 'decide_appeal', appealId: 'appeal-r14', outcome: 'upheld' }, SELLER, 'not_allowed_for_actor')
  refused(SEED_STATE, { type: 'start_update', releaseId: id(1) }, REVIEWER, 'not_allowed_for_actor')

  // Another seller's release doesn't exist for them (§4.6).
  refused(SEED_STATE, { type: 'unpublish', releaseId: id(1) }, OTHER_SELLER, 'not_found')
  // Themes are first-party only (L18).
  const theme = { ...current(SEED_STATE, id(9)).payload, kind: 'theme', themeId: 'x', screenshots: [], appearance: 'dark' }
  refused(SEED_STATE, { type: 'create_release', releaseType: 'theme', source: { vaultId: 'v', projectName: 'p', pushedAtCapture: true, capturedAt: DEMO_NOW }, payload: theme, sellerEligible: true }, SELLER, 'type_not_publishable')
})

// T01 "seller eligible" (PUBLISH-PROCEDURE §1): no verified creator profile, no release.
test('T01 refuses a seller without a verified creator profile', () => {
  const project = findProject('saltmarsh-kit')
  const payload = { ...prefillPayload(project, 'sample_pack', { displayName: 'Nightjar', personName: 'Maya Lind', userId: 'demo-maya' }, DEMO_NOW), genre: 'Downtempo' }
  const source = { vaultId: 'demo-vault-nightjar', projectName: project.name, pushedAtCapture: true, capturedAt: DEMO_NOW }
  const action = { type: 'create_release', releaseType: 'sample_pack', source, payload }
  refused(SEED_STATE, { ...action, sellerEligible: false }, SELLER, 'seller_not_eligible')
  refused(SEED_STATE, action, SELLER, 'seller_not_eligible')
  const result = apply(SEED_STATE, { ...action, sellerEligible: false })
  assert.equal(result.message, 'Verify your creator profile before you publish.')
  ok(SEED_STATE, { ...action, sellerEligible: true })
})

/* ------------------------------------------------------------------ */
/* Change summary (§4.7, §4.8)                                         */
/* ------------------------------------------------------------------ */

test('diffRevision reports the §4.7 change kinds and the §4.8 depth', () => {
  const r2 = diffRevision(current(SEED_STATE, id(2)).payload, open(SEED_STATE, id(2)).payload)
  assert.deepEqual(r2.kinds, ['cover', 'price', 'files'])
  assert.equal(r2.reviewDepth, 'standard')
  assert.equal(r2.files.filter((f) => f.change === 'added').length, 6)
  assert.equal(r2.files.filter((f) => f.change === 'renamed').length, 2)
  assert.equal(r2.unchangedFileCount, 63)

  const r1 = diffRevision(SEED_STATE.revisions['demo-r01-rev1'].payload, SEED_STATE.revisions['demo-r01-rev2'].payload)
  assert.deepEqual(r1.kinds, ['metadata'])
  assert.equal(r1.reviewDepth, 'light')

  const r14 = diffRevision(current(SEED_STATE, id(14)).payload, SEED_STATE.revisions['demo-r14-rev2'].payload)
  assert.deepEqual(r14.kinds, ['audio'])
  assert.equal(r14.reviewDepth, 'strict')
  assert.equal(r14.files[0].change, 'replaced')

  const beat = current(SEED_STATE, id(7)).payload
  const licence = diffRevision(beat, { ...beat, tiers: beat.tiers.map((t) => (t.tier === 'exclusive' ? { ...t, enabled: true } : t)) })
  assert.deepEqual(licence.kinds, ['license'])
  assert.equal(licence.reviewDepth, 'strict')
  const stems = diffRevision(beat, { ...beat, stems: beat.stems.slice(1) })
  assert.deepEqual(stems.kinds, ['files'])
  assert.equal(stems.reviewDepth, 'standard')

  const song = current(SEED_STATE, id(14)).payload
  const reordered = diffRevision(song, { ...song, tracks: [...song.tracks].reverse() })
  assert.ok(reordered.kinds.includes('tracklist'))
  const credits = diffRevision(song, { ...song, tracks: song.tracks.map((t) => ({ ...t, credits: [{ ...t.credits[0], masterSharePct: 50 }] })) })
  assert.deepEqual(credits.kinds, ['credits_splits'])
  assert.equal(credits.reviewDepth, 'strict')

  const pack = current(SEED_STATE, id(10)).payload
  const cover = diffRevision(pack, { ...pack, cover: demoCover('another-cover') })
  assert.deepEqual(cover.kinds, ['cover'])
  assert.equal(cover.reviewDepth, 'light')
  assert.equal(diffRevision(pack, clone(pack)).kinds.length, 0)
})

/* ------------------------------------------------------------------ */
/* RL §7.5 walkthrough, web steps, and the founder script's publish    */
/* ------------------------------------------------------------------ */

const actionsOf = (state, n) => releaseActions(state, releaseView(state, state.releases[id(n)], DEMO_NOW), DEMO_NOW)
const revisionsFor = (state, n) => state.releases[id(n)].revisionIds.map((r) => state.revisions[r])

test('§7.5 step 2: approving Tidewater Drums puts version 3 and its new cover on the Market', () => {
  const before = toPublicView(SEED_STATE, id(2), DEMO_NOW)
  const state = ok(SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER)
  const after = toPublicView(state, id(2), DEMO_NOW)
  assert.equal(after.version, 3)
  assert.notEqual(after.coverSeed, before.coverSeed)
  assert.deepEqual(after.price, { kind: 'credits', credits: 70 })
  assert.equal(after.whatsNew, open(SEED_STATE, id(2)).changeNote)
})

test('§7.5 steps 3–4 on the Market: Kitchen Percussion shows version 2 with the new price', () => {
  let state = submitR13Update(SEED_STATE)
  assert.equal(tabCounts(state, DEMO_NOW).update_in_review, 2)
  assert.deepEqual(toPublicView(state, id(13), DEMO_NOW).price, { kind: 'credits', credits: 40 }, 'pending changes never show')
  const caseId = lastCaseOf(state, open(state, id(13)))
  state = ok(state, { type: 'reject', caseId, statement: statement('update_not_published', 'duplicate_content') }, REVIEWER)
  assert.ok(actionsOf(state, 13).some((a) => a.id === 'edit_release' && !a.disabledReason), '"Edit release" is still available')
  assert.ok(actionsOf(state, 13).some((a) => a.id === 'appeal_update'), 'Appeal is offered')
  state = ok(state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: caseId, message: 'I published these on my own site first.' })
  assert.ok(actionsOf(state, 13).some((a) => a.id === 'edit_release' && a.disabledReason), '"Edit release" is disabled (L1)')
  state = ok(state, { type: 'decide_appeal', appealId: openAppeal(state, id(13)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  const view = toPublicView(state, id(13), DEMO_NOW)
  assert.equal(view.version, 2)
  assert.deepEqual(view.price, { kind: 'credits', credits: 30 })
})

test('§7.5 step 5: Untitled Loop Kit moves to In review once fixed', () => {
  const { state: fixed, evidence } = fixedR05(SEED_STATE)
  const state = ok(fixed, { type: 'submit', releaseId: id(5), attestation: ATTESTATION, evidence })
  assert.equal(tabCounts(state, DEMO_NOW).in_review, 3)
  assert.equal(tabCounts(state, DEMO_NOW).drafts, 1)
})

test('§7.5 steps 7–10: relist, resubmit, on hold and sold exclusively', () => {
  let state = ok(SEED_STATE, { type: 'relist', releaseId: id(9) })
  assert.ok(publicListings(state, DEMO_NOW).some((l) => l.slug === 'old-synth-memories'))

  const r7 = open(SEED_STATE, id(7))
  state = ok(SEED_STATE, { type: 'save_draft', releaseId: id(7), payload: { ...r7.payload, cover: demoCover('demo-r07-cover-v3') } })
  state = ok(state, { type: 'resubmit', releaseId: id(7), replyToReviewer: null })
  assert.equal(open(state, id(7)).status, 'in_review')

  const copperKit = actionsOf(SEED_STATE, 10)
  assert.ok(copperKit.some((a) => a.id === 'edit_release' && a.disabledReason === "You can't edit or submit while this release is on hold."))
  assert.ok(copperKit.some((a) => a.id === 'appeal' && !a.disabledReason))

  const nightBus = actionsOf(SEED_STATE, 15)
  assert.deepEqual(nightBus.map((a) => a.id), ['view_sale'], 'Relist is absent')
})

test('founder script step 10: a sample pack from Saltmarsh Kit is published and reaches the Market', () => {
  let { state, releaseId, evidence } = newSamplePack(SEED_STATE)
  const prefilled = open(state, releaseId).payload
  // The project fills in everything but the genre (RL §5.3), so that is all the seller adds.
  state = ok(state, { type: 'save_draft', releaseId, payload: { ...prefilled, genre: null } })
  const missing = apply(state, { type: 'submit', releaseId, attestation: ATTESTATION, evidence })
  assert.deepEqual(missing.issues.map((i) => i.field), ['genre'])
  state = ok(state, { type: 'save_draft', releaseId, payload: prefilled })
  state = ok(state, { type: 'submit', releaseId, attestation: ATTESTATION, evidence })
  state = ok(state, { type: 'approve', caseId: lastCaseOf(state, open(state, releaseId)) }, REVIEWER)
  const listing = publicListings(state, DEMO_NOW).find((l) => l.releaseId === releaseId)
  assert.ok(listing, 'usePublicReleases lists it as "Your demo release"')
  assert.equal(listing.type, 'sample_pack')
  assert.equal(listing.sellerHandle, 'nightjar')
})

/* ------------------------------------------------------------------ */
/* Appeals against a restriction that changed meanwhile (§4.6 T24)     */
/* ------------------------------------------------------------------ */

const SUSPEND = (n) => ({ type: 'suspend', releaseId: id(n), statement: statement('suspended', 'copyright_claim'), disableDownloads: false })

/** The seller can still edit afterwards: start an update and discard it. */
function sellerCanStillEdit(state, n) {
  const started = ok(state, { type: 'start_update', releaseId: id(n) })
  ok(started, { type: 'discard_update', releaseId: id(n) })
}

/** Kitchen Percussion's update, rejected and appealed (§7.5 steps 3–4 up to the appeal). */
function appealedR13(state) {
  state = submitR13Update(state)
  const rejected = lastCaseOf(state, open(state, id(13)))
  state = ok(state, { type: 'reject', caseId: rejected, statement: statement('update_not_published', 'duplicate_content') }, REVIEWER)
  return ok(state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: rejected, message: 'I published these on my own site first.' })
}

test('an update-rejection appeal waits while the release is on hold, and the hold stays', () => {
  let state = ok(appealedR13(SEED_STATE), SUSPEND(13), REVIEWER)
  const appealId = openAppeal(state, id(13)).id

  // Neither outcome may lift the hold or promote the update meanwhile (T18).
  refused(state, { type: 'decide_appeal', appealId, outcome: 'overturned' }, APPEAL_REVIEWER, 'release_suspended')
  refused(state, { type: 'decide_appeal', appealId, outcome: 'upheld', statement: statement('update_not_published', 'other') }, APPEAL_REVIEWER, 'release_suspended')
  // Removing the release would make the open appeal moot, so the appeal is decided first.
  refused(state, { type: 'remove', releaseId: id(13), statement: statement('removed', 'other') }, REVIEWER, 'invalid_state')
  assert.equal(state.releases[id(13)].status, 'suspended')

  // Once the hold is lifted, the appeal decides the update as T24b.
  state = ok(state, { type: 'reinstate', releaseId: id(13) }, REVIEWER)
  assert.equal(openAppeal(state, id(13)).id, appealId, 'reinstating a hold leaves a rejection appeal open')
  state = viaRule('T24b', state, { type: 'decide_appeal', appealId, outcome: 'overturned' }, APPEAL_REVIEWER, { releaseId: id(13), revisionId: 'demo-r13-rev2' })
  assert.equal(current(state, id(13)).version, 2)
  assert.equal(state.releases[id(13)].openRevisionId, null)
  sellerCanStillEdit(state, 13)
})

test('a suspension appeal cannot undo a later removal', () => {
  let state = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(10), appealedCaseId: 'case-r10-2', message: 'These snares were recorded in my kitchen.' })
  // The removal waits for the open appeal; uphold it, then remove.
  refused(state, { type: 'remove', releaseId: id(10), statement: statement('removed', 'copyright_claim') }, REVIEWER, 'invalid_state')
  const appealId = openAppeal(state, id(10)).id
  state = ok(state, { type: 'decide_appeal', appealId, outcome: 'upheld', statement: statement('suspended', 'copyright_claim') }, APPEAL_REVIEWER)
  state = ok(state, { type: 'remove', releaseId: id(10), statement: statement('removed', 'copyright_claim') }, REVIEWER)
  refused(state, { type: 'decide_appeal', appealId, outcome: 'overturned' }, APPEAL_REVIEWER, 'invalid_state')
  assert.equal(state.releases[id(10)].unpublished.by, 'platform', 'the removal stays')
  assert.equal(isPublic(state.releases[id(10)], DEMO_NOW), false)
})

test('reinstating a hold settles the open appeal against it', () => {
  let state = ok(SEED_STATE, { type: 'file_appeal', releaseId: id(10), appealedCaseId: 'case-r10-2', message: 'These snares were recorded in my kitchen.' })
  const appeal = openAppeal(state, id(10))
  state = ok(state, { type: 'reinstate', releaseId: id(10) }, REVIEWER)
  assert.equal(openAppeal(state, id(10)), undefined)
  assert.equal(state.appeals[appeal.id].status, 'overturned')
  assert.equal(state.cases[appeal.appealCaseId].status, 'dismissed')
  const view = releaseView(state, state.releases[id(10)], DEMO_NOW)
  assert.equal(view.chips.primary, 'live')
  assert.notEqual(view.chips.secondary, 'appeal_in_progress')
  refused(state, { type: 'decide_appeal', appealId: appeal.id, outcome: 'upheld', statement: statement('suspended', 'other') }, APPEAL_REVIEWER, 'invalid_state')
  sellerCanStillEdit(state, 10)
})

test('one open appeal per release', () => {
  const state = ok(appealedR13(SEED_STATE), SUSPEND(13), REVIEWER)
  const hold = state.releases[id(13)].suspension.caseId
  refused(state, { type: 'file_appeal', releaseId: id(13), appealedCaseId: hold, message: 'The kitchen recordings are all mine.' }, SELLER, 'appeal_exists')
})

/* ------------------------------------------------------------------ */
/* Timeline order, Market links and the buyers panel                   */
/* ------------------------------------------------------------------ */

test('the timeline puts a decision above the "Review started" emitted with it', () => {
  let state = ok(SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER)
  let timeline = sellerTimeline(state, id(2))
  assert.equal(timeline[0].at, timeline[1].at, 'one action, one time')
  assert.deepEqual(timeline.slice(0, 2).map((e) => e.type), ['update_went_live', 'review_started'])

  state = appealedR13(SEED_STATE)
  state = ok(state, { type: 'decide_appeal', appealId: openAppeal(state, id(13)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  timeline = sellerTimeline(state, id(13))
  assert.deepEqual(timeline.slice(0, 2).map((e) => e.type), ['update_went_live', 'appeal_overturned'])
})

test('"View on Market" appears only for releases the Market has a page for', () => {
  // Linked seed releases open their item page; songs open Stream.
  assert.equal(publicHrefFor(SEED_STATE.releases[id(2)]), '/market/tidewater-drums')
  assert.equal(publicHrefFor(SEED_STATE.releases[id(1)]), '/stream')
  const tidewater = ok(SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER)
  assert.ok(actionsOf(tidewater, 2).some((a) => a.id === 'view_public'))

  // Moth Glow (R3) has no Market row, so approving it adds no link that would 404.
  const approved = ok(SEED_STATE, { type: 'approve', caseId: lastCaseOf(SEED_STATE, open(SEED_STATE, id(3))) }, REVIEWER)
  assert.equal(approved.releases[id(3)].status, 'live')
  assert.equal(getItem(approved.releases[id(3)].slug), null)
  assert.equal(publicHrefFor(approved.releases[id(3)]), null)
  assert.ok(!actionsOf(approved, 3).some((a) => a.id === 'view_public'))
})

test('a new release never takes a category key or a seed listing slug', () => {
  const slugFor = (title) => {
    const { state, releaseId } = newSamplePack(SEED_STATE)
    const payload = { ...open(state, releaseId).payload, title }
    return ok(state, { type: 'save_draft', releaseId, payload }).releases[releaseId].slug
  }
  assert.equal(slugFor('Samples'), 'samples-2')
  // /market/songs redirects to Stream (D19), so it stays reserved.
  assert.equal(slugFor('Songs'), 'songs-2')
  assert.equal(getItem('velvet-pads').source, 'seed')
  assert.equal(slugFor('Velvet Pads'), 'velvet-pads-2')
  assert.equal(slugFor('Saltmarsh Kit'), 'saltmarsh-kit')
})

test('earnings count each version at its own price (L6) and include an exclusive sale', () => {
  const earned = (state, n) => demoEarnings(state.releases[id(n)], revisionsFor(state, n))
  const before = earned(SEED_STATE, 2)
  const approved = ok(SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER)
  assert.deepEqual(current(approved, id(2)).payload.price, { kind: 'credits', credits: 70 })
  assert.equal(earned(approved, 2), before, 'approving a new price rewrites no past earnings')

  const r13Before = earned(SEED_STATE, 13)
  let r13 = appealedR13(SEED_STATE)
  r13 = ok(r13, { type: 'decide_appeal', appealId: openAppeal(r13, id(13)).id, outcome: 'overturned' }, APPEAL_REVIEWER)
  assert.equal(earned(r13, 13), r13Before)

  // Night Bus: 15 leases plus the exclusive sale that took it off sale.
  const nightBus = SEED_STATE.releases[id(15)]
  assert.equal(nightBus.unpublished.cause, 'exclusive_sold')
  const leasesOnly = demoEarnings({ ...nightBus, unpublished: null }, revisionsFor(SEED_STATE, 15))
  assert.ok(earned(SEED_STATE, 15) > leasesOnly)
})

test('every rule in TRANSITIONS was exercised', () => {
  const missing = TRANSITIONS.map((r) => r.id).filter((ruleId) => !covered.has(ruleId))
  assert.deepEqual(missing, [])
})
