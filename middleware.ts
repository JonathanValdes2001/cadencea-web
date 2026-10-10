import type { NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { updateSession } from '@/lib/supabase/middleware'
import { buildContentSecurityPolicy } from '@/lib/security-headers.mjs'
import { isPreviewSite, PREVIEW_ROBOTS_DIRECTIVE } from '@/lib/site-channel.mjs'

export async function middleware(req: NextRequest) {
  const nonce = randomBytes(16).toString('base64')
  const forwardedHeaders = new Headers(req.headers)
  forwardedHeaders.set('x-nonce', nonce)
  const response = await updateSession(req, forwardedHeaders)
  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy(nonce),
  )
  // Preview deployments (the v2 site, branch previews) stay out of search
  // engines even if a link to them leaks; production is unaffected.
  if (isPreviewSite()) {
    response.headers.set('X-Robots-Tag', PREVIEW_ROBOTS_DIRECTIVE)
  }
  return response
}

export const config = {
  // Supabase's current client uses Node APIs while verifying/refreshing JWTs.
  // Node middleware is stable in Next.js 15.5 and avoids an Edge compatibility
  // warning that could become a runtime failure as the client evolves.
  runtime: 'nodejs',
  matcher: [
    // Refresh browser auth for pages; route handlers validate their own input.
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
}
