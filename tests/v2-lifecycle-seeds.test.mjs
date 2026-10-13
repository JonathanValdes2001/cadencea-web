import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// RELEASE-LIFECYCLE §7.4 and §7.6: the 16 Studio seeds load, satisfy the §4.4
// invariants, produce the documented tab and attention counts, use RL's slugs
// (and WEB-V2-SPEC §6.5's Market slugs), and every date check runs on the demo
// clock, so R8 stays scheduled and R6's appeal stays open whenever the demo runs.
import {
  RELEASE_STATUSES,
  REVISION_STATUSES,
  RELEASE_LIFECYCLE_SPEC_VERSION,
  isPublic,
  RELEASE_TYPE_INFO,
} from '../lib/v2-demo/release-lifecycle/types.ts'
import { SEED_RELEASE_IDS, SEED_STATE, seedPublicView } from '../lib/v2-demo/release-lifecycle/seeds.ts'
import {
  appealOption,
  attentionCount,
  channelLabel,
  publicListings,
  releaseView,
  tabCounts,
  versionLine,
} from '../lib/v2-demo/release-lifecycle/selectors.ts'
import { validatePayload } from '../lib/v2-demo/release-lifecycle/validation.ts'
import { GENRES } from '../lib/v2-demo/release-lifecycle/options.ts'
import { VAULT_PROJECTS } from '../lib/v2-demo/release-lifecycle/vault-projects.ts'
import { CREDITS } from '../lib/v2-demo/credits/config.ts'
import { PERSONA } from '../lib/v2-demo/sellers.ts'
import { DEMO_NOW } from '../lib/v2-demo/clock.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const id = (n) => `demo-r${String(n).padStart(2, '0')}`

/** RL §7.4: id → [type, title, slug, release status]. */
const RL_SEEDS = {
  1: ['song', 'Late Ferry', 'late-ferry', 'live'],
  2: ['sample_pack', 'Tidewater Drums', 'tidewater-drums', 'live'],
  3: ['beat', 'Moth Glow', 'moth-glow', 'in_review'],
  4: ['preset_pack', 'Fog Choir Pads', 'fog-choir-pads', 'changes_requested'],
  5: ['sample_pack', 'Untitled Loop Kit', 'untitled-loop-kit', 'draft'],
  6: ['song', 'Basement Sessions', 'basement-sessions', 'rejected'],
  7: ['beat', 'Ice Road', 'ice-road', 'live'],
  8: ['song', 'Harbor Lights', 'harbor-lights', 'live'],
  9: ['preset_pack', 'Old Synth Memories', 'old-synth-memories', 'unpublished'],
  10: ['sample_pack', 'Copper Kit', 'copper-kit', 'suspended'],
  11: ['beat', 'Glass Steps', 'glass-steps', 'unpublished'],
  12: ['song', 'Paper Moons', 'paper-moons', 'in_review'],
  13: ['sample_pack', 'Kitchen Percussion', 'kitchen-percussion', 'live'],
  14: ['song', 'Coastline', 'coastline', 'live'],
  15: ['beat', 'Night Bus', 'night-bus', 'unpublished'],
  16: ['sample_pack', 'Vocal Chops', 'vocal-chops', 'rejected'],
}

/** WEB-V2-SPEC §6.5: the ten Market rows that read their data from a seed. */
const MARKET_LINKS = {
  1: 'late-ferry',
  2: 'tidewater-drums',
  7: 'ice-road',
  8: 'harbor-lights',
  9: 'old-synth-memories',
  10: 'copper-kit',
  11: 'glass-steps',
  13: 'kitchen-percussion',
  14: 'coastline',
  15: 'night-bus',
}

const views = () => Object.values(SEED_STATE.releases).map((r) => releaseView(SEED_STATE, r, DEMO_NOW))

