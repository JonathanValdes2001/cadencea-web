import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { updateSession } from '@/lib/supabase/middleware'
import { buildContentSecurityPolicy } from '@/lib/security-headers.mjs'
import { isParkedPath, PARKED_NOT_FOUND_PATH, parkedRoutesOpen } from '@/lib/parked-features.mjs'
import { isPreviewSite, PREVIEW_ROBOTS_DIRECTIVE } from '@/lib/site-channel.mjs'

export async function middleware(req: NextRequest) {
  const nonce = randomBytes(16).toString('base64')
  const forwardedHeaders = new Headers(req.headers)
  forwardedHeaders.set('x-nonce', nonce)
  // Parked features (Market, Publish, Studio, Credits, Stream) answer 404 here,
  // before any page renders, whatever channel this is and even once the v2 gate
  // opens. The pages repeat the check (app/(v2)), so this is the second lock;
  // it also covers any route later added under a parked prefix. A blocked
  // request skips the Supabase session refresh: nothing renders for it.
  const response =
    isParkedPath(req.nextUrl.pathname) && !parkedRoutesOpen()
      ? NextResponse.rewrite(new URL(PARKED_NOT_FOUND_PATH, req.url), {
          status: 404,
          request: { headers: forwardedHeaders },
        })
      : await updateSession(req, forwardedHeaders)
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
    // Product ids contain a dot (/activate/cadencea.athena-complex), which the
    // static-file exclusion above skips: no CSP, no session refresh, no preview
    // noindex header. Plugins open this URL, so it must get all three.
    '/activate/:path*',
  ],
}
