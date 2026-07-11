import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '../database.types'
import { isProtectedRoute, loginRedirectPath } from '../auth-route-policy.mjs'
import { requirePublicSupabaseConfig } from './config'

function copySessionResponse(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options)
  })
  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = source.headers.get(header)
    if (value) target.headers.set(header, value)
  }
  return target
}

export async function updateSession(request: NextRequest) {
  const [supabaseUrl, supabaseAnonKey] = requirePublicSupabaseConfig()
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        )
      },
    },
  })

  // getClaims verifies the JWT signature. getSession is intentionally not used
  // for authorization because cookie contents originate from the browser.
  const { data, error } = await supabase.auth.getClaims()
  const isAuthenticated = !error && Boolean(data?.claims?.sub)

  if (!isAuthenticated && isProtectedRoute(request.nextUrl.pathname)) {
    const redirect = NextResponse.redirect(
      new URL(
        loginRedirectPath(request.nextUrl.pathname, request.nextUrl.search),
        request.url,
      ),
    )
    return copySessionResponse(response, redirect)
  }

  return response
}

