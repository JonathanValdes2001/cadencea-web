import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get auth token from request
  const token = req.cookies.get('sb-access-token')?.value || 
                req.cookies.get('supabase-auth-token')?.value ||
                req.headers.get('authorization')?.replace('Bearer ', '')
  
  let session = null
  
  if (token) {
    try {
      // Create Supabase client to verify the session
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (user && !error) {
          session = { user }
        }
      }
    } catch (error) {
      console.error('Middleware auth check error:', error)
    }
  }
  
  const { pathname } = req.nextUrl
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/account',
    '/account/settings',
    '/account/order-history',
    '/account/vault-dashboard',
    '/account/license-manager',
    '/account/subscription',
  ]
  
  // Define auth routes that should redirect to dashboard if user is already logged in
  const authRoutes = ['/login', '/signup']
  
  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if current route is an auth route
  const isAuthRoute = authRoutes.includes(pathname)
  
  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect authenticated users away from auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return res
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except auth API routes)
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/(?!auth)).*)',
  ],
}
