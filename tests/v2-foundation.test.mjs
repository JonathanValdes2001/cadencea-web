import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

// The v2 demo foundation (WEB-V2-SPEC §2.5, §2.7, §6). These tests import the
// TypeScript modules in lib/v2-demo directly through Node's type stripping
// (Node 22.18+; expect an ExperimentalWarning/typeless-package line, not a failure).
import {
  CHIP_TONE,
  RELEASE_LIFECYCLE_SPEC_VERSION,
  RELEASE_TYPES,
  TRANSITIONS,
} from '../lib/v2-demo/release-lifecycle/types.ts'
import * as copy from '../lib/v2-demo/release-lifecycle/copy.ts'
import {
  confidenceLevel,
  decodeKey,
  encodeKey,
  fill,
  formatBytes,
  formatCreditPrice,
  formatCredits,
  formatDate,
  formatDuration,
  formatEur,
  formatKey,
  formatMoney,
  formatNok,
  formatRelative,
  PITCH_CLASSES,
} from '../lib/v2-demo/format.ts'
import { MOTIFS_BY_KIND, generateCover, hash, initials, waveformBars } from '../lib/v2-demo/cover.ts'
import { DEMO_NOW, addDays, nextDemoTime } from '../lib/v2-demo/clock.ts'
import { buildRecipe } from '../lib/v2-demo/audio-recipe.ts'
import { CATEGORIES, CATEGORY_KEYS, RESERVED_MARKET_SEGMENTS, categoryForType, isCategoryKey } from '../lib/v2-demo/categories.ts'
import { PERSONA, PERSONA_LINE, SELLERS, getSeller } from '../lib/v2-demo/sellers.ts'
import { createDemoStore, DEMO_STORAGE_KEYS } from '../lib/v2-demo/storage.ts'
import { CREDITS, cardSellerEarnsEurCents, rolloverCap } from '../lib/v2-demo/credits/config.ts'
import { CHECKOUT_COPY, PRICING_CREDITS } from '../lib/v2-demo/credits/copy.ts'
import { WALLET_SEED } from '../lib/v2-demo/credits/wallet-seed.ts'
import { LIBRARY_SEED, ownedEntry } from '../lib/v2-demo/credits/library-seed.ts'
import {
  atCap,
  balances,
  previewSpend,
  refundError,
  refundTopUp,
  returnError,
  returnItem,
  spend,
  suggestedTopUpEurCents,
  topUp,
  topUpError,
} from '../lib/v2-demo/credits/wallet.ts'

/** The RL front-matter spec_version this transcription of RELEASE-LIFECYCLE §8 matches. */
const PINNED_RL_SPEC_VERSION = '2026-10-10.3'

test('smoke: the strip-only TypeScript modules load under node --test', () => {
  assert.equal(RELEASE_TYPES.length, 7)
  assert.equal(TRANSITIONS.length, 35)
  assert.equal(formatEur(6), '€6.00')
})

test('release-lifecycle/types.ts is the pinned RELEASE-LIFECYCLE spec version', () => {
  assert.equal(RELEASE_LIFECYCLE_SPEC_VERSION, PINNED_RL_SPEC_VERSION)
})

// The specs live in the workspace above the repo, so CI can't see them; locally
// this catches a spec bump that the transcription hasn't followed yet.
const rlDoc = new URL('../../docs/v2/RELEASE-LIFECYCLE.md', import.meta.url)
test('the pinned version matches the local RELEASE-LIFECYCLE.md', { skip: !existsSync(rlDoc) }, () => {
  const match = readFileSync(rlDoc, 'utf8').match(/^spec_version:\s*"([^"]+)"/m)
  assert.equal(match?.[1], PINNED_RL_SPEC_VERSION)
})

