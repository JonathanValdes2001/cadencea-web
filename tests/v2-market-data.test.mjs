import { test } from 'node:test'
import assert from 'node:assert/strict'

// The Market seed (WEB-V2-SPEC §6.4–§6.5): slugs, counts, sellers, and the
// CREDITS-MODEL §6 and RELEASE-LIFECYCLE §3 pricing and content rules.
import { MARKET_ITEMS, getItem } from '../lib/v2-demo/market/items.ts'
import { LINKED_DETAILS, LINKED_RELEASE_IDS, linkedSeedView } from '../lib/v2-demo/market/linked.ts'
import { SEED_LISTINGS, buildListings, seedListing } from '../lib/v2-demo/market/resolve.ts'
import { countFiles, generateFiles } from '../lib/v2-demo/market/files.ts'
import { PRICED_KINDS, SINGLE_FILE_CREDITS, creditPrice, itemCount } from '../lib/v2-demo/market/display.ts'
import { CATEGORY_KEYS, RESERVED_MARKET_SEGMENTS } from '../lib/v2-demo/categories.ts'
import { getSeller } from '../lib/v2-demo/sellers.ts'
import { CREDITS } from '../lib/v2-demo/credits/config.ts'
import { LIBRARY_SEED } from '../lib/v2-demo/credits/library-seed.ts'
import { LEASE_TIER_IDS } from '../lib/v2-demo/release-lifecycle/types.ts'
import { SEED_STATE } from '../lib/v2-demo/release-lifecycle/seeds.ts'

/** WEB-V2-SPEC §6.5: the Market rows backed by RELEASE-LIFECYCLE §7.4's seeds. */
const LIFECYCLE_SLUGS = {
  'late-ferry': 'demo-r01',
  'tidewater-drums': 'demo-r02',
  'ice-road': 'demo-r07',
  'harbor-lights': 'demo-r08',
  'old-synth-memories': 'demo-r09',
  'copper-kit': 'demo-r10',
  'glass-steps': 'demo-r11',
  'kitchen-percussion': 'demo-r13',
  coastline: 'demo-r14',
  'night-bus': 'demo-r15',
}
const HIDDEN_AT_SEED = ['copper-kit', 'old-synth-memories', 'glass-steps', 'night-bus', 'harbor-lights']
const ON_SALE_PER_CATEGORY = { samples: 12, splits: 5, presets: 7, midi: 5, beats: 7, songs: 6, themes: 3 }

const seedRows = MARKET_ITEMS.filter((item) => item.source === 'seed')
const listingsOf = (type) => SEED_LISTINGS.filter((l) => l.type === type)
const filesOf = (l) => generateFiles(l.slug, l.files, l)

test('50 listings with unique slugs that never shadow a category or the seller route', () => {
  assert.equal(MARKET_ITEMS.length, 50)
  assert.equal(SEED_LISTINGS.length, 50)
  const slugs = MARKET_ITEMS.map((i) => i.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const slug of slugs) {
    assert.ok(!RESERVED_MARKET_SEGMENTS.includes(slug), `${slug} is reserved`)
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/)
  }
  assert.deepEqual([...RESERVED_MARKET_SEGMENTS].sort(), [...CATEGORY_KEYS, 'u'].sort())
})

test('45 listings are on sale at seed time, with the §6.4 count per category', () => {
  const onSale = SEED_LISTINGS.filter((l) => l.isPublic)
  assert.equal(onSale.length, 45)
  for (const key of CATEGORY_KEYS) {
    const n = onSale.filter((l) => l.category === key).length
    assert.equal(n, ON_SALE_PER_CATEGORY[key], key)
    assert.ok(n >= 3, `${key} needs at least 3 on-sale listings`)
  }
  assert.deepEqual(
    SEED_LISTINGS.filter((l) => !l.isPublic).map((l) => l.slug).sort(),
    [...HIDDEN_AT_SEED].sort(),
  )
})

test('every seller resolves, and Nightjar sells only its linked releases', () => {
  for (const item of MARKET_ITEMS) {
    const seller = getSeller(item.seller)
    assert.ok(seller, `${item.slug}: unknown seller ${item.seller}`)
    assert.ok(seller.sells.includes(SEED_LISTINGS.find((l) => l.slug === item.slug).category), `${item.slug}`)
    assert.equal(item.seller === 'nightjar', item.source === 'lifecycle', item.slug)
  }
})

