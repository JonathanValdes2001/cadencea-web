import { test } from 'node:test'
import assert from 'node:assert/strict'

// Market search, filters, sorting and "similar sounds" (WEB-V2-SPEC §1.2,
// §4.3, §4.4), run against the seed listings.
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filterItems,
  genresOf,
  isRelatedKey,
  itemsBySeller,
  parseFilters,
  serializeFilters,
  similarItems,
  sortItems,
  topTags,
} from '../lib/v2-demo/market/queries.ts'
import { SEED_LISTINGS, seedListing } from '../lib/v2-demo/market/resolve.ts'
import { decodeKey } from '../lib/v2-demo/format.ts'

const onSale = SEED_LISTINGS.filter((l) => l.isPublic)
const inCategory = (key) => onSale.filter((l) => l.category === key)
const slugs = (listings) => listings.map((l) => l.slug)
const filters = (patch) => ({ ...EMPTY_FILTERS, ...patch })
const k = (code) => decodeKey(code)

test('BPM range, with and without half and double time', () => {
  const samples = inCategory('samples')
  // The founder script: Samples → "140+" finds Kiln Drill Kit (142 BPM).
  assert.deepEqual(slugs(filterItems(samples, filters({ bpmMin: 140 }))), ['kiln-drill-kit'])
  const midTempo = filterItems(samples, filters({ bpmMin: 120, bpmMax: 140 }))
  assert.deepEqual(slugs(midTempo).sort(), ['garage-tools', 'harbor-house-chords'])
  // 142 / 2 = 71 sits inside 60–80 only when half and double time count.
  assert.ok(!slugs(filterItems(samples, filters({ bpmMin: 60, bpmMax: 80 }))).includes('kiln-drill-kit'))
  assert.ok(slugs(filterItems(samples, filters({ bpmMin: 60, bpmMax: 80, half: true }))).includes('kiln-drill-kit'))
  // Listings without one tempo never match a BPM range.
  const ranged = slugs(filterItems(samples, filters({ bpmMin: 1, bpmMax: 999, half: true })))
  for (const slug of ['coal-808s', 'glacier-foley', 'copper-tape-loops']) assert.ok(!ranged.includes(slug), slug)
  // "Under 90" is inclusive up to 89.
  assert.ok(slugs(filterItems(samples, filters({ bpmMax: 89 }))).includes('tram-line-textures'))
  assert.ok(!slugs(filterItems(samples, filters({ bpmMax: 89 }))).includes('driftwood-drums'))
})

test('key, "No key" and related keys', () => {
  const samples = inCategory('samples')
  // The founder script: 140+ BPM and F# Minor.
  assert.deepEqual(slugs(filterItems(samples, filters({ bpmMin: 140, keys: ['F#m'] }))), ['kiln-drill-kit'])
  const noKey = slugs(filterItems(samples, filters({ keys: ['none'] })))
  assert.ok(noKey.includes('driftwood-drums') && noKey.includes('glacier-foley'))
  assert.ok(!noKey.includes('coal-808s'), 'a pack with a key per file is not "No key"')
  const either = slugs(filterItems(onSale, filters({ keys: ['Am', 'Dm'] })))
  assert.ok(either.includes('harbor-house-chords') && either.includes('tram-line-textures'))
  // Themes have no key at all.
  assert.ok(!slugs(filterItems(onSale, filters({ keys: ['none'] }))).some((s) => s.startsWith('theme-')))

  assert.ok(isRelatedKey(k('Am'), k('Am')))
  assert.ok(isRelatedKey(k('Am'), k('C')), 'relative major')
  assert.ok(isRelatedKey(k('C'), k('Am')), 'relative minor')
  assert.ok(isRelatedKey(k('Am'), k('Em')) && isRelatedKey(k('Am'), k('Dm')), 'fifths neighbors')
  assert.ok(isRelatedKey(k('F#m'), k('C#m')) && isRelatedKey(k('F#m'), k('A')))
  assert.ok(!isRelatedKey(k('Am'), k('A')), 'parallel major is not related')
  assert.ok(!isRelatedKey(k('Am'), k('Bm')))
  assert.ok(isRelatedKey(null, null) && !isRelatedKey(null, k('C')))
})