test('format: euros, credits and credit prices', () => {
  assert.equal(formatEur(6), '€6.00')
  assert.equal(formatEur(28.9), '€28.90')
  assert.equal(formatEur(30, { trimZeros: true }), '€30')
  assert.equal(formatEur(4.99, { trimZeros: true }), '€4.99')
  assert.equal(formatEur(-1.2), '−€1.20')
  assert.equal(formatCredits(1240), '1,240 credits')
  assert.equal(formatCredits(1), '1 credit')
  assert.equal(formatCredits(0), '0 credits')
  assert.equal(formatCreditPrice(30), '30 credits (€3.00)')
  assert.equal(formatCreditPrice(1), '1 credit (€0.10)')
  assert.equal(formatNok(49), 'NOK 49.00')
  assert.equal(formatMoney({ amountMinor: 600, currency: 'EUR' }), '€6.00')
  assert.equal(formatMoney({ amountMinor: 4900, currency: 'NOK' }), 'NOK 49.00')
})

test('format: dates are UTC whatever the machine time zone', () => {
  const original = process.env.TZ
  try {
    for (const tz of ['UTC', 'Pacific/Kiritimati', 'America/Los_Angeles', 'Europe/Oslo']) {
      process.env.TZ = tz
      assert.equal(formatDate('2026-09-12T23:30:00Z'), '12\u00A0Sep\u00A02026', tz)
      assert.equal(formatRelative('2026-10-09T23:59:00Z'), 'yesterday', tz)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
  assert.equal(formatRelative(DEMO_NOW), 'today')
  assert.equal(formatRelative('2026-10-08T08:00:00Z'), '2\u00A0days\u00A0ago')
  assert.equal(formatRelative('2026-10-24T00:00:00Z'), '24\u00A0Oct\u00A02026')
  assert.equal(formatRelative('2026-10-13T00:00:00Z'), 'in\u00A03\u00A0days')
})

// A date or relative time is one unbreakable value, so lines never end mid-date.
test('format: dates and relative times never wrap inside the value', () => {
  for (const value of [formatDate('2026-10-19T12:05:00Z'), formatRelative('2026-10-05T09:30:00Z'), formatRelative('2026-10-13T00:00:00Z')]) {
    assert.doesNotMatch(value, / /, `"${value}" has a breaking space`)
  }
})

test('format: keys encode as F#m / F# / none and round-trip', () => {
  for (const root of PITCH_CLASSES) {
    for (const mode of ['Major', 'Minor']) {
      const key = { root, mode }
      assert.deepEqual(decodeKey(encodeKey(key)), key)
    }
  }
  assert.equal(encodeKey({ root: 'F#', mode: 'Minor' }), 'F#m')
  assert.equal(encodeKey({ root: 'F#', mode: 'Major' }), 'F#')
  assert.equal(encodeKey(null), 'none')
  assert.equal(decodeKey('none'), null)
  assert.equal(decodeKey('Gb'), undefined)
  assert.equal(decodeKey('H'), undefined)
  assert.equal(formatKey({ root: 'F#', mode: 'Minor' }), 'F# Minor')
  assert.equal(formatKey(null), 'No key')
})

test('format: durations, sizes, confidence levels and templates', () => {
  assert.equal(formatDuration(225000), '3:45')
  assert.equal(formatDuration(8000), '0:08')
  assert.equal(formatDuration(3725000), '1:02:05')
  assert.equal(formatBytes(1_200_000_000), '1.2 GB')
  assert.equal(formatBytes(820_000_000), '820 MB')
  assert.equal(formatBytes(12_000), '12 KB')
  assert.equal(confidenceLevel(0.93), 'High')
  assert.equal(confidenceLevel(0.6), 'High')
  assert.equal(confidenceLevel(0.45), 'Medium')
  assert.equal(confidenceLevel(0.29), 'Low')
  assert.equal(fill('v{n} live · v{next} in review', { n: 2, next: 3 }), 'v2 live · v3 in review')
  assert.equal(fill('{unknown} stays', {}), '{unknown} stays')
})

test('clock: DEMO_NOW is fixed and nextDemoTime advances one second per call', () => {
  assert.equal(DEMO_NOW, '2026-10-10T12:00:00Z')
  const a = nextDemoTime()
  const b = nextDemoTime()
  assert.equal(Date.parse(b) - Date.parse(a), 1000)
  assert.ok(Date.parse(a) > Date.parse(DEMO_NOW))
  // After a reload, new actions still sort after the stored ones.
  const after = nextDemoTime('2026-10-10T12:05:00Z')
  assert.equal(after, '2026-10-10T12:05:01Z')
  assert.equal(nextDemoTime(), '2026-10-10T12:05:02Z')
  assert.equal(addDays('2026-10-05T12:05:00Z', 14), '2026-10-19T12:05:00Z')
})

test('cover: deterministic per seed, varied across seeds', () => {
  assert.equal(hash(''), 0x811c9dc5)
  assert.equal(hash('a'), 0xe40c292c)
  const a = generateCover({ seed: 'kiln-drill-kit', kind: 'sample_pack' })
  assert.deepEqual(generateCover({ seed: 'kiln-drill-kit', kind: 'sample_pack' }), a)
  assert.notDeepEqual(generateCover({ seed: 'tram-line-textures', kind: 'sample_pack' }), a)
  assert.ok(['bars', 'slice', 'halftone'].includes(a.motif), a.motif)
  for (const kind of RELEASE_TYPES) {
    for (let i = 0; i < 20; i += 1) {
      const spec = generateCover({ seed: `seed-${i}`, kind })
      assert.ok(spec.shapes.length >= 3 && spec.shapes.length <= 7, `${kind} has ${spec.shapes.length} shapes`)
      // Small enough to stay well under 3 KB of SVG.
      assert.ok(JSON.stringify(spec).length < 2000)
    }
  }
  assert.equal(generateCover({ seed: 'x', kind: 'theme', palette: 'violet' }).palette, 'violet')
  // Each type draws from its own motifs (a theme never looks like a Splits pack, a song never like presets).
  const owners = new Map()
  for (const [kind, motifs] of Object.entries(MOTIFS_BY_KIND)) {
    for (const motif of motifs) {
      assert.equal(owners.get(motif), undefined, `${motif} is used by ${owners.get(motif)} and ${kind}`)
      owners.set(motif, kind)
    }
  }
  // A rail of one type mixes its motifs.
  const sampleMotifs = new Set(Array.from({ length: 12 }, (_, i) => generateCover({ seed: `pack-${i}`, kind: 'sample_pack' }).motif))
  assert.ok(sampleMotifs.size > 1)
  // MIDI notes sit below the card's type badge.
  for (let i = 0; i < 20; i += 1) {
    for (const note of generateCover({ seed: `midi-${i}`, kind: 'midi_pack' }).shapes) assert.ok(note.y >= 96)
  }
  const avatar = generateCover({ seed: 'kiln-theory', kind: 'avatar', title: 'Kiln Theory' })
  assert.equal(avatar.motif, 'monogram')
  assert.equal(avatar.monogram, 'KT')
  assert.equal(initials('Mire & Mica'), 'MM')
  assert.equal(initials('Lowfen'), 'LO')
  assert.deepEqual(waveformBars('a', 48), waveformBars('a', 48))
  assert.equal(waveformBars('a', 48).length, 48)
})

test('audio recipe: seeded, drums-only without a key, nothing for themes', () => {
  const input = { seed: 'cold-concrete', bpm: 120, keyRoot: 'C#', keyMode: 'Minor', kind: 'beat' }
  const recipe = buildRecipe(input)
  assert.deepEqual(buildRecipe(input), recipe)
  assert.equal(recipe.duration, 8)
  assert.ok(recipe.notes.some((n) => n.type === 'kick'))
  assert.ok(recipe.notes.some((n) => n.type === 'bass'))
  assert.ok(recipe.notes.some((n) => n.type === 'chord'))
  const noKey = buildRecipe({ ...input, keyRoot: null, keyMode: null, kind: 'preset_pack' })
  assert.ok(noKey.notes.every((n) => ['kick', 'snare', 'hat'].includes(n.type)))
  assert.equal(buildRecipe({ ...input, bpm: null }).bpm, 100)
  assert.equal(buildRecipe({ ...input, kind: 'theme' }).notes.length, 0)
  assert.ok(buildRecipe({ ...input, kind: 'preset_pack' }).notes.every((n) => !['kick', 'snare', 'hat'].includes(n.type)))
})

test('credits/config.ts equals CREDITS-MODEL', () => {
  assert.equal(CREDITS.eurCentsPerCredit, 10)
  assert.deepEqual(CREDITS.monthly, { free: 0, basic: 5, standard: 10, pro: 20 })
  assert.equal(CREDITS.rolloverMultiple, null)
  assert.equal(rolloverCap('standard'), null)
  assert.deepEqual(CREDITS.welcome, { credits: 0, validDays: 60, scope: 'cadencea_originals' })
  assert.deepEqual(
    CREDITS.topUp.quickPicks.map((p) => [p.credits, p.eurCents]),
    [[100, 1000], [300, 2850], [1000, 9000]],
  )
  assert.deepEqual(CREDITS.topUp.exact, { minCredits: 100, maxCredits: 1000, stepCredits: 50 })
  assert.deepEqual(CREDITS.topUp.discounts, [{ minCredits: 1000, percent: 10 }, { minCredits: 300, percent: 5 }])
  assert.equal(CREDITS.boughtCap, 2000)
  assert.deepEqual(CREDITS.refundDays, { topUp: 14, undownloadedItem: 14 })
  assert.deepEqual(CREDITS.spendOrder, ['included', 'bought'])
  const p = CREDITS.priceList
  assert.deepEqual([p.oneShot, p.loop, p.midiFile, p.preset], [1, 1, 1, 2])
  assert.deepEqual(p.pack, { min: 20, max: 300, step: 10 })
  assert.deepEqual(p.midiPack, { min: 10, max: 300, step: 10 })
  assert.deepEqual(p.splitsLoop, { min: 0, max: 1 })
  assert.deepEqual(p.splitsPack, { min: 0, max: 100, step: 10 })
  assert.deepEqual([p.themeStandard, p.themePremium], [30, 80])
  assert.deepEqual(p.originalsPack, { min: 20, max: 100 })
  assert.deepEqual(Object.keys(CREDITS.beatTiers), ['wav', 'stems', 'unlimited', 'exclusive'])
  const tiers = Object.values(CREDITS.beatTiers).map((t) => [t.defaultEur, t.minEur, t.maxEur, t.streams])
  assert.deepEqual(tiers, [
    [30, 20, 60, 500_000],
    [75, 50, 150, 2_000_000],
    [150, 100, 300, null],
    [500, 300, null, null],
  ])
  assert.equal(CREDITS.cardOrderMinEurCents, 300)
  assert.equal(CREDITS.fanSupportMinEurCents, 300)
  assert.equal(CREDITS.sellerEurCentsPerCredit, 5)
  assert.equal(CREDITS.detectCostCredits, 0)
  // CREDITS-MODEL §8.7: a €30 WAV lease earns the seller €20.80 (Pro seller €21.95).
  assert.equal(cardSellerEarnsEurCents(3000), 2080)
  assert.equal(cardSellerEarnsEurCents(3000, true), 2195)
})

function deltaOf(entry) {
  if (entry.split) return entry.split
  return entry.wallet === 'bought' ? { included: 0, bought: entry.credits } : { included: entry.credits, bought: 0 }
}

test('wallet seed: Maya has 29 included + 260 bought = 289 credits and every balance_after adds up', () => {
  assert.equal(WALLET_SEED.user.display_name, 'Maya Lind')
  assert.deepEqual(WALLET_SEED.balances, { included: 29, bought: 260, total: 289, total_eur_cents: 2890 })
  const b = balances(WALLET_SEED)
  assert.deepEqual([b.included, b.bought, b.total, b.totalEurCents], [29, 260, 289, 2890])
  let running = { included: 0, bought: 0 }
  for (const entry of WALLET_SEED.ledger) {
    const d = deltaOf(entry)
    assert.equal(d.included + d.bought, entry.credits, `${entry.id} split`)
    assert.equal(entry.eur_cents, entry.credits * 10, `${entry.id} euros`)
    assert.equal(entry.lots.reduce((s, l) => s + l.credits, 0), entry.credits, `${entry.id} lots`)
    running = { included: running.included + d.included, bought: running.bought + d.bought }
    assert.deepEqual(entry.balance_after, running, `${entry.id} balance_after`)
  }
  assert.deepEqual(running, { included: 29, bought: 260 })
  assert.equal(atCap(WALLET_SEED), false)
})

test('wallet: spend order is included first, then bought, oldest first (CREDITS-MODEL §5.1)', () => {
  const plan = previewSpend(WALLET_SEED, 120)
  assert.deepEqual([plan.included, plan.bought, plan.shortfall], [29, 91, 0])
  assert.deepEqual(plan.lots, [
    { lot_id: 'inc_2026_10', credits: 29 },
    { lot_id: 'buy_2026_08_20', credits: 91 },
  ])
  assert.equal(previewSpend(WALLET_SEED, 400).shortfall, 111)

  // An active welcome lot goes first on Cadencea Originals, and never on anything else.
  const withWelcome = structuredClone(WALLET_SEED)
  withWelcome.buckets.included.lots[0] = {
    ...withWelcome.buckets.included.lots[0],
    remaining: 10,
    expires_at: '2026-11-01T00:00:00Z',
    status: 'active',
  }
  assert.deepEqual(previewSpend(withWelcome, 20, { firstParty: true }).lots, [
    { lot_id: 'inc_welcome', credits: 10 },
    { lot_id: 'inc_2026_10', credits: 10 },
  ])
  assert.deepEqual(previewSpend(withWelcome, 20).lots, [{ lot_id: 'inc_2026_10', credits: 20 }])
})

test('wallet: spend appends a purchase whose balances add up', () => {
  const item = { id: 'kiln-drill-kit', title: 'Kiln Drill Kit', kind: 'sample_pack', seller: 'Kiln Theory', first_party: false }
  const result = spend(WALLET_SEED, { credits: 120, item, at: '2026-10-10T12:00:01Z' })
  assert.equal(result.ok, true)
  assert.equal(result.entry.id, 'led_014')
  assert.deepEqual(result.entry.split, { included: -29, bought: -91 })
  assert.deepEqual(result.entry.balance_after, { included: 0, bought: 169 })
  assert.equal(result.entry.item.seller_earns_eur_cents, 600)
  assert.equal(result.wallet.balances.total, 169)
  assert.equal(WALLET_SEED.balances.total, 289, 'the seed is never mutated')
  const short = spend(WALLET_SEED, { credits: 300, item, at: '2026-10-10T12:00:02Z' })
  assert.deepEqual([short.ok, short.error, short.shortfall], [false, 'insufficient_credits', 11])
})

test('wallet: top-ups follow the €10–100 €5-step rule and the 2,000 bought-credit cap', () => {
  for (const cents of [1000, 1500, 2500, 5000, 10000]) assert.equal(topUpError(WALLET_SEED, cents / 10), null, `${cents}`)
  for (const cents of [500, 1200, 10500, 999]) assert.equal(topUpError(WALLET_SEED, cents / 10), 'invalid_amount', `${cents}`)
  const nearCap = structuredClone(WALLET_SEED)
  nearCap.buckets.bought.lots[0].remaining = 1800 // 1,900 bought in all
  assert.equal(topUpError(nearCap, 100), null)
  assert.equal(topUpError(nearCap, 150), 'over_cap')

  const result = topUp(WALLET_SEED, { credits: 100, at: '2026-10-10T12:00:01Z' })
  assert.equal(result.ok, true)
  assert.deepEqual(result.entry.balance_after, { included: 29, bought: 360 })
  const lot = result.wallet.buckets.bought.lots.at(-1)
  assert.equal(lot.refundable_until, '2026-10-24T12:00:01Z')
  assert.equal(result.entry.memo, 'Top-up 100 credits for €10.00')
})

test('wallet: top-up refunds only within 14 days and only for unspent credits', () => {
  assert.equal(refundError(WALLET_SEED, 'buy_2026_10_05'), null)
  assert.equal(refundError(WALLET_SEED, 'buy_2026_08_20'), 'refund_window_closed')
  assert.equal(refundError(WALLET_SEED, 'nope'), 'not_found')
  const refunded = refundTopUp(WALLET_SEED, { lotId: 'buy_2026_10_05', at: '2026-10-10T12:00:01Z' })
  assert.equal(refunded.ok, true)
  assert.equal(refunded.entry.reason, 'topup_14_day')
  assert.equal(refunded.entry.paid_eur_cents, 1000)
  assert.deepEqual(refunded.entry.balance_after, { included: 29, bought: 160 })
  assert.equal(refundError(refunded.wallet, 'buy_2026_10_05', '2026-10-10T12:00:02Z'), 'nothing_to_refund')
  assert.equal(refundError(WALLET_SEED, 'buy_2026_10_05', '2026-10-19T12:05:01Z'), 'refund_window_closed')
})

test('wallet: an item returns only if not downloaded and within 14 days', () => {
  assert.equal(returnError(WALLET_SEED, 'led_013', { downloaded: false }), null)
  assert.equal(returnError(WALLET_SEED, 'led_013', { downloaded: true }), 'downloaded')
  assert.equal(returnError(WALLET_SEED, 'led_013', { downloaded: false, now: '2026-10-21T19:15:01Z' }), 'return_window_closed')
  assert.equal(returnError(WALLET_SEED, 'led_007', { downloaded: false }), 'already_returned')
  const back = returnItem(WALLET_SEED, { purchaseId: 'led_013', downloaded: false, at: '2026-10-10T12:00:01Z' })
  assert.equal(back.ok, true)
  assert.deepEqual(back.entry.split, { included: 30, bought: 0 })
  assert.deepEqual(back.entry.balance_after, { included: 59, bought: 260 })
  assert.equal(back.entry.seller_reversal_eur_cents, -150)
  const lots = Object.fromEntries(back.wallet.buckets.included.lots.map((l) => [l.lot_id, l.remaining]))
  assert.equal(lots.inc_2026_09, 29)
  assert.equal(lots.inc_2026_10, 30)
})

test('wallet: the suggested top-up covers a shortfall in €5 steps from €10 to €100', () => {
  assert.equal(suggestedTopUpEurCents(1), 1000)
  assert.equal(suggestedTopUpEurCents(101), 1500)
  assert.equal(suggestedTopUpEurCents(1000), 9000)
  assert.equal(suggestedTopUpEurCents(1001), null)
})

test('library seed: Maya owns four items, derived from the wallet ledger', () => {
  const owned = LIBRARY_SEED.entries.filter((e) => e.returnedAt === null).map((e) => e.key)
  assert.deepEqual(owned, ['tape-drums-vol-1', 'dusty-keys', 'copper-tape-loops#midnight-rhodes-92', 'velvet-pads'])
  for (const entry of LIBRARY_SEED.entries) {
    const purchase = WALLET_SEED.ledger.find((e) => e.id === entry.purchaseLedgerId)
    assert.equal(purchase?.type, 'purchase', entry.key)
    assert.equal(-purchase.credits, entry.pricePaid.credits, entry.key)
    assert.equal(purchase.at, entry.purchasedAt, entry.key)
  }
  assert.equal(ownedEntry(LIBRARY_SEED, 'copper-tape-loops', 'midnight-rhodes-92')?.downloaded, true)
  assert.equal(ownedEntry(LIBRARY_SEED, 'analog-bass'), null)
  const velvet = ownedEntry(LIBRARY_SEED, 'velvet-pads')
  assert.equal(velvet.downloaded, false)
  assert.equal(returnError(WALLET_SEED, velvet.purchaseLedgerId, { downloaded: velvet.downloaded }), null)
})

test('storage: per-area keys, version reseed and a quiet in-memory fallback', () => {
  assert.deepEqual(DEMO_STORAGE_KEYS, {
    releaseLifecycle: 'cadencea.v2-demo.release-lifecycle.v1',
    credits: 'cadencea.v2-demo.credits.v1',
    market: 'cadencea.v2-demo.market.v1',
    creatorProfile: 'cadencea.v2-demo.creator-profile.v1',
  })
  const saved = globalThis.window
  try {
    const data = new Map([['k', JSON.stringify({ version: 'old', state: { n: 9 } })]])
    globalThis.window = {
      localStorage: {
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => data.set(k, v),
        removeItem: (k) => data.delete(k),
      },
      addEventListener() {},
      removeEventListener() {},
    }
    const seed = { n: 1 }
    const store = createDemoStore({ key: 'k', version: 'v2', seed })
    assert.equal(store.getSnapshot(), seed, 'a stale version reseeds')
    assert.equal(store.getServerSnapshot(), seed)
    store.update((s) => ({ n: s.n + 1 }))
    assert.deepEqual(JSON.parse(data.get('k')), { version: 'v2', state: { n: 2 } })
    assert.deepEqual(createDemoStore({ key: 'k', version: 'v2', seed }).getSnapshot(), { n: 2 })
    store.reset()
    assert.equal(store.getSnapshot(), seed)
    assert.equal(data.has('k'), false)

    globalThis.window = {
      get localStorage() {
        throw new Error('blocked')
      },
      addEventListener() {},
      removeEventListener() {},
    }
    const blocked = createDemoStore({ key: 'k', version: 'v2', seed })
    assert.equal(blocked.getSnapshot(), seed)
    blocked.update(() => ({ n: 5 }))
    assert.deepEqual(blocked.getSnapshot(), { n: 5 }, 'keeps working in memory')
  } finally {
    if (saved === undefined) delete globalThis.window
    else globalThis.window = saved
  }
})

test('categories, sellers and the one demo person', () => {
  // DECISIONS.md D19: songs publish to Stream only, so the Market has no Songs category.
  assert.deepEqual(CATEGORY_KEYS, ['samples', 'splits', 'presets', 'midi', 'beats', 'themes'])
  assert.deepEqual(
    CATEGORIES.map((c) => c.type),
    ['sample_pack', 'splits_pack', 'preset_pack', 'midi_pack', 'beat', 'theme'],
  )
  assert.ok(isCategoryKey('splits'))
  assert.ok(!isCategoryKey('templates'))
  assert.ok(!isCategoryKey('songs'))
  assert.equal(categoryForType('song'), null)
  assert.equal(categoryForType('beat')?.key, 'beats')
  assert.ok(RESERVED_MARKET_SEGMENTS.includes('u'))
  assert.ok(RESERVED_MARKET_SEGMENTS.includes('songs'), '/market/songs redirects to /stream')
  assert.equal(PERSONA_LINE, 'Demo account: Maya Lind, releasing as Nightjar · Standard plan')
  assert.equal(PERSONA.userId, WALLET_SEED.user.id)
  assert.equal(new Set(SELLERS.map((s) => s.handle)).size, SELLERS.length)
  assert.equal(SELLERS.length, 13)
  assert.equal(getSeller('juniper-hollow'), null, 'song-only artists are not Market sellers')
  assert.equal(getSeller('tessellate'), null)
  assert.ok(SELLERS.every((s) => s.sells.length > 0))
  assert.deepEqual(getSeller('nightjar')?.sells, ['samples', 'presets', 'beats'])
  assert.equal(getSeller('nightjar')?.location, 'Tromsø, Norway')
  assert.deepEqual(SELLERS.filter((s) => !s.fictional).map((s) => s.handle), ['cadencea'])
  assert.equal(getSeller('cadencea')?.displayName, 'Cadencea Originals')
  assert.equal(getSeller('cadencea')?.location, null)
})

test('copy: credit strings are verbatim and release copy calls nothing free', () => {
  assert.equal(PRICING_CREDITS.planLines.standard, '10 Market credits a month (€1)')
  assert.equal(CHECKOUT_COPY.usesSplit, 'Uses {i} included + {b} bought credits (€{eur})')
  // RELEASE-LIFECYCLE §7.6: "free" appears only in "royalty-free" and "Free up space".
  const text = JSON.stringify(copy).replace(/royalty-free|free up space/gi, '')
  assert.doesNotMatch(text, /\bfree\b/i)
  for (const id of Object.keys(CHIP_TONE)) assert.ok(copy.CHIP_COPY[id]?.label, `chip ${id}`)
})