test('the ten lifecycle rows carry RELEASE-LIFECYCLE §7.4 release ids and no data of their own', () => {
  const linked = MARKET_ITEMS.filter((i) => i.source === 'lifecycle')
  assert.deepEqual(Object.fromEntries(linked.map((i) => [i.slug, i.releaseId])), LIFECYCLE_SLUGS)
  for (const item of linked) {
    assert.match(item.releaseId, /^demo-r(0[1-9]|1[0-6])$/)
    for (const field of ['bpm', 'key', 'tags', 'price', 'files']) assert.ok(!(field in item), `${item.slug}.${field}`)
    const release = SEED_STATE.releases[item.releaseId]
    assert.ok(linkedSeedView(item.releaseId), item.releaseId)
    assert.equal(release.slug, item.slug)
    assert.equal(release.type, item.type)
    assert.equal(release.sellerHandle, 'nightjar')
    assert.equal(seedListing(item.slug).title, linkedSeedView(item.releaseId).title)
  }
  assert.deepEqual([...LINKED_RELEASE_IDS].sort(), Object.values(LIFECYCLE_SLUGS).sort())
  // DECISIONS.md D7: Tidewater Drums costs at most 250 credits.
  assert.ok(creditPrice(seedListing('tidewater-drums').price) <= 250)
})

test('LINKED_DETAILS still mirror the Studio seeds (seeds.ts)', () => {
  for (const id of LINKED_RELEASE_IDS) {
    const release = SEED_STATE.releases[id]
    const current = SEED_STATE.revisions[release.currentRevisionId]
    const payload = current.payload
    const detail = LINKED_DETAILS[id]
    assert.equal(detail.description, payload.description, id)
    assert.equal(detail.genre, payload.genre?.toLowerCase() ?? null, id)
    assert.deepEqual(detail.tags, payload.tags, id)
    assert.equal(detail.bpm, payload.bpm ? Number(payload.bpm.value) : null, id)
    assert.deepEqual(detail.key, payload.key?.value ?? null, id)
    assert.equal(detail.publishedAt, release.firstLiveAt, id)
    assert.equal(detail.history.at(-1).version, current.version, id)
    const deliverables = payload.samples ?? payload.presets ?? payload.loops ?? payload.midiFiles
    if (deliverables) assert.equal(countFiles(detail.files, ['one_shot', 'loop', 'preset', 'midi']), deliverables.length, id)
    if (payload.kind === 'song') assert.deepEqual(detail.song, { format: payload.format, tracks: payload.tracks.length }, id)
    if (payload.kind === 'preset_pack') assert.equal(detail.synth, payload.synth, id)
  }
})

test('credit packs: price ranges, steps and never above their items one by one', () => {
  const { pack, midiPack, originalsPack } = CREDITS.priceList
  for (const l of SEED_LISTINGS.filter((l) => PRICED_KINDS[l.type])) {
    const credits = creditPrice(l.price)
    assert.notEqual(credits, null, `${l.slug} has a credit price`)
    if (l.type === 'splits_pack') continue
    const items = itemCount(l.type, l.files)
    const range = l.sellerHandle === 'cadencea' ? originalsPack : l.type === 'midi_pack' ? midiPack : pack
    assert.ok(credits >= range.min && credits <= range.max, `${l.slug}: ${credits} outside ${range.min}–${range.max}`)
    assert.equal(credits % 10, 0, `${l.slug}: steps of 10`)
    const unit = SINGLE_FILE_CREDITS[PRICED_KINDS[l.type][0]]
    assert.ok(credits <= items * unit, `${l.slug}: ${credits} credits for ${items} items`)
  }
})

test('content minimums (RELEASE-LIFECYCLE §3): samples ≥ 20, presets ≥ 15 for one synth, MIDI ≥ 10', () => {
  for (const l of listingsOf('sample_pack')) assert.ok(itemCount(l.type, l.files) >= 20, l.slug)
  for (const l of listingsOf('preset_pack')) {
    assert.ok(['serum2', 'vital'].includes(l.synth), `${l.slug} names its synth`)
    assert.ok(l.minSynthVersion, `${l.slug} names the minimum synth version`)
    assert.ok(itemCount(l.type, l.files) >= 15, l.slug)
    assert.equal(countFiles(l.files, ['demo']), 1, `${l.slug} has an audio demo`)
  }
  for (const l of listingsOf('midi_pack')) {
    assert.ok(itemCount(l.type, l.files) >= 10, l.slug)
    assert.equal(countFiles(l.files, ['demo']), 1, `${l.slug} has an audio demo`)
  }
})

