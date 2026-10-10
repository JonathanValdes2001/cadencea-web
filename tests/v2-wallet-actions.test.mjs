import { test } from 'node:test'
import assert from 'node:assert/strict'

// The demo wallet's rules (WEB-V2-SPEC §2.7, CREDITS-MODEL §4–§5) as the /credits
// page and the Market buy box use them, plus the founder script's credit steps
// (WEB-V2-SPEC §9.4) and how the /credits history reads each ledger entry.
import { WALLET_SEED } from '../lib/v2-demo/credits/wallet-seed.ts'
import {
  balances,
  previewSpend,
  refundError,
  refundTopUp,
  returnError,
  returnItem,
  spend,
  topUp,
  topUpError,
} from '../lib/v2-demo/credits/wallet.ts'
import { inLedgerTab, ledgerTab, signedCredits, walletLabel } from '../components/v2/credits/ledger-view.ts'

const THIRD_PARTY = { id: 'kiln-drill-kit', title: 'Kiln Drill Kit', kind: 'sample_pack', seller: 'Kiln Theory', first_party: false }
const ORIGINAL = { id: 'tape-drums-vol-2', title: 'Tape Drums Vol. 2', kind: 'sample_pack', seller: 'Cadencea Originals', first_party: true }

const at = (seconds) => new Date(Date.parse('2026-10-10T12:00:00Z') + seconds * 1000).toISOString().replace('.000Z', 'Z')

function lotsById(wallet) {
  return Object.fromEntries(
    [...wallet.buckets.included.lots, ...wallet.buckets.bought.lots].map((lot) => [lot.lot_id, lot]),
  )
}

/** Maya's seed plus two active welcome lots, so the welcome rules can be exercised. */
function withWelcomeLots() {
  const wallet = structuredClone(WALLET_SEED)
  const [welcome] = wallet.buckets.included.lots
  wallet.buckets.included.lots[0] = { ...welcome, remaining: 10, expires_at: '2026-11-01T00:00:00Z', status: 'active' }
  wallet.buckets.included.lots.push({
    ...welcome,
    lot_id: 'inc_welcome_soon',
    remaining: 5,
    granted_at: '2026-09-01T00:00:00Z',
    expires_at: '2026-10-20T00:00:00Z',
    status: 'active',
  })
  return wallet
}

test('spend order: included first, then bought, each oldest first (CREDITS-MODEL §5.1)', () => {
  assert.deepEqual(previewSpend(WALLET_SEED, 200).lots, [
    { lot_id: 'inc_2026_10', credits: 29 },
    { lot_id: 'buy_2026_08_20', credits: 160 },
    { lot_id: 'buy_2026_10_05', credits: 11 },
  ])

  // Two monthly lots: the older one goes first.
  const twoMonths = structuredClone(WALLET_SEED)
  const sept = twoMonths.buckets.included.lots.find((l) => l.lot_id === 'inc_2026_09')
  Object.assign(sept, { remaining: 5, status: 'active' })
  assert.deepEqual(previewSpend(twoMonths, 10).lots, [
    { lot_id: 'inc_2026_09', credits: 5 },
    { lot_id: 'inc_2026_10', credits: 5 },
  ])
})

test('welcome credits: Cadencea Originals only, soonest-expiring first, never once expired', () => {
  const wallet = withWelcomeLots()
  assert.deepEqual(previewSpend(wallet, 20, { firstParty: true }).lots, [
    { lot_id: 'inc_welcome_soon', credits: 5 },
    { lot_id: 'inc_welcome', credits: 10 },
    { lot_id: 'inc_2026_10', credits: 5 },
  ])
  assert.deepEqual(previewSpend(wallet, 20).lots, [{ lot_id: 'inc_2026_10', credits: 20 }])

  // After 20 Oct the soonest lot has expired and is skipped even for Originals.
  assert.deepEqual(previewSpend(wallet, 12, { firstParty: true, now: '2026-10-25T00:00:00Z' }).lots, [
    { lot_id: 'inc_welcome', credits: 10 },
    { lot_id: 'inc_2026_10', credits: 2 },
  ])

  // Welcome credits count toward the balance only for first-party items.
  assert.equal(previewSpend(wallet, 305).shortfall, 16)
  assert.equal(previewSpend(wallet, 305, { firstParty: true }).shortfall, 1)

  const bought = spend(wallet, { credits: 20, item: ORIGINAL, at: at(1) })
  assert.equal(bought.ok, true)
  assert.equal(bought.entry.item.seller_earns_eur_cents, 0, 'Originals pay no seller')
  const lots = lotsById(bought.wallet)
  assert.equal(lots.inc_welcome_soon.status, 'spent')
  assert.equal(lots.inc_welcome.remaining, 0)
})

