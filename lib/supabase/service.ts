import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'
import { requirePublicSupabaseConfig } from './config'

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
} as const

/** A request-local anonymous client for validating an explicitly supplied JWT. */
export function createAnonymousServerSupabaseClient() {
  const [supabaseUrl, supabaseAnonKey] = requirePublicSupabaseConfig()
  return createClient<Database>(supabaseUrl, supabaseAnonKey, serverAuthOptions)
}

/** A request-local privileged client. Never import this module into client code. */
export function createServiceSupabaseClient() {
  const [supabaseUrl] = requirePublicSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, serverAuthOptions)
}