test('tags (all must match), genres (any), search and price', () => {
  assert.deepEqual(slugs(filterItems(onSale, filters({ tags: ['dark', '808'] }))).sort(), ['ice-road', 'kiln-drill-kit'])
  assert.deepEqual(slugs(filterItems(onSale, filters({ tags: ['DRILL'] }))).sort(), [
    'cold-concrete',
    'kiln-drill-kit',
    'sub-pressure',
  ])
  const genres = slugs(filterItems(onSale, filters({ genres: ['drill', 'grime'] })))
  assert.deepEqual(genres.sort(), ['cold-concrete', 'kiln-drill-kit', 'night-shift', 'sub-pressure'])

  // Search matches titles, sellers, tags and genres; every word must match.
  assert.deepEqual(slugs(filterItems(onSale, filters({ q: 'kiln theory 808' }))).sort(), [
    'coal-808s',
    'kiln-drill-kit',
    'sub-pressure',
  ])
  assert.ok(slugs(filterItems(onSale, filters({ q: 'Nightjar' }))).includes('tidewater-drums'))
  assert.deepEqual(filterItems(onSale, filters({ q: 'no such sound' })), [])

  const splits = inCategory('splits')
  assert.deepEqual(slugs(filterItems(splits, filters({ max: 0 }))).sort(), [
    'lagoon-keys',
    'paper-lanterns',
    'two-step-veil',
  ])
  assert.equal(filterItems(splits, filters({ max: 50 })).length, 5)
  assert.ok(filterItems(inCategory('samples'), filters({ max: 50 })).every((l) => l.price.credits <= 50))
  // Beats: the cheapest (WAV) lease under €40; songs have no credit price at all.
  assert.equal(filterItems(inCategory('beats'), filters({ maxEur: 40 })).length, 7)
  assert.deepEqual(slugs(filterItems(inCategory('beats'), filters({ maxEur: 30 }))), ['slow-orbit'])
  assert.deepEqual(filterItems(inCategory('songs'), filters({ max: 1000 })), [])
})

test('synth and license filters', () => {
  const presets = inCategory('presets')
  assert.deepEqual(slugs(filterItems(presets, filters({ synths: ['serum2'] }))).sort(), [
    'analog-bass',
    'neon-cathedral',
    'sub-pressure',
  ])
  assert.equal(filterItems(presets, filters({ synths: ['serum2', 'vital'] })).length, presets.length)
  const beats = inCategory('beats')
  // Unlimited leases deliver stems too, so Night Shift (WAV and Unlimited) counts.
  const stems = slugs(filterItems(beats, filters({ license: ['stems'] })))
  assert.ok(stems.includes('night-shift') && stems.includes('slow-orbit'))
  const wavOnly = { ...seedListing('night-shift'), leaseTiers: [{ tier: 'wav', priceEurCents: 3000 }] }
  assert.deepEqual(filterItems([wavOnly], filters({ license: ['stems'] })), [])
  // Ice Road's Exclusive tier is switched off in its Studio seed.
  assert.deepEqual(slugs(filterItems(beats, filters({ license: ['stems', 'exclusive'] }))).sort(), [
    'cold-concrete',
    'glass-arcade',
    'sunday-fever',
  ])
})

test('sortItems: newest, price both ways, BPM and title, with missing values last', () => {
  const newest = sortItems(onSale, 'new')
  assert.equal(newest[0].slug, 'afterimage')
  for (let i = 1; i < newest.length; i += 1) assert.ok(newest[i - 1].publishedAt >= newest[i].publishedAt)

  const cheap = sortItems(inCategory('splits'), 'price-asc')
  assert.deepEqual(slugs(cheap).slice(-2), ['amber-hour', 'bristol-rain'])
  assert.equal(sortItems(inCategory('splits'), 'price-desc')[0].slug, 'bristol-rain')
  // Across categories, songs have no price and sort last in both directions.
  assert.equal(sortItems(onSale, 'price-asc').at(-1).category, 'songs')
  assert.equal(sortItems(onSale, 'price-desc').at(-1).category, 'songs')
  // Beats compare by their cheapest lease: Velour Tape's €35 WAV lease tops the list.
  assert.equal(sortItems(onSale, 'price-desc')[0].slug, 'velour-tape')

  const byBpm = sortItems(inCategory('samples'), 'bpm-asc')
  assert.equal(byBpm[0].slug, 'tram-line-textures')
  assert.ok(byBpm.slice(-3).every((l) => typeof l.bpm !== 'number'))

  const titles = sortItems(inCategory('themes'), 'title').map((l) => l.title)
  assert.deepEqual(titles, ['Aurora Mono', 'Celestia', 'Tape Room'])
  // sortItems returns a copy.
  assert.notEqual(sortItems(onSale, 'title'), onSale)
})

