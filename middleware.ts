import type { NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { updateSession } from '@/lib/supabase/middleware'
import { buildContentSecurityPolicy } from '@/lib/security-headers.mjs'

export async function middleware(req: NextRequest) {
  const nonce = randomBytes(16).toString('base64')
  const forwardedHeaders = new Headers(req.headers)
  forwardedHeaders.set('x-nonce', nonce)
  const response = await updateSession(req, forwardedHeaders)
  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy(nonce),
  )
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
