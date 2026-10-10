import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  getPreviewDetails,
  getSiteChannel,
  isPreviewSite,
  PREVIEW_ROBOTS_DIRECTIVE,
} from '../lib/site-channel.mjs'

test('only the Vercel production deployment is the production site', () => {
  assert.equal(getSiteChannel({ VERCEL_ENV: 'production' }), 'production')
  assert.equal(getSiteChannel({ VERCEL_ENV: 'preview' }), 'preview')
  assert.equal(getSiteChannel({ VERCEL_ENV: 'development' }), 'preview')
  // Local `next dev` / `next start` without Vercel is a preview.
  assert.equal(getSiteChannel({}), 'preview')
})

test('SITE_CHANNEL can force production outside Vercel but nothing forces preview into production by accident', () => {
  assert.equal(getSiteChannel({ SITE_CHANNEL: 'production' }), 'production')
  assert.equal(getSiteChannel({ SITE_CHANNEL: 'Production' }), 'preview')
  assert.equal(getSiteChannel({ SITE_CHANNEL: 'beta', VERCEL_ENV: 'preview' }), 'preview')
  assert.equal(isPreviewSite({ VERCEL_ENV: 'preview' }), true)
  assert.equal(isPreviewSite({ VERCEL_ENV: 'production' }), false)
})

test('preview details name the branch and short commit for reviewers', () => {
  assert.deepEqual(
    getPreviewDetails({
      VERCEL_ENV: 'preview',
      VERCEL_GIT_COMMIT_REF: 'cadencea-v2-beta',
      VERCEL_GIT_COMMIT_SHA: '0123456789abcdef',
    }),
    { branch: 'cadencea-v2-beta', commit: '0123456', isLocal: false },
  )
  assert.deepEqual(getPreviewDetails({}), { branch: '', commit: '', isLocal: true })
})

test('previews are kept out of search engines in the layout, middleware and robots.txt', async () => {
  assert.match(PREVIEW_ROBOTS_DIRECTIVE, /noindex/)
  assert.match(PREVIEW_ROBOTS_DIRECTIVE, /nofollow/)

  const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /isPreviewSite\(\)/)
  assert.match(layout, /robots: \{ index: false, follow: false/)
  assert.match(layout, /\{isPreview && <PreviewBanner \/>\}/)

  const middleware = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /if \(isPreviewSite\(\)\) \{\s*response\.headers\.set\('X-Robots-Tag', PREVIEW_ROBOTS_DIRECTIVE\)/)

  const robots = await readFile(new URL('../app/robots.ts', import.meta.url), 'utf8')
  assert.match(robots, /if \(isPreviewSite\(\)\) \{\s*return \{ rules: \{ userAgent: "\*", disallow: "\/" \} \};/)
})
