'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Login() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            Sign in to your account.
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Don’t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Create one
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-line bg-canvas p-8">
          {error && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3 text-sm text-ink">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />

            <Field
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink">
                <input
                  type="checkbox"
                  name="remember-me"
                  className="h-4 w-4 rounded-sm border-line text-accent focus:ring-accent"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Forgot your password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-wide text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs font-medium uppercase tracking-widest text-ink-subtle">
            <span className="h-px flex-1 bg-line" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton provider="google" />
            <OAuthButton provider="github" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  type,
  label,
  autoComplete,
  required,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  name: string;
  type: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}

function OAuthButton({ provider }: { provider: 'google' | 'github' }) {
  const label = provider === 'google' ? 'Google' : 'GitHub';
  return (
    <button
      type="button"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-ink bg-canvas text-sm font-semibold text-ink hover:bg-elevated"
    >
      {provider === 'google' ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.24a11.5 11.5 0 0 1 6.01 0c2.29-1.56 3.3-1.24 3.3-1.24.66 1.65.24 2.87.12 3.17.77.85 1.24 1.93 1.24 3.25 0 4.64-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
