export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function requirePublicSupabaseConfig(): [string, string] {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your environment configuration.',
    )
  }
  return [supabaseUrl, supabaseAnonKey]
}

