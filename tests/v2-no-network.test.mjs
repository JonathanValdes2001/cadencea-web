import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// WEB-V2-SPEC §0.3, §2.6: v2 code makes no network calls and loads no remote
// assets. All data is local demo data; the only touch of auth state is
// PersonaBanner reading a display name from the already-mounted context.

const root = fileURLToPath(new URL('../', import.meta.url))
const V2_DIRS = ['app/(v2)', 'components/ui', 'components/v2', 'lib/v2-demo']

async function v2Files() {
  const files = []
  for (const dir of V2_DIRS) {
    const abs = path.join(root, dir)
    if (!existsSync(abs)) continue
    for (const entry of await readdir(abs, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.(tsx?|mjs|js|css|json)$/.test(entry.name)) continue
      const file = path.join(entry.parentPath ?? entry.path, entry.name)
      files.push({ rel: path.relative(root, file).replace(/\\/g, '/'), source: await readFile(file, 'utf8') })
    }
  }
  return files
}

/**
 * PUBLISH-PROCEDURE §1 (founder, 2026-10-14) words the creator setup with the
 * provider's name ("Verify your identity with Stripe…", "Connect payouts with
 * Stripe (demo)", "Tax details are collected by Stripe."), so the Vault and the
 * website match. Only its copy file may name it; no file may import it.
 */
const STRIPE_NAME_ALLOWED = new Set(['lib/v2-demo/release-lifecycle/publish-copy.ts'])

const FORBIDDEN = [
  [/api-client/i, 'the API client'],
  [/\bapi\.(get|post|put|patch|delete)\(/i, 'an API call'],
  [/\bfetch\(/i, 'fetch('],
  [/from\s+['"]stripe['"]|@stripe\//i, 'Stripe'],
  [/\bStripe\b/, 'the name Stripe (copy says "card")'],
  [/@supabase/i, 'Supabase'],
  [/createBrowserClient/i, 'a Supabase client'],
  [/\/billing\//i, 'a billing endpoint'],
]

test('v2 code has no network calls, payment SDKs or billing endpoints', async () => {
  const files = await v2Files()
  assert.ok(files.length > 20, 'expected the v2 folders to exist')
  for (const { rel, source } of files) {
    for (const [pattern, what] of FORBIDDEN) {
      if (what.startsWith('the name Stripe') && STRIPE_NAME_ALLOWED.has(rel)) continue
      assert.doesNotMatch(source, pattern, `${rel} mentions ${what}`)
    }
  }
})

test('only PersonaBanner reads the auth context', async () => {
  for (const { rel, source } of await v2Files()) {
    if (rel === 'components/v2/common/PersonaBanner.tsx') continue
    assert.doesNotMatch(source, /lib\/auth-context/, `${rel} imports the auth context`)
  }
})

test('no remote assets: the only absolute URLs are cadencea.app and the SVG namespace', async () => {
  for (const { rel, source } of await v2Files()) {
    for (const [url] of source.matchAll(/https?:\/\/[^\s'"`)<>]+/gi)) {
      const allowed = /^https:\/\/(www\.)?cadencea\.app(\/|$)/i.test(url) || url.startsWith('http://www.w3.org/')
      assert.ok(allowed, `${rel} references ${url}`)
    }
  }
})

test('STREAM_DEMO_URL is read only by the /stream page', async () => {
  for (const { rel, source } of await v2Files()) {
    if (rel === 'app/(v2)/stream/page.tsx') continue
    assert.doesNotMatch(source, /STREAM_DEMO_URL/, `${rel} reads STREAM_DEMO_URL`)
  }
})
