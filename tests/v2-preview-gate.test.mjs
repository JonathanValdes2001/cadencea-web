import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'

// WEB-V2-SPEC §2.1–§2.4: every v2 route sits behind the server-side preview gate,
// the gate is never evaluated in client code, and production keeps /vst-plugins
// and /cart.

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

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

test('the (v2) layout 404s unless this is a preview, on the server', async () => {
  const layout = await read('app/(v2)/layout.tsx')
  assert.match(layout, /if \(!isPreviewSite\(\)\) notFound\(\)/)
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
// streams the page's content inside production's 404 response.
test('every v2 page repeats the gate itself, as a server component', async () => {
  const pages = (await filesUnder('app/(v2)/')).filter((file) => file.endsWith('/page.tsx'))
  assert.equal(pages.length, V2_PAGES.length)
  for (const file of pages) {
    const source = await readFile(file, 'utf8')
    assert.match(source, /if \(!isPreviewSite\(\)\) notFound\(\)/, `${file} must call the preview gate`)
    assert.doesNotMatch(source, /^\s*['"]use client['"]/, `${file} must stay a server component`)
  }
})

test('RootLayout passes the server-computed flag to the navbar, footer and V2FlagProvider', async () => {
  const layout = await read('app/layout.tsx')
  assert.match(layout, /<Navbar showV2=\{isPreview\} \/>/)
  assert.match(layout, /<Footer showV2=\{isPreview\} \/>/)
  assert.match(layout, /<V2FlagProvider showV2=\{isPreview\}>/)
})

test('no client component reads the site channel', async () => {
  const files = [...(await filesUnder('app/')), ...(await filesUnder('components/'))]
  assert.ok(files.length > 0)
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (!/^\s*['"]use client['"]/.test(source)) continue
    assert.doesNotMatch(source, /isPreviewSite|site-channel/, `${file} is a client component`)
  }
})

test('/vst-plugins and /cart redirect to /market on previews only', async () => {
  const config = await read('next.config.ts')
  assert.match(config, /if \(!isPreviewSite\(\)\) return \[\];/)
  for (const source of ['/vst-plugins', '/cart']) {
    const rule = new RegExp(
      `\\{\\s*source:\\s*["']${source}["'],\\s*destination:\\s*["']/market["'],\\s*permanent:\\s*false\\s*\\}`,
    )
    assert.match(config, rule)
  }
  // Production still serves both pages.
  assert.ok(existsSync(new URL('app/vst-plugins/page.tsx', root)))
  assert.ok(existsSync(new URL('app/cart/page.tsx', root)))
})
