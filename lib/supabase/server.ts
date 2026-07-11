import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../database.types'
import { requirePublicSupabaseConfig } from './config'

/** Create a fresh Supabase client for each server render or route request. */
export async function createServerSupabaseClient() {
  const [supabaseUrl, supabaseAnonKey] = requirePublicSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the
          // session before render and owns the response-side cookie update.
        }
      },
    },
  })
}

