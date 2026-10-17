import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isParkedPath,
  PARKED_FEATURES_OPEN,
  PARKED_NOT_FOUND_PATH,
  PARKED_ROUTE_PREFIXES,
  parkedRoutesOpen,
} from '../lib/parked-features.mjs'

// WEB-V2-SPEC §2.1–§2.4, re-scoped 2026-10-15 (docs/v2/README.md "Hidden, not
// deleted"): Market, Publish, Studio, Credits and Stream are parked. Their
// routes sit behind the v2 preview gate AND the PARKED_FEATURES_OPEN switch, so
// they answer 404 even after the v2 gate opens; the navigation, footers and
// in-page links don't mention them; no credit wording or credits code reaches a
// live page; /vst-plugins is the plain "coming" page and /cart is gone.

const root = new URL('../', import.meta.url)
const rootPath = fileURLToPath(root)
const read = (file) => readFile(new URL(file, root), 'utf8')

const V2_PAGES = [
  'market',
  'market/[slug]',
  'market/u/[handle]',
  'publish',
  'publish/[type]',
  'studio',
  'studio/[releaseId]',
  'studio/[releaseId]/edit',
  'credits',
  'stream',
]

async function filesUnder(dir) {
  const url = new URL(dir, root)
  if (!existsSync(url)) return []
  const entries = await readdir(url, { recursive: true, withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && /\.(tsx?|mjs|js)$/.test(e.name))
    .map((e) => `${e.parentPath ?? e.path}/${e.name}`.replace(/\\/g, '/'))
}

/* The switch and its gate ------------------------------------------------ */

test('the parked switch is off, and the v2 gate alone cannot open a parked route', () => {
  assert.equal(PARKED_FEATURES_OPEN, false)
  // The channel is irrelevant while the switch is off: previews and production both 404.
  for (const env of [{ VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'production' }, { SITE_CHANNEL: 'production' }, {}]) {
    assert.equal(parkedRoutesOpen(env), false, JSON.stringify(env))
  }
})

test('with the switch on, parked routes still need the v2 preview gate', () => {
  assert.equal(parkedRoutesOpen({ VERCEL_ENV: 'preview' }, true), true)
  assert.equal(parkedRoutesOpen({}, true), true)
  assert.equal(parkedRoutesOpen({ VERCEL_ENV: 'production' }, true), false)
  assert.equal(parkedRoutesOpen({ SITE_CHANNEL: 'production' }, true), false)
  // Only a literal `true` opens it.
  assert.equal(parkedRoutesOpen({ VERCEL_ENV: 'preview' }, 'yes'), false)
  assert.equal(parkedRoutesOpen({ VERCEL_ENV: 'preview' }, 1), false)
})

test('every parked URL space is recognized, with its sub-routes and common disguises', () => {
  assert.deepEqual(PARKED_ROUTE_PREFIXES, ['/market', '/publish', '/studio', '/credits', '/stream'])
  for (const prefix of PARKED_ROUTE_PREFIXES) {
    for (const path of [prefix, `${prefix}/`, `${prefix}/anything`, `${prefix}/a/b/c`, prefix.toUpperCase()]) {
      assert.equal(isParkedPath(path), true, path)
    }
  }
  for (const path of ['/market/u/nightjar', '/studio/demo-r01/edit', '/publish/sample_pack', '/market/songs']) {
    assert.equal(isParkedPath(path), true, path)
  }
  // Percent-encoding, repeated and backslash separators all reach the same route.
  for (const path of ['/%6Darket', '/%6darket/x', '//market', '/market//x', '/stu%64io', '/\\market', '/credits%2Fx']) {
    assert.equal(isParkedPath(path), true, path)
  }
})

test('live URLs are not mistaken for parked ones', () => {
  for (const path of [
    '/',
    '/pricing',
    '/cadenceavault',
    '/software',
    '/vst-plugins',
    '/cart',
    '/login',
    '/account/settings',
    '/marketing',
    '/marketplace',
    '/streaming',
    '/studios',
    '/credit',
    '/publisher',
    '/x/market',
    '/%',
    '',
  ]) {
    assert.equal(isParkedPath(path), false, path)
  }
})

test('the (v2) layout 404s unless parked routes are open, on the server', async () => {
  const layout = await read('app/(v2)/layout.tsx')
  assert.match(layout, /if \(!parkedRoutesOpen\(\)\) notFound\(\)/)
  assert.doesNotMatch(layout, /['"]use client['"]/)
})

test('every v2 page lives inside the gated group and none outside it', () => {
  for (const name of ['market', 'publish', 'studio', 'credits', 'stream']) {
    assert.equal(existsSync(new URL(`app/${name}`, root)), false, `app/${name} must live in app/(v2)/`)
  }
  for (const page of V2_PAGES) {
    assert.ok(existsSync(new URL(`app/(v2)/${page}/page.tsx`, root)), `missing app/(v2)/${page}/page.tsx`)
  }
})

// Next renders a page in parallel with its layout, so a layout-only gate still
// streams the page's content inside the 404 response.
test('every v2 page repeats the gate itself, as a server component', async () => {
  const pages = (await filesUnder('app/(v2)/')).filter((file) => file.endsWith('/page.tsx'))
  assert.equal(pages.length, V2_PAGES.length)
  for (const file of pages) {
    const source = await readFile(file, 'utf8')
    assert.match(source, /if \(!parkedRoutesOpen\(\)\) notFound\(\)/, `${file} must call the parked-routes gate`)
    assert.doesNotMatch(source, /if \(!isPreviewSite\(\)\) notFound\(\)/, `${file} still uses the bare preview gate`)
    assert.doesNotMatch(source, /^\s*['"]use client['"]/, `${file} must stay a server component`)
  }
})

test('the middleware answers 404 for parked paths before anything renders', async () => {
  const middleware = await read('middleware.ts')
  assert.match(middleware, /isParkedPath\(req\.nextUrl\.pathname\) && !parkedRoutesOpen\(\)/)
  assert.match(middleware, /NextResponse\.rewrite\(new URL\(PARKED_NOT_FOUND_PATH, req\.url\), \{\s*status: 404,/)
  // The blocked branch comes first, so a parked request never reaches the Supabase refresh.
  assert.ok(middleware.indexOf('isParkedPath(') < middleware.indexOf('await updateSession('))
  // Nothing routes to a real page: the rewrite target must not exist.
  assert.match(PARKED_NOT_FOUND_PATH, /^\/_/)
  assert.equal(existsSync(new URL(`app${PARKED_NOT_FOUND_PATH}`, root)), false)
  // The matcher still covers every parked page path.
  const matcher = /['"](\/\(\(\?!.+?\)\.\*\))['"]/.exec(middleware)?.[1]
  assert.ok(matcher, 'middleware matcher not found')
  const re = new RegExp(`^${matcher.replace(/\\\\/g, '\\')}$`)
  for (const prefix of PARKED_ROUTE_PREFIXES) assert.match(`${prefix}/x`, re, prefix)
})

test('RootLayout passes the server-computed flag to the navbar, footer and V2FlagProvider', async () => {
  const layout = await read('app/layout.tsx')
  assert.match(layout, /<Navbar showV2=\{isPreview\} \/>/)
  assert.match(layout, /<Footer showV2=\{isPreview\} \/>/)
  assert.match(layout, /<V2FlagProvider showV2=\{isPreview\}>/)
})

test('no client component reads the site channel or the parked switch', async () => {
  const files = [...(await filesUnder('app/')), ...(await filesUnder('components/'))]
  assert.ok(files.length > 0)
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (!/^\s*['"]use client['"]/.test(source)) continue
    assert.doesNotMatch(source, /isPreviewSite|site-channel|parked-features|parkedRoutesOpen/, `${file} is a client component`)
  }
})

/* Hidden from the live site ---------------------------------------------- */

// Every file that makes up a page, a layout or shared chrome the live site renders.
const LIVE_SURFACES = [
  'components/Navbar.tsx',
  'components/Footer.tsx',
  'app/layout.tsx',
  'app/page.tsx',
  'app/pricing/page.tsx',
  'app/pricing/layout.tsx',
  'app/software/page.tsx',
  'app/cadenceavault/page.tsx',
  'app/vst-plugins/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/cookies/page.tsx',
  'app/contact/page.tsx',
  'app/not-found.tsx',
  'components/v2/home/WhatsNext.tsx',
  'components/v2/home/BeforeAfter.tsx',
  'components/v2/home/CompareTable.tsx',
  'components/v2/home/VaultMock.tsx',
  'components/v2/vault/DetectCard.tsx',
  'components/v2/plugins/PluginWindow.tsx',
]

test('no navigation, footer or in-page link on the live site points at a parked route', async () => {
  // Any quoted URL or href beginning with a parked prefix: '/market', "/stream#x", `/studio/${id}`.
  const parkedUrl = new RegExp(`['"\`](${PARKED_ROUTE_PREFIXES.join('|')})(?=[/?#'"\`])`)
  for (const file of LIVE_SURFACES) {
    const source = await read(file)
    assert.doesNotMatch(source, parkedUrl, `${file} links to a parked route`)
  }
})

test('the live navigation names only Vault, Plugins, Pricing, Software and the company pages', async () => {
  const navbar = await read('components/Navbar.tsx')
  const footer = await read('components/Footer.tsx')
  const links = (source) => [...source.matchAll(/href: '([^']+)'/g)].map((m) => m[1]).sort()
  assert.deepEqual(links(navbar), ['/cadenceavault', '/cadenceavault', '/pricing', '/pricing', '/vst-plugins'])
  assert.deepEqual(links(footer), ['/', '/contact', '/cookies', '/cadenceavault', '/pricing', '/privacy', '/software', '/terms', '/vst-plugins'].sort())
  for (const source of [navbar, footer]) {
    assert.doesNotMatch(source, /Market|Publish|Studio|Credits|Stream|CreditsChip/)
  }
})

/**
 * The files a module imports, ignoring type-only imports (erased at build time).
 * Static and dynamic imports both count: a dynamic chunk is still emitted.
 */
function importsOf(file) {
  const source = readFileSync(file, 'utf8')
  const specs = []
  for (const m of source.matchAll(/(?:^|\n)\s*(?:import|export)\s+(type\s+)?(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
    if (!m[1]) specs.push(m[2])
  }
  for (const m of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1])
  return specs
}

function resolveImport(from, spec) {
  let base
  if (spec.startsWith('@/')) base = path.join(rootPath, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null
  for (const candidate of [base, ...['.tsx', '.ts', '.mjs', '.js', '/index.tsx', '/index.ts'].map((ext) => base + ext)]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

async function reachableFromLivePages() {
  const entries = (await filesUnder('app/'))
    .filter((file) => !file.includes('/(v2)/'))
    .map((file) => path.normalize(file))
  entries.push(path.join(rootPath, 'middleware.ts'))
  const seen = new Set()
  const stack = [...entries]
  while (stack.length) {
    const file = stack.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const spec of importsOf(file)) {
      const target = resolveImport(file, spec)
      if (target && !seen.has(target)) stack.push(target)
    }
  }
  return [...seen].map((file) => path.relative(rootPath, file).split(path.sep).join('/')).sort()
}

// The earlier "keep v2 credits code out of production bundles" guarantee, checked
// on the whole module graph instead of two files: nothing a live page, the
// shared chrome or the middleware imports (statically or dynamically) may lead
// into the parked components or data.
test('no live page, layout or shared component imports parked code', async () => {
  const reachable = await reachableFromLivePages()
  assert.ok(reachable.includes('components/Navbar.tsx'), 'the walk reaches the navbar')
  assert.ok(reachable.includes('app/pricing/page.tsx'), 'the walk reaches /pricing')
  assert.ok(reachable.includes('components/ui/Field.tsx'), 'the walk reaches the shared Field component')
  const parked = [
    /^components\/v2\/(credits|market|publish|studio|stream)\//,
    /^components\/v2\/common\/(CreditsChip|PersonaBanner|DemoConfirm|DemoNotice|HumanMadeStandard)\.tsx$/,
    /^components\/useLazyModule\.ts$/,
    /^lib\/v2-demo\/(credits|market|release-lifecycle)\//,
    /^lib\/v2-demo\/(stream-teaser|sellers|categories|storage|use-demo-store|audio-recipe)\.ts$/,
    // These primitives read the Studio and Publish copy, so a live page must not reach them.
    /^components\/ui\/(Price|PreviewPlayer|StatusChip)\.tsx$/,
  ]
  for (const file of reachable) {
    for (const pattern of parked) assert.doesNotMatch(file, pattern, `${file} is parked code reachable from a live page`)
  }
})

test('no credit wording on any live page, layout or shared component', async () => {
  for (const file of LIVE_SURFACES) {
    const source = await read(file)
    assert.doesNotMatch(source, /credit/i, `${file} mentions credits`)
  }
  // The pricing and Terms copy in particular.
  for (const file of ['app/pricing/page.tsx', 'app/pricing/layout.tsx', 'app/terms/page.tsx']) {
    assert.doesNotMatch(await read(file), /credit|wallet|top-?up/i, file)
  }
})

/* /vst-plugins and /cart --------------------------------------------------- */

test('/vst-plugins is a plain "coming" page and /cart is gone, with no redirect to the Market', async () => {
  const config = await read('next.config.ts')
  assert.doesNotMatch(config, /redirects/)
  assert.doesNotMatch(config, /\/market|\/cart|vst-plugins/)

  assert.equal(existsSync(new URL('app/cart', root)), false, 'app/cart must stay deleted (404)')
  assert.equal(existsSync(new URL('app/(v2)/cart', root)), false)
  assert.equal(isParkedPath('/cart'), false, '/cart 404s because no route exists, not because it is parked')

  const page = await read('app/vst-plugins/page.tsx')
  assert.doesNotMatch(page, /['"]use client['"]/)
  assert.match(page, /Cadencea plugins are coming\./)
  assert.match(page, /Coming soon/)
  assert.match(page, /There is no store, cart or pricing today/)
  // No invented products, prices, dates or purchase buttons.
  assert.doesNotMatch(page, /€|\$\d|\d\s*(USD|EUR)|\bVST3?\b|\bAU\b|\bCLAP\b|Buy now|Add to cart|Pre-?order|Purchase|Q[1-4] 20|20\d\d/i)
})

test('the plugin pictures carry no text, so they cannot name or price a product', async () => {
  const picture = await read('components/v2/plugins/PluginWindow.tsx')
  assert.doesNotMatch(picture, /<text|<title|<desc|aria-label|alt=/, 'a plugin picture carries text')
  assert.match(picture, /aria-hidden="true"/)
})
