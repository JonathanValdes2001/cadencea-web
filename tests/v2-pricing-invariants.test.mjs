import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// WEB-V2-SPEC §0.4: the pricing page's checkout stays equivalent, and (re-scope
// 2026-10-15) it carries no credits lines. The API matches plans by display
// name, so a renamed plan or a moved price silently breaks checkout.

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('checkout code, plan names and prices are unchanged', async () => {
  const page = await read('app/pricing/page.tsx')
  for (const snippet of [
    'p.id.toLowerCase() === plan.name.toLowerCase()',
    "'/billing/plans'",
    'subscriptionCheckout(api, priceId)',
    'window.location.href = res.url;',
    "name: 'Free'",
    "name: 'Basic'",
    "name: 'Standard'",
    "name: 'Pro'",
    'monthlyPrice: 4.99',
    'yearlyPrice: 49.99',
    'monthlyPrice: 14.99',
    'yearlyPrice: 149.99',
    'monthlyPrice: 24.99',
    'yearlyPrice: 249.99',
    "yearlyDiscount: 'Save €9.89'",
    "yearlyDiscount: 'Save €29.89'",
    "yearlyDiscount: 'Save €49.89'",
  ]) {
    assert.ok(page.includes(snippet), `app/pricing/page.tsx lost: ${snippet}`)
  }
  // The checkout call itself lives in lib/subscription-checkout.mjs (main #1).
  const checkout = await read('lib/subscription-checkout.mjs')
  assert.ok(checkout.includes("'/billing/create-checkout-session'"), 'subscription-checkout lost the checkout endpoint')
})

test('no highlighted plan: free uses the outline button, paid plans the primary one', async () => {
  const page = await read('app/pricing/page.tsx')
  assert.doesNotMatch(page, /popular: true/)
  assert.doesNotMatch(page, /Most popular/i)
  assert.match(page, /isFree\s*\?\s*'border border-ink text-ink hover:bg-elevated'\s*:\s*'bg-accent text-white hover:bg-accent-hover'/)
})

test('the pricing page reads no site channel, preview flag or lazy module', async () => {
  const page = await read('app/pricing/page.tsx')
  assert.doesNotMatch(page, /site-channel|isPreviewSite|useShowV2|showV2|useLazyModule|import\(/)
})

// Re-scope 2026-10-15: credits are parked with the Market, so /pricing carries
// no credits copy at all (no per-plan "monthly included credits", no credits
// section, no Market FAQ item), and no v2 code: not statically, not through a
// lazy chunk. The parked pieces stay in components/v2/credits/ for later.
test('the pricing page has no credits copy and imports no v2 code', async () => {
  const source = await read('app/pricing/page.tsx')
  assert.doesNotMatch(source, /credit|wallet|top-?up|Market|preview\./i)
  for (const line of source.match(/^import .*$/gm) ?? []) {
    assert.doesNotMatch(line, /lib\/v2-demo|components\/v2|useLazyModule/, line)
  }
  assert.doesNotMatch(source, /next\/dynamic|React\.lazy|lazy\(/)
  // The plans themselves carry only storage and support.
  assert.doesNotMatch(source, /Basic 10|Standard 30|Pro 50|included credits/i)
})

test('the pricing layout carries the page metadata', async () => {
  const layout = await read('app/pricing/layout.tsx')
  assert.match(layout, /title: 'Pricing'/)
  assert.match(layout, /Prices in euros\./)
  assert.doesNotMatch(layout, /['"]use client['"]/)
})