test('similarItems: same category, BPM within ±8 or a related key, closest BPM first', () => {
  const kiln = seedListing('kiln-drill-kit')
  const similar = similarItems(kiln, SEED_LISTINGS)
  assert.ok(similar.length <= 4)
  for (const l of similar) {
    assert.equal(l.category, 'samples')
    assert.ok(l.isPublic)
    assert.notEqual(l.slug, kiln.slug)
  }
  // Garage Tools is 132 BPM in G Minor: neither close enough nor related.
  assert.ok(!slugs(similar).includes('garage-tools'))

  const driftwood = seedListing('driftwood-drums')
  const nearDriftwood = similarItems(driftwood, SEED_LISTINGS)
  // Dusty Keys (92) is closest; Tape Drums and Tidewater Drums tie at 96, so the title decides.
  assert.deepEqual(slugs(nearDriftwood).slice(0, 3), ['dusty-keys', 'tape-drums-vol-1', 'tidewater-drums'])
  // Off-sale linked releases never show up (Copper Kit is 96 BPM, No key).
  assert.ok(!slugs(nearDriftwood).includes('copper-kit'))

  const harbor = seedListing('harbor-house-chords')
  const related = similarItems(harbor, SEED_LISTINGS, 10)
  assert.ok(slugs(related).includes('tram-line-textures'), 'D Minor is a fifths neighbor of A Minor')
})

test('itemsBySeller, topTags and genresOf', () => {
  assert.deepEqual(slugs(itemsBySeller('arlo-beats', SEED_LISTINGS)), ['copper-tape-loops', 'dusty-keys'])
  const nightjar = slugs(itemsBySeller('nightjar', SEED_LISTINGS))
  assert.equal(nightjar.length, 5)
  assert.ok(!nightjar.includes('harbor-lights'))
  assert.equal(itemsBySeller('nobody', SEED_LISTINGS).length, 0)

  const tags = topTags(inCategory('samples'))
  assert.ok(tags.length <= 12)
  assert.equal(tags[0], 'drums')
  assert.deepEqual(topTags(inCategory('themes'), 2), ['dark', 'minimal'])
  assert.deepEqual(genresOf(inCategory('beats')), ['afrobeats', 'drill', 'grime', 'lo-fi', 'r&b', 'synth-pop', 'trap'])
})

test('parseFilters and serializeFilters round-trip, and bad values are dropped', () => {
  const full = filters({
    q: 'dark keys',
    bpmMin: 120,
    bpmMax: 140,
    half: true,
    keys: ['F#m', 'Am', 'none'],
    tags: ['dark', '808', 'uk garage'],
    genres: ['drill'],
    max: 100,
    maxEur: 40,
    synths: ['vital'],
    license: ['stems', 'exclusive'],
    sort: 'price-desc',
  })
  const query = serializeFilters(full)
  assert.match(query, /key=F%23m,Am,none/)
  assert.match(query, /bpm=120-140/)
  assert.deepEqual(parseFilters(new URLSearchParams(query)), full)
  // Next's server `searchParams` object works too.
  assert.deepEqual(parseFilters(Object.fromEntries(new URLSearchParams(query))), full)

  for (const partial of [filters({ bpmMin: 140 }), filters({ bpmMax: 89 }), filters({ sort: 'title' }), EMPTY_FILTERS]) {
    assert.deepEqual(parseFilters(new URLSearchParams(serializeFilters(partial))), partial)
  }
  assert.equal(serializeFilters(EMPTY_FILTERS), '')

  const messy = parseFilters(
    new URLSearchParams('bpm=abc-9999&key=H,Am,Am&sort=cheapest&synth=massive&lic=free&max=-5&half=yes'),
  )
  assert.deepEqual(messy, filters({ keys: ['Am'] }))
  assert.equal(activeFilterCount(full), 13)
  assert.equal(activeFilterCount(filters({ q: 'x', sort: 'title' })), 0)
})

