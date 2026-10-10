import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// WEB-V2-SPEC §0.6 and §2.7: the site makes no claim the code or the Terms
// contradict. These strings all existed before the v2 copy rewrite; none may
// come back. Also checks the copy that is computed rather than written: the
// download availability line and the /stream teaser's payout numbers.
import { availabilityLabel, withTimeout } from '../components/v2/home/availability.ts'
import { PAYOUT_EXAMPLE, TEASER_RELEASES, oreToEurCents, payoutRow } from '../lib/v2-demo/stream-teaser.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

async function sourcesUnder(dir) {
  const abs = path.join(root, dir)
  if (!existsSync(abs)) return []
  const files = []
  for (const entry of await readdir(abs, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(tsx?|mjs|js)$/.test(entry.name)) continue
    const file = path.join(entry.parentPath ?? entry.path, entry.name)
    files.push({ rel: path.relative(root, file).replace(/\\/g, '/'), source: await readFile(file, 'utf8') })
  }
  return files
}

// The spec's list; "End-to-end" is matched as written, the rest in any case.
const BANNED = [
  /End-to-end/,
  /end-to-end encryption/i,
  /Most popular/i,
  /sales team/i,
  /version control/i,
  /Automatic, encrypted/i,
  /macOS 10\.15/i,
  /Ubuntu 18\.04/i,
  /music-savvy/i,
  /Building the future of music creation/i,
  /free forever/i,
  /free credits/i,
]

test('no page or component repeats a false or retired claim', async () => {
  const files = [...(await sourcesUnder('app')), ...(await sourcesUnder('components'))]
  assert.ok(files.length > 20)
  for (const { rel, source } of files) {
    for (const pattern of BANNED) {
      assert.doesNotMatch(source, pattern, `${rel} contains ${pattern}`)
    }
  }
})

// DETECT-SPEC §0 principle 3: Detect never claims AI, in words or with a sparkles icon.
test('the Detect showcase never claims AI', async () => {
  const files = await sourcesUnder('components/v2/vault')
  assert.ok(files.some((f) => f.rel.endsWith('DetectCard.tsx')))
  for (const { rel, source } of files) {
    assert.doesNotMatch(source, /\bAI\b/, `${rel} says AI`)
    assert.doesNotMatch(source, /\b(smart|intelligent|machine learning|neural|artificial intelligence)\b/i, `${rel}`)
    assert.doesNotMatch(source, /sparkle/i, `${rel} uses a sparkles icon`)
  }
})

test('pricing shows euros only, and the Vault page names the real macOS minimum', async () => {
  const pricing = await readFile(path.join(root, 'app/pricing/page.tsx'), 'utf8')
  assert.doesNotMatch(pricing, /\$\s?\d/, 'a dollar price on /pricing')
  const vault = await readFile(path.join(root, 'app/cadenceavault/page.tsx'), 'utf8')
  assert.match(vault, /macOS 12/)
  const terms = await readFile(path.join(root, 'app/terms/page.tsx'), 'utf8')
  assert.doesNotMatch(terms, /\$\s?\d|US Dollars|USD/, 'the Terms still price in dollars')
  assert.match(terms, /€4\.99\/month or €49\.99\/year/)
})

// CREDITS-MODEL §9: credits are "included", never "free"; Detect is the only
// thing called free. "Free" as the plan's name is fine.
test('credit surfaces call only Detect free', async () => {
  for (const { rel, source } of await sourcesUnder('components/v2/credits')) {
    for (const match of source.matchAll(/\bfree\b.{0,20}/gi)) {
      assert.match(match[0], /^Free accounts|^free on every plan/, `${rel}: "${match[0]}"`)
    }
  }
})

test('availability reads the release feed per platform', () => {
  const win = { version: '1.2.0', downloadUrl: 'win.exe' }
  const mac = { version: '1.2.0', downloadUrl: 'mac.dmg' }
  const label = (releases, preview = false) => availabilityLabel(releases, { preview })
  assert.equal(label({ windows: win, macArm64: mac, macX64: null }), 'Windows and macOS')
  assert.equal(label({ windows: win, macArm64: null, macX64: mac }), 'Windows and macOS')
  assert.equal(label({ windows: win, macArm64: null, macX64: null }), 'Windows (macOS coming back soon)')
  assert.equal(label({ windows: null, macArm64: mac }), 'macOS (Windows coming back soon)')
  assert.equal(label({}), 'Downloads temporarily unavailable')
  assert.equal(label({}, true), 'Beta builds coming soon')
})

