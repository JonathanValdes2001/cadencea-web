import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

const removedServiceRoleRoutes = [
  'app/api/auth/signup/route.ts',
  'app/api/auth/change-email/route.ts',
  'app/api/auth/change-password/route.ts',
]

function routeFilesUnder(directory) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)
    return entry.isDirectory()
      ? routeFilesUnder(entryPath)
      : entry.name === 'route.ts'
        ? [entryPath]
        : []
  })
}

test('unused service-role auth endpoints stay removed', () => {
  for (const relativePath of removedServiceRoleRoutes) {
    assert.equal(
      existsSync(join(repositoryRoot, relativePath)),
      false,
      `${relativePath} must not expose a service-role auth endpoint`,
    )
  }
})

test('web auth routes cannot call Supabase admin APIs', () => {
  const authRoutes = routeFilesUnder(join(repositoryRoot, 'app', 'api', 'auth'))

  for (const routePath of authRoutes) {
    const source = readFileSync(routePath, 'utf8')
    assert.doesNotMatch(source, /createServiceSupabaseClient|\.auth\.admin\./)
  }
})

test('interactive signup keeps the user-verification flow', () => {
  const authContext = readFileSync(
    join(repositoryRoot, 'lib', 'auth-context.tsx'),
    'utf8',
  )

  assert.match(authContext, /supabase\.auth\.signUp\s*\(/)
  assert.doesNotMatch(
    authContext,
    /\/api\/auth\/(?:signup|change-email|change-password)/,
  )
})

test('browser auth uses SSR cookies and middleware verifies claims', () => {
  const browserClient = readFileSync(
    join(repositoryRoot, 'lib', 'supabase', 'client.ts'),
    'utf8',
  )
  const middleware = readFileSync(
    join(repositoryRoot, 'lib', 'supabase', 'middleware.ts'),
    'utf8',
  )

  assert.match(browserClient, /createBrowserClient/)
  assert.doesNotMatch(browserClient, /localStorage/)
  assert.match(middleware, /auth\.getClaims\(\)/)
  assert.doesNotMatch(middleware, /auth\.getSession\(\)/)
})

test('production tree excludes Sentry wizard demos and development litter', () => {
  for (const relativePath of [
    'app/sentry-example-page/page.tsx',
    'app/api/sentry-example-api/route.ts',
    'dev-server.log',
    'let',
  ]) {
    assert.equal(existsSync(join(repositoryRoot, relativePath)), false, relativePath)
  }

  const nextConfig = readFileSync(join(repositoryRoot, 'next.config.ts'), 'utf8')
  assert.match(nextConfig, /process\.env\.SENTRY_PROJECT/)
  assert.doesNotMatch(nextConfig, /project:\s*["']electron["']/)
})

test('newsletter subscriptions deliver tokens through mail, not logs or responses', () => {
  const route = readFileSync(
    join(repositoryRoot, 'app', 'api', 'newsletter', 'subscribe', 'route.ts'),
    'utf8',
  )
  assert.match(route, /sendNewsletterConfirmation/)
  assert.doesNotMatch(route, /console\.log\([^\n]*(?:Token|token)/)
  assert.doesNotMatch(route, /token:\s*process\.env\.NODE_ENV/)
})
