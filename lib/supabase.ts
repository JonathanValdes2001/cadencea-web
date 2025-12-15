import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Create a server-side client for API routes (using service role key)
export const createServiceSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Test Supabase connectivity
export const testSupabaseConnectivity = async () => {
  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase configuration missing',
        status: 'Configuration Error'
      }
    }

    // Test connection by trying to get the current session
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        status: 'Connection Failed'
      }
    }

    // Test database connectivity with a simple query
    const { error: dbError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (dbError) {
      return {
        success: false,
        error: `Database connection failed: ${dbError.message}`,
        status: 'Database Error'
      }
    }

    return {
      success: true,
      error: null,
      status: 'Connected'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'Network Error'
    }
  }
}

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
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