test('Splits packs: ≥ 5 loops, 0–100 credits in tens, at most 1 credit per loop, cadencea_splits_v1 terms', () => {
  const { splitsPack } = CREDITS.priceList
  for (const l of listingsOf('splits_pack')) {
    const loops = itemCount(l.type, l.files)
    const credits = creditPrice(l.price)
    assert.ok(loops >= 5, l.slug)
    assert.ok(credits >= splitsPack.min && credits <= splitsPack.max && credits % splitsPack.step === 0, l.slug)
    assert.ok(credits <= loops * CREDITS.priceList.splitsLoop.max, `${l.slug}: ${credits} credits for ${loops} loops`)
    const terms = l.splitTerms
    assert.equal(terms.templateId, 'cadencea_splits_v1')
    assert.ok([25, 50].includes(terms.publishingSharePct), l.slug)
    assert.ok([0, 25, 50].includes(terms.advanceSharePct), l.slug)
    assert.ok(terms.creditLine.length <= 80)
    assert.equal(terms.creditLine, `co-prod. by ${getSeller(l.sellerHandle).displayName}`)
  }
  // A Splits pack at no charge uses the `free` price kind, which renders "0 credits".
  assert.ok(listingsOf('splits_pack').some((l) => l.price.kind === 'free'))
})

test('beats: lease tier ids and card prices inside CREDITS-MODEL §6.2', () => {
  for (const l of listingsOf('beat')) {
    assert.equal(l.price.kind, 'per_tier', l.slug)
    assert.ok(l.leaseTiers.length >= 1, l.slug)
    assert.equal(new Set(l.leaseTiers.map((t) => t.tier)).size, l.leaseTiers.length)
    for (const { tier, priceEurCents } of l.leaseTiers) {
      assert.ok(LEASE_TIER_IDS.includes(tier), `${l.slug}: ${tier}`)
      const range = CREDITS.beatTiers[tier]
      const eur = priceEurCents / 100
      assert.ok(eur >= range.minEur && (range.maxEur === null || eur <= range.maxEur), `${l.slug} ${tier}: €${eur}`)
    }
  }
  assert.deepEqual(
    seedListing('cold-concrete').leaseTiers.map((t) => [t.tier, t.priceEurCents]),
    [['wav', 3000], ['stems', 7500], ['unlimited', 15000], ['exclusive', 65000]],
  )
})

test('songs are stream only and themes cost 30 or 80 credits', () => {
  for (const l of listingsOf('song')) assert.equal(l.price.kind, 'stream_only', l.slug)
  for (const l of listingsOf('theme')) {
    assert.ok([CREDITS.priceList.themeStandard, CREDITS.priceList.themePremium].includes(creditPrice(l.price)), l.slug)
    assert.equal(l.sellerHandle, 'cadencea')
  }
  assert.equal(creditPrice(seedListing('theme-celestia').price), 80)
})

test('the slugs other v2 data points at exist', () => {
  // STREAM-SPEC's Low Tide Tapes credits this pack as a licensed sample.
  assert.equal(getItem('driftwood-drums')?.title, 'Driftwood Drums Vol. 1')
  // Maya's seeded library (CREDITS-MODEL §10) names items by slug.
  for (const entry of LIBRARY_SEED.entries) {
    const listing = seedListing(entry.slug)
    assert.ok(listing, entry.slug)
    if (entry.fileId) assert.ok(filesOf(listing).some((f) => f.id === entry.fileId), `${entry.slug}#${entry.fileId}`)
  }
  const rhodes = filesOf(seedListing('copper-tape-loops')).find((f) => f.id === 'midnight-rhodes-92')
  assert.equal(rhodes.name, 'Midnight Rhodes 92 BPM.wav')
  assert.equal(rhodes.bpm, 92)
  assert.equal(seedListing('tape-drums-vol-1').sellerHandle, 'cadencea')
})

