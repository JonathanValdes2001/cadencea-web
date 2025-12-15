'use client'

import React, { useState } from 'react'
import { supabase, isSupabaseConfigured, testSupabaseConnectivity } from '../../lib/supabase'
import Link from 'next/link'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [healthCheckLoading, setHealthCheckLoading] = useState(false)

  const handleHealthCheck = async () => {
    setHealthCheckLoading(true)
    setDebugInfo('')
    
    try {
      const result = await testSupabaseConnectivity()
      if (result.success) {
        setDebugInfo(`✅ Connectivity test passed! Status: ${result.status}`)
      } else {
        setDebugInfo(`❌ Connectivity test failed: ${result.error}`)
      }
    } catch (error) {
      setDebugInfo(`❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setHealthCheckLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setDebugInfo('')

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      console.log('🚀 Starting registration process...')
      console.log('Email:', email)
      console.log('Supabase configured:', isSupabaseConfigured)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('📡 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Registration error:', error)
        setError(`Registration failed: ${error.message}`)
        setDebugInfo(`Error details: ${JSON.stringify(error, null, 2)}`)
      } else {
        console.log('✅ Registration successful:', data)
        setMessage('Registration successful! Check your email to confirm your account.')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      console.error('💥 Unexpected error during registration:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Network error: ${errorMessage}`)
      setDebugInfo(`Full error: ${JSON.stringify(err, null, 2)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Create your Cadencea Vault account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-amber-400 text-sm font-medium mb-1">Supabase Setup Required</h4>
                  <p className="text-amber-300 text-xs leading-relaxed">
                    To enable registration, please create a <code className="bg-slate-700 px-1 rounded text-amber-200">.env.local</code> file with your Supabase credentials:
                  </p>
                  <pre className="text-xs text-amber-200 bg-slate-900 p-2 rounded mt-2 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
                  </pre>
                  <p className="text-amber-300 text-xs mt-2">
                    Get these from your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-200 hover:text-amber-100 underline">Supabase project dashboard</a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-400 text-sm font-medium">Supabase Configured</span>
                </div>
                <button
                  type="button"
                  onClick={handleHealthCheck}
                  disabled={healthCheckLoading}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  {healthCheckLoading ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              {debugInfo && (
                <div className="mt-3 p-2 bg-slate-900 rounded text-xs font-mono text-blue-200 whitespace-pre-wrap">
                  {debugInfo}
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-400 text-sm">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 text-sm">{error}</p>
                  {debugInfo && (
                    <details className="mt-2">
                      <summary className="text-red-300 text-xs cursor-pointer hover:text-red-200">
                        Show technical details
                      </summary>
                      <div className="mt-2 p-2 bg-slate-900 rounded text-xs font-mono text-red-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {debugInfo}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                disabled={loading || !isSupabaseConfigured}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                placeholder="Create a password (min 6 characters)"
                disabled={loading || !isSupabaseConfigured}
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : !isSupabaseConfigured ? (
                  'Setup Supabase to enable registration'
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 