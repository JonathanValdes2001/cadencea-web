'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'
import { requirePublicSupabaseConfig } from './config'

const [supabaseUrl, supabaseAnonKey] = requirePublicSupabaseConfig()

// @supabase/ssr persists the browser session in cookies, allowing middleware
// and server components to validate the same session. It also uses PKCE for
// redirect-based auth flows instead of the legacy implicit browser-storage flow.
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
)

export async function getCurrentUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}
