'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { safePostLoginPath } from '@/lib/auth-route-policy.mjs';

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
        const requestedPath = new URLSearchParams(window.location.search).get('redirect');
        router.push(safePostLoginPath(requestedPath));
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

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-wide text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

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
