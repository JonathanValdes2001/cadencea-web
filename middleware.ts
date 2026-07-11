import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  return updateSession(req)
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
