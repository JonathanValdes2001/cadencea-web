import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// WEB-V2-SPEC §0.4 and §5.5: the pricing page's checkout stays equivalent and
// every credits line on it is preview-only. The API matches plans by display
// name, so a renamed plan or a moved price silently breaks checkout.

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('checkout code, plan names and prices are unchanged', async () => {
  const page = await read('app/pricing/page.tsx')
  for (const snippet of [
    'p.id.toLowerCase() === plan.name.toLowerCase()',
    "'/billing/plans'",
    "'/billing/create-checkout-session'",
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
})

test('no highlighted plan: free uses the outline button, paid plans the primary one', async () => {
  const page = await read('app/pricing/page.tsx')
  assert.doesNotMatch(page, /popular: true/)
  assert.doesNotMatch(page, /Most popular/i)
  assert.match(page, /isFree\s*\?\s*'border border-ink text-ink hover:bg-elevated'\s*:\s*'bg-accent text-white hover:bg-accent-hover'/)
})

test('the pricing page never reads the site channel itself', async () => {
  const page = await read('app/pricing/page.tsx')
  assert.doesNotMatch(page, /site-channel|isPreviewSite/)
  // It gets the server-computed flag from V2FlagProvider, once.
  assert.equal(page.match(/useShowV2\(\)/g)?.length, 1)
})

/**
 * Removes every expression gated on showV2 (`showV2 && …` up to the end of the
 * enclosing JSX expression, and the consequent of `showV2 ? … : …`). Quoted
 * strings are skipped so brackets inside them don't count.
 */
function stripShowV2Gates(source) {
  const open = '([{'
  const close = ')]}'
  let out = source
  for (;;) {
    const match = /showV2\s*(&&|\?)/.exec(out)
    if (!match) return out
    let depth = 0
    let i = match.index + match[0].length
    for (; i < out.length; i++) {
      const ch = out[i]
      if (ch === "'" || ch === '"' || ch === '`') {
        const end = out.indexOf(ch, i + 1)
        i = end === -1 ? out.length : end
        continue
      }
      if (open.includes(ch)) depth++
      else if (close.includes(ch)) {
        if (depth === 0) break
        depth--
      } else if (depth === 0 && (ch === ';' || ch === ',' || (match[1] === '?' && ch === ':'))) break
    }
    out = out.slice(0, match.index) + out.slice(i)
  }
}

test('every credits line on /pricing sits behind showV2', async () => {
  const page = await read('app/pricing/page.tsx')
  const withoutImportsOrDeclarations = page
    .replace(/^import .*$/gm, '')
    .replace(/const marketCreditsFaq = \{[\s\S]*?\n\};/, '')
  assert.notEqual(withoutImportsOrDeclarations, page.replace(/^import .*$/gm, ''), 'the preview FAQ item is declared')

  const ungated = stripShowV2Gates(withoutImportsOrDeclarations)
  for (const marker of ['PRICING_CREDITS', 'PricingCreditsSection', 'marketCreditsFaq']) {
    assert.ok(withoutImportsOrDeclarations.includes(marker), `${marker} is used`)
    assert.ok(!ungated.includes(marker), `${marker} is used outside a showV2 gate`)
  }
  assert.doesNotMatch(ungated, /credits/i, 'credits copy outside a showV2 gate')
  assert.match(page, /\{showV2 && <PricingCreditsSection \/>\}/)
})

test('the pricing layout carries the page metadata', async () => {
  const layout = await read('app/pricing/layout.tsx')
  assert.match(layout, /title: 'Pricing'/)
  assert.match(layout, /Prices in euros, including VAT\./)
  assert.doesNotMatch(layout, /['"]use client['"]/)
})