test('a slow or failing release feed falls back instead of stalling the page', async () => {
  const never = new Promise(() => {})
  const started = Date.now()
  assert.deepEqual(await withTimeout(never, 20, {}), {})
  assert.ok(Date.now() - started < 1000)
  assert.deepEqual(await withTimeout(Promise.reject(new Error('B2 down')), 1000, {}), {})
  assert.equal(await withTimeout(Promise.resolve('feed'), 1000, 'fallback'), 'feed')
})

// The /stream teaser mirrors STREAM-SPEC §2.7's golden case, so the website and
// the Stream demo's Money screen show the same NOK 49.
test('the /stream payout example adds up to STREAM-SPEC’s golden case', () => {
  const ore = (id) => payoutRow(id).ore
  assert.equal(ore('price'), 4900)
  const deductions = PAYOUT_EXAMPLE.rows.filter((r) => r.kind === 'deduction')
  assert.equal(ore('price') + deductions.reduce((sum, r) => sum + r.ore, 0), ore('net'))
  assert.equal(ore('net'), 3011)
  assert.equal(ore('artists'), Math.round(ore('net') * 0.75))
  assert.equal(ore('artists') + ore('cadencea'), ore('net'))
  assert.equal(ore('vat'), -(ore('price') - Math.round(ore('price') / 1.25)))
  assert.equal(ore('songwriters'), -Math.round((ore('price') + ore('vat')) * 0.12))
  assert.equal(ore('delivery'), -Math.round(PAYOUT_EXAMPLE.listenedMinutes * 0.07))
  assert.match(payoutRow('delivery').label, new RegExp(`${PAYOUT_EXAMPLE.listenedMinutes / 60} hours`))
  // DECISIONS.md D6: "about €4.19" at 11.7 NOK per euro.
  assert.equal(PAYOUT_EXAMPLE.nokPerEur, 11.7)
  assert.equal(oreToEurCents(ore('price')), 419)
})

const streamSpec = new URL('../../docs/v2/STREAM-SPEC.md', import.meta.url)
test('the payout example still matches the local STREAM-SPEC', { skip: !existsSync(streamSpec) }, async () => {
  const spec = await readFile(streamSpec, 'utf8')
  const ore = (id) => payoutRow(id).ore
  const golden = `vat ${-ore('vat')} · netOfVat ${ore('price') + ore('vat')} · card ${-ore('card')} · tono ${-ore('songwriters')} · delivery ${-ore('delivery')} · **net ${ore('net')} · artists ${ore('artists')} · Cadencea ${ore('cadencea')}**`
  assert.ok(spec.includes(golden), `STREAM-SPEC §2.7 no longer has: ${golden}`)
})

// The phone mocks show artists the Stream demo really has (WEB-V2-SPEC §6.7).
const streamSeed = new URL('../../cadencea-stream/data/seed/', import.meta.url)
test('the teaser releases match the Stream demo catalogue', { skip: !existsSync(streamSeed) }, async () => {
  const load = async (name) => JSON.parse(await readFile(new URL(name, streamSeed), 'utf8'))
  const [releases, artists, tracks] = await Promise.all([
    load('releases.json'),
    load('artists.json'),
    load('tracks.json'),
  ])
  for (const teaser of TEASER_RELEASES) {
    const release = releases.find((r) => r.id === teaser.id)
    assert.ok(release, `${teaser.id} is in the Stream catalogue`)
    assert.equal(release.title, teaser.title)
    assert.equal(artists.find((a) => a.id === release.artistId)?.name, teaser.artist)
    assert.equal(release.provenance.daw, teaser.daw)
    assert.equal(release.provenance.stems, teaser.stems)
    assert.equal(release.linerNote, teaser.linerNote)
    const titles = release.trackIds.map((id) => tracks.find((t) => t.id === id)?.title)
    assert.deepEqual(titles, teaser.tracks.map((t) => t.title))
  }
})
