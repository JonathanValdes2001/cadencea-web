import { test } from 'node:test'
import assert from 'node:assert/strict'

// Seams between the v2 packages (WEB-V2-SPEC §8.6 #2, §8.7): a Studio decision
// reaches the Market item page whole (RELEASE-LIFECYCLE §7.5 step 2), not just
// its title, price and cover. Loaded through Node's type stripping, like the
// other v2 tests.
import { applyAction } from '../lib/v2-demo/release-lifecycle/machine.ts'
import { SEED_STATE } from '../lib/v2-demo/release-lifecycle/seeds.ts'
import { toPublicView } from '../lib/v2-demo/release-lifecycle/selectors.ts'
import { buildListings, seedListing } from '../lib/v2-demo/market/resolve.ts'
import { listingFiles } from '../lib/v2-demo/market/files.ts'
import { cardMeta } from '../lib/v2-demo/market/display.ts'
import { DEMO_NOW } from '../lib/v2-demo/clock.ts'

const REVIEWER = { kind: 'reviewer', reviewerId: 'demo-reviewer' }

test('the seed version of a linked pack renders its own contents, with the seed description', () => {
  const listing = seedListing('tidewater-drums')
  const seed = SEED_STATE.revisions[SEED_STATE.releases['demo-r02'].currentRevisionId].payload
  assert.equal(listing.version, 2)
  assert.equal(listing.revisionFiles, null)
  assert.equal(listing.description, seed.description)
  assert.equal(listingFiles(listing).length, seed.samples.length)
})

test('approving Tidewater Drums version 3 brings its description and contents to the Market', () => {
  const result = applyAction(SEED_STATE, { type: 'approve', caseId: 'case-r02-3' }, REVIEWER, DEMO_NOW)
  assert.ok(result.ok, result.error)
  const view = toPublicView(result.state, 'demo-r02', DEMO_NOW)
  const v3 = result.state.revisions[result.state.releases['demo-r02'].currentRevisionId].payload

  const listing = buildListings({ 'demo-r02': view }, []).find((l) => l.slug === 'tidewater-drums')
  assert.equal(listing.version, 3)
  assert.deepEqual(listing.price, { kind: 'credits', credits: 70 })
  assert.equal(listing.description, v3.description)

  const files = listingFiles(listing)
  assert.equal(files.length, v3.samples.length)
  const byName = new Map(files.map((f) => [f.name, f]))
  // RELEASE-LIFECYCLE §7.4 R2: six shaker one-shots added, two loops renamed.
  for (const n of ['09', '10', '11', '12', '13', '14']) assert.equal(byName.get(`Tidewater Shaker ${n}.wav`)?.kind, 'one_shot', n)
  assert.equal(byName.get('Tidewater Groove 92 BPM.wav')?.kind, 'loop')
  assert.ok(!byName.has('Tidewater Loop 01.wav'), 'renamed files keep only their new name')
  assert.equal(new Set(files.map((f) => f.id)).size, files.length, 'file anchors stay unique')
  assert.ok(cardMeta(listing).includes(`${files.length} files`), 'the card counts the new contents')
})