test('generated files are deterministic, uniquely named and realistic', () => {
  for (const l of SEED_LISTINGS.filter((l) => l.files)) {
    const files = filesOf(l)
    assert.equal(files.length, countFiles(l.files))
    assert.equal(new Set(files.map((f) => f.id)).size, files.length, `${l.slug}: duplicate file ids`)
    assert.deepEqual(filesOf(l), files)
    for (const f of files) {
      assert.match(f.name, f.kind === 'midi' ? /\.mid$/ : f.kind === 'preset' ? /\.(vital|SerumPreset)$/ : /\.wav$/)
      assert.ok(f.bytes > 200, `${f.name} has a size`)
      if (f.kind !== 'preset') assert.ok(f.durationMs > 0, `${f.name} has a length`)
    }
  }
})

test('every seed row has a 2–4 sentence description, a June–October 2026 date and a live version', () => {
  for (const item of seedRows) {
    const sentences = item.description.split(/(?<=[.?!])\s+/).filter(Boolean).length
    assert.ok(sentences >= 2 && sentences <= 4, `${item.slug}: ${sentences} sentences`)
    assert.ok(item.publishedAt >= '2026-06-01' && item.publishedAt < '2026-10-11', item.slug)
    assert.equal(item.versions[0].date, item.publishedAt, item.slug)
    item.versions.forEach((v, i) => assert.equal(v.version, i + 1, item.slug))
  }
  assert.equal(seedListing('driftwood-drums').version, 2)
  assert.equal(seedListing('neon-cathedral').version, 2)
  assert.equal(seedListing('dusty-keys').version, 1)
  assert.ok(SEED_LISTINGS.filter((l) => l.featured).length >= 3)
})

test('a linked release follows the lifecycle store, and approved demo releases join the grids', () => {
  const asListing = (releaseId, view) => {
    const release = SEED_STATE.releases[releaseId]
    const payload = SEED_STATE.revisions[release.currentRevisionId].payload
    return {
      ...view,
      releaseId,
      slug: release.slug,
      type: release.type,
      sellerHandle: release.sellerHandle,
      bpm: payload.bpm?.value ?? null,
      key: payload.key?.value ?? null,
      tags: payload.tags,
    }
  }
  const approved = {
    ...linkedSeedView('demo-r02'),
    version: 3,
    updatedAt: '2026-10-10T12:00:05Z',
    whatsNew: 'New cover and 6 more one-shots.',
    coverSeed: 'demo-r02-cover-b',
    price: { kind: 'credits', credits: 70 },
  }
  const relisted = { ...linkedSeedView('demo-r09'), isPublic: true, status: 'live' }
  const demo = { ...asListing('demo-r13', linkedSeedView('demo-r13')), releaseId: 'demo-r05', slug: 'untitled-loop-kit' }
  const listings = buildListings({ 'demo-r02': approved, 'demo-r09': relisted }, [
    asListing('demo-r02', approved),
    asListing('demo-r09', relisted),
    demo,
  ])
  const tidewater = listings.find((l) => l.slug === 'tidewater-drums')
  assert.equal(tidewater.version, 3)
  assert.equal(tidewater.coverSeed, 'demo-r02-cover-b')
  assert.deepEqual(tidewater.price, { kind: 'credits', credits: 70 })
  assert.deepEqual(tidewater.versions.map((v) => v.version), [1, 2, 3])
  assert.equal(tidewater.whatsNew, 'New cover and 6 more one-shots.')
  assert.equal(listings.find((l) => l.slug === 'old-synth-memories').isPublic, true)
  const card = listings.find((l) => l.releaseId === 'demo-r05')
  assert.equal(card.demoRelease, true)
  assert.equal(card.href, '/studio/demo-r05')
  assert.equal(listings.length, 51)
  // Linked releases never appear twice, even though usePublicReleases lists them.
  assert.equal(listings.filter((l) => l.slug === 'tidewater-drums').length, 1)
  // Late Ferry has a €3 download sale in Studio, but songs are stream only in the Market (WEB-V2-SPEC §7.2 #2).
  assert.equal(linkedSeedView('demo-r01').price.kind, 'card')
  assert.equal(seedListing('late-ferry').price.kind, 'stream_only')
})
