'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  supabase,
  isSupabaseConfigured,
  testSupabaseConnectivity,
} from '../../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleHealthCheck = async () => {
    setHealthCheckLoading(true);
    setDebugInfo('');
    try {
      const result = await testSupabaseConnectivity();
      setDebugInfo(
        result.success
          ? `Connectivity test passed. Status: ${result.status}`
          : `Connectivity test failed: ${result.error}`
      );
    } catch (err) {
      setDebugInfo(
        `Health check error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setHealthCheckLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDebugInfo('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(`Registration failed: ${error.message}`);
        setDebugInfo(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else if (data) {
        setMessage(
          'Registration successful. Check your email to confirm your account.'
        );
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      setError(`Network error: ${errorMessage}`);
      setDebugInfo(`Full error: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16 lg:py-24">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink"
            aria-label="Cadencea home"
          >
            <span className="inline-block h-4 w-4 bg-ink" aria-hidden="true" />
            <span className="text-base font-bold tracking-tight">
              CADENCEA
            </span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">
            Create your Cadencea Vault account.
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-line bg-canvas p-8">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                Supabase setup required
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                To enable registration, create a{' '}
                <code className="rounded-sm bg-inset px-1 font-mono text-xs text-ink">
                  .env.local
                </code>{' '}
                file with your Supabase credentials:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-sm bg-inset p-3 font-mono text-xs text-ink">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
              </pre>
              <p className="mt-2 text-xs text-ink-muted">
                Get these from your{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  Supabase dashboard
                </a>
                .
              </p>
            </div>
          )}

          {isSupabaseConfigured && (
            <div className="mb-6 flex items-center justify-between rounded-sm border border-line bg-elevated px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-ink">
                Supabase configured
              </span>
              <button
                type="button"
                onClick={handleHealthCheck}
                disabled={healthCheckLoading}
                className="inline-flex h-8 items-center rounded-sm border border-ink px-3 text-xs font-semibold text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                {healthCheckLoading ? 'Testing…' : 'Test connection'}
              </button>
            </div>
          )}

          {debugInfo && isSupabaseConfigured && (
            <div className="mb-6 whitespace-pre-wrap rounded-sm bg-inset p-3 font-mono text-xs text-ink">
              {debugInfo}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3 text-sm text-ink">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3">
              <p className="text-sm text-ink">{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
                    Show technical details
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-sm bg-inset p-3 font-mono text-xs text-ink">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink"
              >
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
                disabled={loading || !isSupabaseConfigured}
                placeholder="you@example.com"
                className="block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !isSupabaseConfigured}
                placeholder="At least 6 characters"
                className="block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="agree-terms"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading || !isSupabaseConfigured}
                className="mt-1 h-4 w-4 rounded-sm border-line text-accent focus:ring-accent"
              />
              <span>
                I have read and agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured || !agreedToTerms}
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-wide text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Creating account…'
                : !isSupabaseConfigured
                ? 'Setup Supabase to enable registration'
                : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