test('the 16 seeds load as demo-r01…demo-r16 with RL §7.4 types, titles, slugs and statuses', () => {
  assert.equal(SEED_STATE.specVersion, RELEASE_LIFECYCLE_SPEC_VERSION)
  assert.deepEqual(SEED_RELEASE_IDS, Array.from({ length: 16 }, (_, i) => id(i + 1)))
  assert.equal(Object.keys(SEED_STATE.releases).length, 16)
  for (const [n, [type, title, slug, status]] of Object.entries(RL_SEEDS)) {
    const release = SEED_STATE.releases[id(Number(n))]
    assert.ok(release, `missing ${id(n)}`)
    assert.equal(release.type, type, `${id(n)} type`)
    assert.equal(release.slug, slug, `${id(n)} slug`)
    assert.equal(release.status, status, `${id(n)} status`)
    const shown = releaseView(SEED_STATE, release, DEMO_NOW).shown
    assert.equal(shown.payload.title, title, `${id(n)} title`)
    assert.equal(release.sellerId, PERSONA.userId, 'Nightjar is Maya Lind (DECISIONS.md D1)')
    assert.equal(release.sellerHandle, 'nightjar')
  }
})

test('the Market-linked seeds use WEB-V2-SPEC §6.5 slugs, and no two seeds share a slug', () => {
  for (const [n, slug] of Object.entries(MARKET_LINKS)) assert.equal(SEED_STATE.releases[id(Number(n))].slug, slug)
  const slugs = Object.values(SEED_STATE.releases).map((r) => r.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})

test('every seed satisfies the §4.4 invariants', () => {
  const firstStatuses = ['draft', 'in_review', 'changes_requested', 'rejected']
  for (const release of Object.values(SEED_STATE.releases)) {
    const label = release.id
    const revisions = release.revisionIds.map((rid) => SEED_STATE.revisions[rid])
    assert.ok(revisions.every(Boolean), `${label} revisions exist`)
    assert.ok(revisions.every((r) => r.releaseId === release.id), `${label} revisions belong to it`)

    // 1–3: the current revision decides which statuses are possible.
    if (release.currentRevisionId === null) {
      assert.ok(firstStatuses.includes(release.status), `${label} (1)`)
      assert.equal(release.status, revisions[0].status, `${label} (2) mirrors revision #1`)
    } else {
      assert.ok(['live', 'unpublished', 'suspended'].includes(release.status), `${label} (3)`)
    }

    // 4: at most one open revision, and openRevisionId points at it.
    const openAppeals = Object.values(SEED_STATE.appeals).filter((a) => a.releaseId === release.id && a.status === 'open')
    const isOpen = (r) =>
      ['draft', 'in_review', 'changes_requested'].includes(r.status) ||
      (r.status === 'rejected' && openAppeals.some((a) => a.revisionId === r.id))
    const open = revisions.filter(isOpen)
    assert.ok(open.length <= 1, `${label} (4) one open revision`)
    assert.equal(release.openRevisionId, open[0]?.id ?? null, `${label} (4) openRevisionId`)

    // 5–6: versions are set only on approval, run 1..n, and the current one is the highest.
    const approved = revisions.filter((r) => r.status === 'approved')
    assert.ok(revisions.every((r) => (r.version !== null) === (r.status === 'approved')), `${label} (6)`)
    assert.deepEqual(approved.map((r) => r.version).sort((a, b) => a - b), approved.map((_, i) => i + 1), `${label} (6) no gaps`)
    if (release.currentRevisionId) {
      const current = SEED_STATE.revisions[release.currentRevisionId]
      assert.equal(current.status, 'approved', `${label} (5)`)
      assert.equal(current.version, approved.length, `${label} (5) highest version`)
      assert.ok(approved.filter((r) => r.id !== current.id).every((r) => r.supersededAt), `${label} older versions superseded`)
    }

    // Seqs are 1..n and never reused.
    assert.deepEqual(revisions.map((r) => r.seq), revisions.map((_, i) => i + 1), `${label} seqs`)

    // 8: public only when live and not scheduled.
    if (isPublic(release, DEMO_NOW)) assert.equal(release.status, 'live', `${label} (8)`)
  }

  // 9: events are in order, with unique ids, and internal ones are the internal types.
  const events = SEED_STATE.events
  for (let i = 1; i < events.length; i += 1) assert.ok(Date.parse(events[i - 1].at) <= Date.parse(events[i].at), 'events oldest first')
  assert.equal(new Set(events.map((e) => e.id)).size, events.length)
  for (const event of events) {
    const internal = ['draft_saved', 'auto_checks_completed', 'publish_failed'].includes(event.type)
    assert.equal(event.visibility, internal ? 'internal' : 'seller', `${event.id} visibility`)
  }
})

test('cases and appeals point at real releases and revisions', () => {
  for (const c of Object.values(SEED_STATE.cases)) {
    assert.ok(SEED_STATE.releases[c.releaseId], `${c.id} release`)
    if (c.revisionId) assert.ok(SEED_STATE.revisions[c.revisionId], `${c.id} revision`)
    assert.equal(c.decision !== null, c.status === 'decided', `${c.id} decision matches status`)
    if (c.decision) assert.ok(c.decidedBy, `${c.id} decided by someone`)
  }
  for (const a of Object.values(SEED_STATE.appeals)) {
    assert.ok(SEED_STATE.cases[a.appealedCaseId], `${a.id} appealed case`)
    assert.equal(SEED_STATE.cases[a.appealCaseId].kind, 'appeal')
    assert.notEqual(SEED_STATE.cases[a.appealCaseId].decidedBy, SEED_STATE.cases[a.appealedCaseId].decidedBy, 'a different reviewer')
  }
})

test('tab counts and the attention callout match RL §7.4 and §6.1', () => {
  assert.deepEqual(tabCounts(SEED_STATE, DEMO_NOW), {
    all: 16,
    drafts: 2,
    in_review: 2,
    live: 6,
    update_in_review: 1,
    needs_changes: 2,
    rejected_unpublished: 6,
  })
  assert.equal(attentionCount(SEED_STATE, DEMO_NOW), 5, '"5 releases need your attention" (R4, R6, R7, R10, R11)')
})

test('the seeds cover every release status, revision status, case status and appeal state', () => {
  const releaseStatuses = new Set(Object.values(SEED_STATE.releases).map((r) => r.status))
  assert.deepEqual([...RELEASE_STATUSES].filter((s) => !releaseStatuses.has(s)), [])
  const revisionStatuses = new Set(Object.values(SEED_STATE.revisions).map((r) => r.status))
  assert.deepEqual([...REVISION_STATUSES].filter((s) => !revisionStatuses.has(s)), [])
  const caseStatuses = new Set(Object.values(SEED_STATE.cases).map((c) => c.status))
  for (const s of ['queued', 'in_progress', 'decided']) assert.ok(caseStatuses.has(s), `a ${s} case`)
  const unpublishedBy = new Set(Object.values(SEED_STATE.releases).filter((r) => r.unpublished).map((r) => r.unpublished.by))
  assert.deepEqual([...unpublishedBy].sort(), ['platform', 'seller', 'system'])
  const appealStatuses = new Set(Object.values(SEED_STATE.appeals).map((a) => a.status))
  assert.ok(appealStatuses.has('open') && appealStatuses.has('upheld'))
  const chips = new Set(views().flatMap((v) => [v.chips.primary, v.chips.secondary].filter(Boolean)))
  for (const chip of ['scheduled', 'removed', 'sold_exclusive', 'suspended', 'update_in_review', 'update_draft', 'update_changes_requested', 'update_appealed']) {
    assert.ok(chips.has(chip), `chip ${chip}`)
  }
})

test('at DEMO_NOW R8 is scheduled and R6\'s appeal is open, whatever the machine date', () => {
  const r8 = releaseView(SEED_STATE, SEED_STATE.releases[id(8)], DEMO_NOW)
  assert.equal(r8.chips.primary, 'scheduled')
  assert.equal(SEED_STATE.releases[id(8)].goesPublicAt, '2026-10-24T00:00:00Z')
  assert.equal(isPublic(SEED_STATE.releases[id(8)], DEMO_NOW), false)

  const r6 = appealOption(SEED_STATE, releaseView(SEED_STATE, SEED_STATE.releases[id(6)], DEMO_NOW), DEMO_NOW)
  assert.equal(r6.windowClosed, false)
  assert.equal(r6.appeal, null)
  assert.ok(r6.until.startsWith('2027-04'), 'appeal available until Apr 2027')
})

test('nothing in the lifecycle code or its UI reads the machine clock (§7.2)', async () => {
  const dirs = ['lib/v2-demo/release-lifecycle', 'components/v2/publish', 'components/v2/studio']
  for (const dir of dirs) {
    if (!existsSync(path.join(root, dir))) continue
    for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
      if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue
      const source = await readFile(path.join(root, dir, entry.name), 'utf8')
      assert.doesNotMatch(source, /Date\.now\(|new Date\(\)/, `${dir}/${entry.name} reads the machine clock`)
    }
  }
})

test('version lines follow §6.2', () => {
  const line = (n) => versionLine(releaseView(SEED_STATE, SEED_STATE.releases[id(n)], DEMO_NOW))
  assert.equal(line(2), 'v2 live · v3 in review')
  assert.equal(line(13), 'v1 live · update draft')
  assert.equal(line(1), 'v2 live')
  assert.equal(line(5), 'Revision #1')
  assert.equal(line(3), 'Not live yet')
})

test('seedPublicView gives the Market the current approved version only', () => {
  const r2 = seedPublicView(id(2))
  assert.equal(r2.version, 2, 'v3 is pending, so buyers see v2')
  assert.equal(r2.isPublic, true)
  assert.equal(r2.price.kind, 'credits')
  assert.ok(r2.price.credits <= 250, 'DECISIONS.md D7: Tidewater Drums costs at most 250 credits')
  assert.equal(seedPublicView(id(1)).price.kind, 'card')
  assert.equal(seedPublicView(id(13)).version, 1)
  assert.equal(seedPublicView(id(5)), null, 'never approved: no Market page')
  for (const n of [8, 9, 10, 11, 15]) assert.equal(seedPublicView(id(n)).isPublic, false, `${id(n)} is off sale`)
  const listed = publicListings(SEED_STATE, DEMO_NOW).map((l) => l.slug).sort()
  assert.deepEqual(listed, ['coastline', 'ice-road', 'kitchen-percussion', 'late-ferry', 'tidewater-drums'])
})

test('seed payloads follow the publish rules: genres, prices, minimums', () => {
  for (const revision of Object.values(SEED_STATE.revisions)) {
    const p = revision.payload
    assert.ok(GENRES.includes(p.genre), `${revision.id} genre ${p.genre}`)
    if (revision.status === 'approved' || revision.status === 'in_review') {
      assert.deepEqual(validatePayload(p, { now: DEMO_NOW, releaseDateLocked: true }), [], `${revision.id} is valid`)
    }
    if (p.kind === 'sample_pack' || p.kind === 'preset_pack') {
      const { min, max, step } = CREDITS.priceList.pack
      const credits = p.price.credits
      assert.ok(credits >= min && credits <= max && (credits - min) % step === 0, `${revision.id} price ${credits}`)
    }
  }
  for (const project of VAULT_PROJECTS) {
    assert.ok(project.files.length >= 12 && project.files.length <= 60, `${project.name} has 12–60 files`)
    assert.ok(project.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)), `${project.name} hashes`)
  }
})

test('every "free" in release-lifecycle/copy.ts is "royalty-free" or "Free up space" (RL §7.6)', async () => {
  const source = await readFile(path.join(root, 'lib/v2-demo/release-lifecycle/copy.ts'), 'utf8')
  const strings = source.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')
  for (const match of strings.matchAll(/\bfree\b/gi)) {
    const around = strings.slice(Math.max(0, match.index - 8), match.index + 15)
    assert.match(around, /royalty-free|Free up space/i, `"${around}"`)
  }
})

// DECISIONS.md D19: songs publish to Cadencea Stream only, so Studio's channel reads "Stream".
test('songs are on Stream only; every other type is on the Market', () => {
  assert.deepEqual(RELEASE_TYPE_INFO.song.surfaces, ['stream'])
  for (const release of Object.values(SEED_STATE.releases)) {
    assert.equal(channelLabel(release), release.type === 'song' ? 'Stream' : 'Market', release.id)
  }
  // A browser that stored the older song channels still shows "Stream".
  const stale = { ...SEED_STATE.releases[id(1)], channels: ['stream', 'market'] }
  assert.equal(channelLabel(stale), 'Stream')
})