test('founder script: top up €10, buy Kiln Drill Kit and Amber Hour, then Tidewater Drums still fits', () => {
  const topped = topUp(WALLET_SEED, { eurCents: 1000, at: at(1) })
  assert.equal(topped.ok, true)
  assert.deepEqual([topped.wallet.balances.included, topped.wallet.balances.bought], [29, 360])

  const preview = previewSpend(topped.wallet, 120)
  assert.deepEqual([preview.included, preview.bought], [29, 91], 'Uses 29 included + 91 bought')
  const kiln = spend(topped.wallet, { credits: 120, item: THIRD_PARTY, at: at(2) })
  assert.deepEqual(kiln.entry.balance_after, { included: 0, bought: 269 })

  const amber = spend(kiln.wallet, {
    credits: 10,
    item: { id: 'amber-hour', title: 'Amber Hour', kind: 'splits_pack', seller: 'Okra Sun', first_party: false },
    at: at(3),
  })
  assert.deepEqual(amber.entry.balance_after, { included: 0, bought: 259 })
  assert.deepEqual(amber.entry.lots, [{ lot_id: 'buy_2026_08_20', credits: -10 }], 'oldest top-up first')

  // DECISIONS.md D7: Tidewater Drums is at most 250 credits, so it fits 259.
  assert.equal(previewSpend(amber.wallet, 250).shortfall, 0)
  assert.equal(previewSpend(amber.wallet, 260).shortfall, 1)
})

test('top-ups: €10–€100 in €5 steps only', () => {
  for (let cents = 1000; cents <= 10000; cents += 500) {
    assert.equal(topUpError(WALLET_SEED, cents), null, `${cents}`)
  }
  for (const cents of [0, -1000, 500, 999, 1001, 1250, 10500, 1000.5, Number.NaN]) {
    assert.equal(topUpError(WALLET_SEED, cents), 'invalid_amount', `${cents}`)
    assert.deepEqual(topUp(WALLET_SEED, { eurCents: cents, at: at(1) }), { ok: false, error: 'invalid_amount' })
  }
})

test('top-ups: refused once they would pass 2,000 bought credits', () => {
  const near = structuredClone(WALLET_SEED)
  near.buckets.bought.lots[0].remaining = 1800 // 1,900 bought in all
  assert.equal(balances(near).bought, 1900)
  assert.equal(topUpError(near, 1000), null, 'exactly 2,000 is allowed')
  assert.equal(topUpError(near, 1500), 'over_cap')
  assert.deepEqual(topUp(near, { eurCents: 1500, at: at(1) }), { ok: false, error: 'over_cap' })

  const full = topUp(near, { eurCents: 1000, at: at(1) })
  assert.equal(full.wallet.balances.bought, 2000)
  assert.equal(topUpError(full.wallet, 1000), 'over_cap')
  // Spending makes room again.
  const spent = spend(full.wallet, { credits: 129, item: THIRD_PARTY, at: at(2) })
  assert.equal(topUpError(spent.wallet, 1000), null)
})

test('top-up refunds: within 14 days, and only the credits not yet spent', () => {
  const topped = topUp(WALLET_SEED, { eurCents: 1000, at: at(1) })
  const lotId = topped.wallet.buckets.bought.lots.at(-1).lot_id
  // 300 credits use up the included lot and both older top-ups first, then 11 of the new one.
  const spent = spend(topped.wallet, { credits: 300, item: THIRD_PARTY, at: at(2) })
  assert.equal(lotsById(spent.wallet)[lotId].remaining, 89)

  const refunded = refundTopUp(spent.wallet, { lotId, at: at(3) })
  assert.equal(refunded.ok, true)
  assert.equal(refunded.entry.credits, -89)
  assert.equal(refunded.entry.paid_eur_cents, 890)
  assert.equal(lotsById(refunded.wallet)[lotId].status, 'refunded')
  assert.equal(refundError(refunded.wallet, lotId, at(4)), 'nothing_to_refund')

  // A lot spent to zero has nothing to refund.
  const allSpent = spend(topped.wallet, { credits: 389, item: THIRD_PARTY, at: at(2) })
  assert.equal(refundError(allSpent.wallet, lotId, at(3)), 'nothing_to_refund')

  // The window closes 14 days after purchase, to the second.
  const until = lotsById(topped.wallet)[lotId].refundable_until
  assert.equal(until, '2026-10-24T12:00:01Z')
  assert.equal(refundError(topped.wallet, lotId, until), null)
  assert.equal(refundError(topped.wallet, lotId, '2026-10-24T12:00:02Z'), 'refund_window_closed')
})

