'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { TextField } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { signInErrorMessage } from '@/lib/auth-messages.mjs';
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
      setError('Enter your email and password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        console.warn('[login] Sign-in failed:', error.message);
        // Shown instead of the raw Supabase message, which still goes to the console.
        setError(signInErrorMessage(error));
      } else {
        const requestedPath = new URLSearchParams(window.location.search).get('redirect');
        router.push(safePostLoginPath(requestedPath));
      }
    } catch (err) {
      setError(signInErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16 lg:py-24">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center" aria-label="Cadencea home">
            <Logo tone="onLight" size="lg" />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">Sign in to Cadencea.</h1>
          <p className="mt-3 text-sm text-ink-muted">
            New here?{' '}
            <Link href="/signup" className="font-medium text-accent-ink hover:text-accent-hover">
              Create a free account
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-line bg-canvas p-8">
          {error && (
            <div role="alert" className="mb-6 rounded-sm border border-line bg-tone-danger-bg px-4 py-3 text-sm text-tone-danger">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />

            <TextField
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Your password"
            />

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting || loading}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">Use the same account as the Cadencea Vault app.</p>
      </div>
    </div>
  );
}
