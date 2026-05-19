'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError, Session } from '@supabase/supabase-js'
import { supabase, getCurrentUserProfile } from './supabase'
import { api, ApiError } from './api-client'
import type { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string, username?: string) => Promise<{ error: AuthError | null; session: Session | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, username?: string) => {
    try {
      // Generate username from email if not provided
      const finalUsername = username || email.split('@')[0].toLowerCase()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: finalUsername,
          },
        },
      })

      if (error) {
        return { error, session: null }
      }

      // data.session is non-null when email confirmation is disabled.
      // It is null when the user must confirm their email first.
      return { error: null, session: data.session }
    } catch (error) {
      console.error('Error during sign up:', error)
      return { error: error as AuthError, session: null }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      console.error('Error during sign in:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: 'No authenticated user' }
    }

    try {
      // Username has to be changed via cadencea-api, NOT a direct write to
      // Supabase `profiles`. The API owns the rename so it can:
      //   - enforce server-side uniqueness + format,
      //   - enforce a 24h cooldown,
      //   - keep `users.username` (Postgres), `profiles.username` (Supabase),
      //     and `auth.users.user_metadata.username` (JWT source) in sync.
      // Writing only to `profiles` from here was the original bug: the JWT
      // kept carrying the old name and the API silently reverted every rename.
      const { username, ...profileOnly } = updates
      const currentUsername = profile?.username ?? null
      const usernameChanged =
        typeof username === 'string' && username !== currentUsername

      if (usernameChanged) {
        try {
          await api.patch('/auth/me/username', { new_username: username })
        } catch (err) {
          if (err instanceof ApiError) {
            return {
              error: {
                code: String(err.status),
                message: err.message,
              },
            }
          }
          return { error: err }
        }

        // The next JWT needs to carry the new `user_metadata.username`.
        // refreshSession() forces Supabase to mint a fresh token; until then
        // the middleware would still see the OLD name in the JWT (it's now
        // guarded against reverting us thanks to `username_changed_at`, but
        // we still want the JWT to agree with reality for downstream
        // services that read `user_metadata` directly).
        try {
          await supabase.auth.refreshSession()
        } catch (err) {
          console.warn('[auth-context] refreshSession after rename failed:', err)
        }
      }

      if (Object.keys(profileOnly).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileOnly)
          .eq('id', user.id)

        if (error) {
          return { error }
        }
      }

      // Refresh profile data (pulls the now-updated row, including the
      // username written server-side by cadencea-api).
      await refreshProfile()

      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getCurrentUserProfile().then(setProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch profile when user signs in
        const userProfile = await getCurrentUserProfile()
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