// The browse frame (WEB-V2-SPEC §4.3): ?view= picks grid or list, defaults per
// category, and never counts as a filter.
test('the grid/list view reads and writes ?view= with a default per category', async () => {
  const { CATEGORY_TINT, DEFAULT_VIEW, parseView, serializeView } = await import('../lib/v2-demo/market/browse.ts')
  const { CATEGORY_KEYS } = await import('../lib/v2-demo/categories.ts')
  const { FILTER_PARAM_KEYS } = await import('../lib/v2-demo/market/queries.ts')

  // Packs open as the /market card grid; beats and songs as rows.
  assert.equal(DEFAULT_VIEW.samples, 'grid')
  assert.equal(DEFAULT_VIEW.beats, 'list')
  assert.equal(DEFAULT_VIEW.songs, 'list')
  for (const key of [...CATEGORY_KEYS, 'all']) {
    assert.ok(DEFAULT_VIEW[key], `${key} has a default view`)
    assert.match(CATEGORY_TINT[key].onDark, /^#[0-9A-F]{6}$/i, `${key} has a tint`)
  }

  assert.equal(parseView(new URLSearchParams('view=list'), 'samples'), 'list')
  assert.equal(parseView(new URLSearchParams(''), 'beats'), 'list')
  assert.equal(parseView(new URLSearchParams('view=table'), null), 'grid')
  assert.equal(parseView({ view: ['grid', 'list'] }, 'songs'), 'grid')
  // The default is left out of the URL, so a category link stays clean.
  assert.equal(serializeView('grid', 'samples'), '')
  assert.equal(serializeView('list', 'samples'), 'view=list')
  assert.equal(serializeView('list', 'beats'), '')
  assert.equal(serializeView('grid', 'beats'), 'view=grid')

  // On /market a view in the URL shows "All results", but it isn't a filter.
  assert.ok(FILTER_PARAM_KEYS.includes('view'))
  assert.deepEqual(parseFilters(new URLSearchParams('view=list')), EMPTY_FILTERS)
})

test('each filter button counts and clears only its own field', async () => {
  const { FIELD_CLEAR, fieldCount } = await import('../lib/v2-demo/market/browse.ts')
  const full = filters({
    bpmMin: 120,
    half: true,
    keys: ['F#m', 'Am'],
    tags: ['dark'],
    genres: ['drill'],
    maxEur: 40,
    synths: ['vital'],
    license: ['stems', 'exclusive'],
  })
  const counts = Object.fromEntries(Object.keys(FIELD_CLEAR).map((field) => [field, fieldCount(field, full)]))
  assert.deepEqual(counts, { bpm: 1, key: 2, genre: 1, tags: 1, price: 1, synth: 1, license: 2 })
  // The counts add up to the Filters button's total.
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), activeFilterCount(full))
  for (const field of Object.keys(FIELD_CLEAR)) {
    const cleared = { ...full, ...FIELD_CLEAR[field] }
    assert.equal(fieldCount(field, cleared), 0, field)
    assert.equal(activeFilterCount(cleared), activeFilterCount(full) - counts[field], field)
  }
  assert.equal({ ...full, ...FIELD_CLEAR.bpm }.half, false)
})

test('list rows name what each listing contains', async () => {
  const { rowDetail } = await import('../lib/v2-demo/market/display.ts')
  assert.equal(rowDetail(seedListing('kiln-drill-kit')), '120 files')
  assert.equal(rowDetail(seedListing('neon-cathedral')), 'Serum 2 · 64 presets')
  assert.equal(rowDetail(seedListing('amber-hour')), '12 loops')
  assert.match(rowDetail(seedListing('cold-concrete')), /^\d licenses?$/)
  assert.equal(rowDetail(seedListing('theme-celestia')), 'Vault theme')
  for (const listing of onSale) assert.ok(rowDetail(listing), listing.slug)
})
