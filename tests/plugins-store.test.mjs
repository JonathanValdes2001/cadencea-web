import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

// The plugin store (launch plan S6): the licensing API's origin, prices, the
// cart, the Vault deep links, product ids, and the store's go-live switch.
import { DEFAULT_ACCESS_API_ORIGIN, accessApiOrigin } from '../lib/plugins/access-origin.ts'
import {
  formatPrice,
  isValidProductId,
  mergeStoreProducts,
  normalizeChannel,
  parseStoreProducts,
  priceLabel,
  vaultDeepLink,
} from '../lib/plugins/catalog.ts'
import {
  CART_STORAGE_KEY,
  EMPTY_CART,
  MAX_CART_ITEMS,
  cartReducer,
  cartTotals,
  checkoutBlock,
  parseStoredCart,
  serializeCart,
} from '../lib/plugins/cart-state.ts'
import { PLUGIN_STORE_LIVE, pluginStoreOpen, siteVaultChannel } from '../lib/plugins/store-gate.mjs'
import { buildContentSecurityPolicy } from '../lib/security-headers.mjs'

const root = new URL('../', import.meta.url)
const read = (file) => readFile(new URL(file, root), 'utf8')

const COMPLEX = 'cadencea.athena-complex'
const MINI = 'cadencea.athena-mini'

const fallback = [
  { id: COMPLEX, name: 'ATHENA EQ Complex', type: 'effect', isFree: false, priceMinor: 4999, currency: 'EUR', maxActivations: 3, trialDays: null, purchasable: false },
  { id: MINI, name: 'ATHENA EQ Mini', type: 'effect', isFree: true, priceMinor: 0, currency: 'EUR', maxActivations: 3, trialDays: null, purchasable: false },
]

/* The access API origin --------------------------------------------------- */

test('the access API origin defaults to the API origin without /api', () => {
  assert.equal(DEFAULT_ACCESS_API_ORIGIN, 'https://api.cadencea.app')
  assert.equal(accessApiOrigin({}), 'https://api.cadencea.app')
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api' }), 'https://api.cadencea.app')
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api/' }), 'https://api.cadencea.app')
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'http://localhost:8001/api' }), 'http://localhost:8001')
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://api-staging.cadencea.app' }), 'https://api-staging.cadencea.app')
  // Only a trailing /api goes; a path that merely contains it stays.
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://example.test/apis' }), 'https://example.test/apis')
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://example.test/api/v2' }), 'https://example.test/api/v2')
})