test('item returns: only if not downloaded and within 14 days, back to the lots the credits came from', () => {
  // Velvet Pads (led_013) was bought on 7 Oct 2026 at 19:15 and isn't downloaded.
  assert.equal(returnError(WALLET_SEED, 'led_013', { downloaded: false, now: '2026-10-21T19:15:00Z' }), null)
  assert.equal(
    returnError(WALLET_SEED, 'led_013', { downloaded: false, now: '2026-10-21T19:15:01Z' }),
    'return_window_closed',
  )
  assert.equal(returnError(WALLET_SEED, 'led_013', { downloaded: true }), 'downloaded')
  assert.equal(returnError(WALLET_SEED, 'led_004', { downloaded: false }), 'not_found', 'a top-up is not an item')

  const kiln = spend(WALLET_SEED, { credits: 120, item: THIRD_PARTY, at: at(1) })
  assert.deepEqual(returnItem(kiln.wallet, { purchaseId: kiln.entry.id, downloaded: true, at: at(2) }), {
    ok: false,
    error: 'downloaded',
  })
  const back = returnItem(kiln.wallet, { purchaseId: kiln.entry.id, downloaded: false, at: at(2) })
  assert.equal(back.ok, true)
  assert.equal(back.entry.refund_of, kiln.entry.id)
  assert.deepEqual(back.entry.balance_after, { included: 29, bought: 260 })
  const lots = lotsById(back.wallet)
  assert.deepEqual([lots.inc_2026_10.remaining, lots.buy_2026_08_20.remaining], [29, 160])
  assert.equal(back.entry.seller_reversal_eur_cents, -600)
  assert.equal(returnError(back.wallet, kiln.entry.id, { downloaded: false, now: at(3) }), 'already_returned')
})

test('history: tabs, the wallet column and signed changes read the ledger as CREDITS-MODEL §10 writes it', () => {
  const ids = (tab) => WALLET_SEED.ledger.filter((e) => inLedgerTab(e, tab)).map((e) => e.id)
  assert.equal(ids('all').length, WALLET_SEED.ledger.length)
  assert.deepEqual(ids('spent'), ['led_003', 'led_005', 'led_007', 'led_012', 'led_013'])
  assert.deepEqual(ids('added'), ['led_001', 'led_002', 'led_004', 'led_006', 'led_010', 'led_011'])
  assert.deepEqual(ids('refunds'), ['led_008', 'led_009'])
  for (const entry of WALLET_SEED.ledger) assert.notEqual(entry.item?.kind, 'detect', 'Detect is never a ledger entry')

  const byId = Object.fromEntries(WALLET_SEED.ledger.map((e) => [e.id, e]))
  assert.deepEqual(walletLabel(byId.led_005), { label: 'Included + Bought', detail: '30 + 90' })
  assert.deepEqual(walletLabel(byId.led_008), { label: 'Included + Bought', detail: '30 + 30' })
  assert.deepEqual(walletLabel(byId.led_004), { label: 'Bought', detail: null })
  assert.deepEqual(walletLabel(byId.led_009), { label: 'Included', detail: null })
  assert.deepEqual(walletLabel(byId.led_013), { label: 'Included', detail: null })

  // A top-up refund and a negative platform adjustment both land in "Refunds & expiry".
  const refunded = refundTopUp(WALLET_SEED, { lotId: 'buy_2026_10_05', at: at(1) })
  assert.equal(ledgerTab(refunded.entry), 'refunds')
  assert.deepEqual(walletLabel(refunded.entry), { label: 'Bought', detail: null })
  assert.equal(ledgerTab({ ...byId.led_001, credits: -30, reason: 'grant_revoked' }), 'refunds')

  assert.equal(signedCredits(30), '+30')
  assert.equal(signedCredits(-120), '−120')
  assert.equal(signedCredits(1240), '+1,240')
  assert.equal(signedCredits(0), '0')
})
