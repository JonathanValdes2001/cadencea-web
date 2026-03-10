import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NOTE: The Supabase client stores sessions in localStorage (client-side only),
// not in cookies. This means the middleware cannot reliably detect auth state
// without the @supabase/ssr package. Route protection is handled client-side
// in individual page components using the useAuth() hook instead.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except auth API routes)
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/(?!auth)).*)',
  ],
}