test('NEXT_PUBLIC_ACCESS_API_URL wins, and unusable values fall through', () => {
  assert.equal(
    accessApiOrigin({ NEXT_PUBLIC_ACCESS_API_URL: 'https://licensing.example.test/', NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api' }),
    'https://licensing.example.test',
  )
  // Kept as given (only trailing slashes trimmed): an explicit URL may carry a path.
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_ACCESS_API_URL: 'https://example.test/api' }), 'https://example.test/api')
  for (const bad of ['', '   ', 'not a url', 'ftp://api.cadencea.app', 'javascript:alert(1)', 'https://user:pw@api.cadencea.app']) {
    assert.equal(accessApiOrigin({ NEXT_PUBLIC_ACCESS_API_URL: bad, NEXT_PUBLIC_API_URL: 'https://api-staging.cadencea.app/api' }), 'https://api-staging.cadencea.app', bad)
    assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: bad }), 'https://api.cadencea.app', bad)
  }
  // Query and hash never reach request URLs.
  assert.equal(accessApiOrigin({ NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api?x=1#y' }), 'https://api.cadencea.app')
})

test('a separate access API origin is allowed by the CSP', () => {
  const nonce = Buffer.alloc(16, 2).toString('base64')
  const policy = buildContentSecurityPolicy(nonce, {
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_URL: 'https://api.cadencea.app/api',
    NEXT_PUBLIC_ACCESS_API_URL: 'https://licensing.example.test/v1',
  })
  assert.match(policy, /connect-src [^;]*https:\/\/api\.cadencea\.app/)
  assert.match(policy, /connect-src [^;]*https:\/\/licensing\.example\.test(?=[ ;])/)
  // Insecure or junk values are left out rather than reflected.
  const junk = buildContentSecurityPolicy(nonce, { NODE_ENV: 'production', NEXT_PUBLIC_ACCESS_API_URL: 'http://evil.example' })
  assert.doesNotMatch(junk, /evil\.example/)
})

/* Prices ------------------------------------------------------------------ */

test('prices are formatted from minor units in euros', () => {
  assert.equal(formatPrice(4999, 'EUR'), '€49.99')
  assert.equal(formatPrice(4999, 'eur'), '€49.99')
  assert.equal(formatPrice(5000, 'EUR'), '€50.00')
  assert.equal(formatPrice(0, 'EUR'), '€0.00')
  assert.equal(formatPrice(5, 'EUR'), '€0.05')
  assert.equal(formatPrice(123456, 'EUR'), '€1,234.56')
  // Garbage never throws.
  assert.equal(formatPrice(Number.NaN, 'EUR'), '€0.00')
  assert.equal(formatPrice(4999, 'NOT-A-CODE'), '49.99 NOT-A-CODE')
})

test('free products read "Free", paid ones their price', () => {
  assert.equal(priceLabel({ isFree: true, priceMinor: 0, currency: 'EUR' }), 'Free')
  assert.equal(priceLabel({ isFree: false, priceMinor: 0, currency: 'EUR' }), 'Free')
  assert.equal(priceLabel({ isFree: false, priceMinor: 4999, currency: 'EUR' }), '€49.99')
})

test('the API store list is read defensively', () => {
  const api = { products: [{ ...fallback[0], priceMinor: 3999, purchasable: true }] }
  assert.deepEqual(parseStoreProducts(api), [{ ...fallback[0], priceMinor: 3999, purchasable: true }])
  for (const bad of [null, {}, { products: 'x' }, { products: [null] }, { products: [{ ...fallback[0], priceMinor: '49.99' }] },
    { products: [{ ...fallback[0], priceMinor: -1 }] }, { products: [{ ...fallback[0], id: '../etc' }] }, { products: [{ ...fallback[0], currency: 'euro' }] }]) {
    assert.equal(parseStoreProducts(bad), null, JSON.stringify(bad))
  }
})

test('the API price wins over the fallback; without the API nothing is purchasable', () => {
  const offline = mergeStoreProducts(fallback, null)
  assert.deepEqual(offline.map((p) => [p.id, p.priceMinor, p.purchasable, p.fromApi]), [
    [COMPLEX, 4999, false, false],
    [MINI, 0, false, false],
  ])
  const live = mergeStoreProducts(fallback, [
    { ...fallback[1], purchasable: true },
    { ...fallback[0], priceMinor: 3999, purchasable: true, name: 'Renamed' },
    { ...fallback[0], id: 'cadencea.unknown-thing' },
  ])
  // Local order and copy are kept; unknown API products are left out.
  assert.deepEqual(live.map((p) => [p.id, p.name, p.priceMinor, p.purchasable, p.fromApi]), [
    [COMPLEX, 'ATHENA EQ Complex', 3999, true, true],
    [MINI, 'ATHENA EQ Mini', 0, true, true],
  ])
  // A product the API doesn't list (unlisted at launch) can't be bought.
  const partial = mergeStoreProducts(fallback, [{ ...fallback[1], purchasable: true }])
  assert.equal(partial[0].fromApi, false)
  assert.equal(partial[0].purchasable, false)
})

/* Cart -------------------------------------------------------------------- */

test('the cart holds one of each product, in the order added', () => {
  let state = EMPTY_CART
  state = cartReducer(state, { type: 'add', productId: COMPLEX })
  state = cartReducer(state, { type: 'add', productId: COMPLEX })
  state = cartReducer(state, { type: 'add', productId: MINI })
  assert.deepEqual(state.items, [{ productId: COMPLEX }, { productId: MINI }])
  const same = cartReducer(state, { type: 'add', productId: COMPLEX })
  assert.equal(same, state, 'adding a duplicate returns the same state')
  state = cartReducer(state, { type: 'remove', productId: COMPLEX })
  assert.deepEqual(state.items, [{ productId: MINI }])
  assert.equal(cartReducer(state, { type: 'remove', productId: 'nope' }), state)
  assert.deepEqual(cartReducer(state, { type: 'clear' }), EMPTY_CART)
})

test('the cart rejects invalid ids and stays bounded', () => {
  let state = EMPTY_CART
  for (const bad of ['', 'UPPER', '../x', 'a..b', 'a'.repeat(65), null, 42]) {
    state = cartReducer(state, { type: 'add', productId: bad })
  }
  assert.deepEqual(state, EMPTY_CART)
  for (let i = 0; i < MAX_CART_ITEMS + 5; i++) state = cartReducer(state, { type: 'add', productId: `cadencea.p${i}` })
  assert.equal(state.items.length, MAX_CART_ITEMS)
})

test('the saved cart round-trips and survives junk', () => {
  assert.equal(CART_STORAGE_KEY, 'cadencea.plugin-cart.v1')
  const state = { items: [{ productId: COMPLEX }, { productId: MINI }] }
  assert.equal(serializeCart(state), JSON.stringify({ items: [COMPLEX, MINI] }))
  assert.deepEqual(parseStoredCart(serializeCart(state)), state.items)
  // Older shapes and other tabs' writes: a bare list, objects, duplicates, junk entries.
  assert.deepEqual(parseStoredCart(JSON.stringify([COMPLEX, { productId: MINI }, COMPLEX, 7, 'Bad Id'])), state.items)
  for (const junk of [null, undefined, '', '{', 'null', '42', '{"items":"x"}', '{"items":null}']) {
    assert.deepEqual(parseStoredCart(junk), [], String(junk))
  }
  assert.deepEqual(cartReducer({ items: [{ productId: MINI }] }, { type: 'hydrate', items: 'junk' }), EMPTY_CART)
  assert.deepEqual(cartReducer(EMPTY_CART, { type: 'hydrate', items: [COMPLEX] }), { items: [{ productId: COMPLEX }] })
})

test('totals add up minor units in one currency', () => {
  const listed = mergeStoreProducts(fallback, null)
  assert.deepEqual(cartTotals([], listed), { count: 0, subtotalMinor: 0, currency: null, unknown: [] })
  assert.deepEqual(cartTotals([{ productId: COMPLEX }, { productId: MINI }], listed), {
    count: 2,
    subtotalMinor: 4999,
    currency: 'EUR',
    unknown: [],
  })
  assert.deepEqual(cartTotals([{ productId: 'cadencea.gone' }], listed).unknown, ['cadencea.gone'])
  const mixed = [...listed, { ...listed[0], id: 'cadencea.usd', currency: 'USD', fromApi: true }]
  assert.equal(cartTotals([{ productId: COMPLEX }, { productId: 'cadencea.usd' }], mixed).currency, null)
})

test('checkout opens only for API-confirmed, purchasable items', () => {
  const items = [{ productId: COMPLEX }]
  assert.equal(checkoutBlock([], mergeStoreProducts(fallback, null), { apiReachable: true }), 'empty')
  // The API is down: the fallback price can't be sold.
  assert.equal(checkoutBlock(items, mergeStoreProducts(fallback, null), { apiReachable: false }), 'unavailable')
  // The API answers but doesn't list the product.
  assert.equal(checkoutBlock(items, mergeStoreProducts(fallback, []), { apiReachable: true }), 'unavailable')
  // Listed, but no payment price yet (today's state).
  assert.equal(checkoutBlock(items, mergeStoreProducts(fallback, fallback), { apiReachable: true }), 'not_purchasable')
  const ready = mergeStoreProducts(fallback, fallback.map((p) => ({ ...p, purchasable: true })))
  assert.equal(checkoutBlock(items, ready, { apiReachable: true }), null)
  assert.equal(checkoutBlock(items, ready, { apiReachable: false }), 'unavailable')
  assert.equal(checkoutBlock([{ productId: 'cadencea.gone' }], ready, { apiReachable: true }), 'unavailable')
})

test('startCheckout is the single, still-closed payment hook', async () => {
  const source = await read('lib/plugins/checkout.ts')
  assert.match(source, /export async function startCheckout\(items: readonly CartItem\[\]\): Promise<CheckoutResult>/)
  assert.match(source, /status: 'unavailable'/)
  assert.doesNotMatch(source, /fetch\(|stripe\.com|status: 'redirect', url:/)
  // Only the cart page calls it.
  const cart = await read('components/plugins/CartView.tsx')
  assert.match(cart, /await startCheckout\(cart\.items\)/)
  assert.match(cart, /Checkout opens at launch/)
})

/* Product ids and Vault deep links ---------------------------------------- */

test('product ids follow the licensing API rule', () => {
  for (const id of [COMPLEX, MINI, 'a', 'a1', 'cadencea.zeus-complex', 'x.y.z', 'a-b-c', 'a'.repeat(64)]) {
    assert.equal(isValidProductId(id), true, id)
  }
  for (const id of ['', 'Cadencea.athena', 'a..b', 'a.-b', '.a', 'a.', '-a', 'a-', 'a_b', 'a b', 'a/b', '../a', 'a%2Fb', 'é', 'a'.repeat(65), null, 7, ['a']]) {
    assert.equal(isValidProductId(id), false, String(id))
  }
})

test('deep links open the product in Vault or the Vault beta', () => {
  assert.equal(vaultDeepLink(COMPLEX), 'app.cadencea.vault://plugins/product/cadencea.athena-complex')
  assert.equal(vaultDeepLink(COMPLEX, 'stable'), 'app.cadencea.vault://plugins/product/cadencea.athena-complex')
  assert.equal(vaultDeepLink(MINI, 'beta'), 'app.cadencea.vault.beta://plugins/product/cadencea.athena-mini')
  for (const bad of ['', 'x/../../y', 'a b', 'javascript:alert(1)', 'A']) {
    assert.equal(vaultDeepLink(bad), null, bad)
    assert.equal(vaultDeepLink(bad, 'beta'), null, bad)
  }
})

test('?channel=beta selects the beta app; anything else is stable', () => {
  assert.equal(normalizeChannel('beta'), 'beta')
  assert.equal(normalizeChannel(' BETA '), 'beta')
  assert.equal(normalizeChannel(['beta', 'stable']), 'beta')
  for (const value of [undefined, null, '', 'stable', 'betas', 'dev', ['stable', 'beta'], 1]) {
    assert.equal(normalizeChannel(value), 'stable', String(value))
  }
})

test('/activate/<id> validates the id, 404s unknown products and is never indexed', async () => {
  const page = await read('app/activate/[productId]/page.tsx')
  assert.match(page, /if \(!isValidProductId\(productId\)\) notFound\(\)/)
  assert.match(page, /if \(!product\) notFound\(\)/)
  assert.match(page, /robots: \{ index: false, follow: false/)
  assert.match(page, /normalizeChannel\(\(await searchParams\)\.channel\)/)
  // The beta plugin gets the beta Vault download, whatever the deployment.
  assert.match(page, /loadCadenceaVaultReleases\(fetch, \{ timeoutMs: FEED_TIMEOUT_MS, beta: channel === 'beta' \}\)/)
  // Ids contain a dot, which the middleware's static-file exclusion would skip.
  const middleware = await read('middleware.ts')
  assert.match(middleware, /'\/activate\/:path\*'/)
})

/* The go-live switch ------------------------------------------------------ */

test('the store is preview-only until its go-live switch is flipped', () => {
  assert.equal(PLUGIN_STORE_LIVE, false)
  assert.equal(pluginStoreOpen({ VERCEL_ENV: 'production' }), false)
  assert.equal(pluginStoreOpen({ SITE_CHANNEL: 'production' }), false)
  assert.equal(pluginStoreOpen({ VERCEL_ENV: 'preview' }), true)
  assert.equal(pluginStoreOpen({}), true)
  assert.equal(pluginStoreOpen({ VERCEL_ENV: 'production' }, true), true)
  assert.equal(pluginStoreOpen({ VERCEL_ENV: 'production' }, 'yes'), false)
  assert.equal(siteVaultChannel({ VERCEL_ENV: 'production' }), 'stable')
  assert.equal(siteVaultChannel({ VERCEL_ENV: 'preview' }), 'beta')
})

test('/account and /activate stay live whatever the switch says', async () => {
  for (const file of ['app/account/page.tsx', 'app/activate/[productId]/page.tsx']) {
    assert.ok(existsSync(new URL(file, root)), file)
    assert.doesNotMatch(await read(file), /if \(!pluginStoreOpen\(\)\) notFound\(\)/, file)
  }
})

/* Product copy ------------------------------------------------------------ */

test('product copy makes no claim the spec does not', async () => {
  const sources = [
    await read('lib/plugins/products.ts'),
    await read('app/vst-plugins/athena/page.tsx'),
    await read('app/vst-plugins/page.tsx'),
    await read('components/plugins/AthenaEditions.tsx'),
    await read('components/plugins/HowItWorks.tsx'),
  ].join('\n')
  assert.doesNotMatch(sources, /free updates|updates forever|lifetime updates|\bCPU\b|AAX|Linux|free trial|\d+-day/i)
  for (const fact of ['VST3', 'CLAP', 'Audio Unit', 'Windows 10', 'macOS 12', '24 bands', '8 bands', 'Zero latency', 'EQ Match']) {
    assert.ok(sources.includes(fact), fact)
  }
})
