import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { CREDITS, topUpQuote } from '../lib/v2-demo/credits/config.ts'
import { WALLET_SEED } from '../lib/v2-demo/credits/wallet-seed.ts'
import { packCompletionPrice, ownedEntry } from '../lib/v2-demo/credits/library-seed.ts'
import { topUp, spend, refundTopUp, returnItem, nextGrantAmount } from '../lib/v2-demo/credits/wallet.ts'
import { buyWithCredits, marketLibraryStore, returnPurchase, walletStore } from '../lib/v2-demo/credits/store.ts'
import { createDemoStore } from '../lib/v2-demo/storage.ts'

beforeEach(() => { walletStore.reset(); marketLibraryStore.reset() })

const at = '2026-10-10T12:00:01Z'
const item = { id: 'test', title: 'Test sample', kind: 'sample_pack', seller: 'Creator', first_party: false }
const listing = { slug: 'test-pack', title: 'Test pack', version: 1, item }
const files = Array.from({ length: 500 }, (_, i) => ({ id: `sample-${i}`, credits: 1 }))

test('every plan has the agreed grant and unlimited rollover even with a large accumulated balance', () => {
  for (const [plan, monthly] of Object.entries(CREDITS.monthly)) {
    const wallet = structuredClone(WALLET_SEED)
    wallet.plan.id = plan
    wallet.plan.monthly_credits = monthly
    wallet.buckets.included.lots.at(-1).remaining = 100_000
    assert.equal(nextGrantAmount(wallet), monthly)
  }
  assert.equal(CREDITS.welcome.credits, 0)
})

test('bulk quotes charge €10 / €28.50 / €90 and use the same thresholds for custom amounts', () => {
  for (const [credits, cents, percent] of [[100, 1000, 0], [250, 2500, 0], [300, 2850, 5], [350, 3325, 5], [1000, 9000, 10]]) {
    assert.deepEqual(topUpQuote(credits), { credits, eurCents: cents, discountPercent: percent })
    const result = topUp(WALLET_SEED, { credits, at })
    assert.ok(result.ok)
    assert.equal(result.entry.credits, credits)
    assert.equal(result.entry.paid_eur_cents, cents)
    assert.equal(result.entry.eur_cents, credits * 10)
  }
})

test('partial refunds use discounted prices and multiple refund cycles cannot exceed the payment', () => {
  const empty = structuredClone(WALLET_SEED)
  empty.buckets.included.lots = []
  empty.buckets.bought.lots = []
  empty.ledger = []
  const bought = topUp(empty, { credits: 300, at })
  const spent = spend(bought.wallet, { credits: 1, item, at })
  const lotId = bought.wallet.buckets.bought.lots.at(-1).lot_id
  const first = refundTopUp(spent.wallet, { lotId, at })
  assert.equal(first.entry.paid_eur_cents, 2841)
  const returned = returnItem(first.wallet, { purchaseId: spent.entry.id, downloaded: false, at })
  const second = refundTopUp(returned.wallet, { lotId, at })
  assert.equal(first.entry.paid_eur_cents + second.entry.paid_eur_cents, 2850)
})

test('pack completion credits prior valid spend, ignores returned purchases and other versions', () => {
  const entries = Array.from({ length: 30 }, (_, i) => ({
    ...listing, key: `test-pack#sample-${i}`, fileId: `sample-${i}`,
    pricePaid: { kind: 'credits', credits: 1 }, returnedAt: null,
  }))
  const args = { ...listing, credits: 500, files }
  assert.deepEqual(packCompletionPrice({ entries }, args), { credits: 470, priorCredits: 30, ownedCount: 30 })
  assert.equal(packCompletionPrice({ entries }, { ...args, credits: 300 }).credits, 270)
  entries[0].returnedAt = at
  entries[1].version = 2
  assert.equal(packCompletionPrice({ entries }, args).credits, 472)
  assert.equal(packCompletionPrice({ entries }, { ...args, credits: 20 }).credits, 0)
})

test('completing a pack debits only the remainder, prevents duplicate buys and preserves earlier ownership on return', () => {
  for (let i = 0; i < 30; i++) {
    assert.ok(buyWithCredits({ ...listing, fileId: `sample-${i}`, credits: 1 }).ok)
  }
  const before = walletStore.getSnapshot().balances.total
  assert.ok(buyWithCredits({ ...listing, credits: 100, packFiles: files }).ok)
  assert.equal(walletStore.getSnapshot().balances.total, before - 70)
  assert.equal(walletStore.getSnapshot().ledger.at(-1).item.seller_earns_eur_cents, 350)
  assert.equal(buyWithCredits({ ...listing, fileId: 'sample-50', credits: 1 }).error, 'already_owned')
  assert.equal(returnPurchase('test-pack#sample-0').error, 'included_in_pack')
  assert.ok(returnPurchase('test-pack').ok)
  assert.ok(ownedEntry(marketLibraryStore.getSnapshot(), 'test-pack', 'sample-0'))
  assert.equal(ownedEntry(marketLibraryStore.getSnapshot(), 'test-pack', 'sample-50'), null)
  assert.equal(walletStore.getSnapshot().balances.total, before)
})

test('normalizing persisted demo state preserves its history instead of reseeding it', () => {
  const original = globalThis.window
  const saved = { ...WALLET_SEED, plan: { ...WALLET_SEED.plan, monthly_credits: 30, rollover_cap: 60 } }
  globalThis.window = { localStorage: { getItem: () => JSON.stringify({ version: 'test', state: saved }) } }
  try {
    const store = createDemoStore({ key: 'test', version: 'test', seed: WALLET_SEED, normalize: (wallet) => ({ ...wallet, plan: { ...wallet.plan, monthly_credits: 10, rollover_cap: null } }) })
    assert.equal(store.getSnapshot().plan.monthly_credits, 10)
    assert.deepEqual(store.getSnapshot().ledger, saved.ledger)
  } finally { globalThis.window = original }
})
