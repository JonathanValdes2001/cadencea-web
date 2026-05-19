'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Signup() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    const newErrors: string[] = [];
    if (!formData.firstName.trim()) newErrors.push('First name is required');
    if (!formData.lastName.trim()) newErrors.push('Last name is required');
    if (!formData.username.trim()) newErrors.push('Username is required');
    if (formData.username.trim().length < 3)
      newErrors.push('Username must be at least 3 characters');
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      newErrors.push(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    }
    if (!formData.email.trim()) newErrors.push('Email is required');
    if (!formData.password) newErrors.push('Password is required');
    if (formData.password !== formData.confirmPassword)
      newErrors.push('Passwords do not match');
    if (formData.password && formData.password.length < 6)
      newErrors.push('Password must be at least 6 characters');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const { error, session } = await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.username.trim().toLowerCase()
      );

      if (error) {
        setErrors([error.message]);
      } else if (session) {
        router.push('/');
      } else {
        setSuccessMessage(
          'Account created. Please check your email and click the confirmation link, then sign in.'
        );
      }
    } catch {
      setErrors(['An unexpected error occurred. Please try again.']);
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
            Create your account.
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-line bg-canvas p-8">
          {successMessage && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3">
              <p className="text-sm font-semibold text-ink">Account created</p>
              <p className="mt-1 text-sm text-ink-muted">{successMessage}</p>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover"
              >
                Go to sign in →
              </Link>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-6 rounded-sm border border-line bg-elevated px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                {errors.length === 1
                  ? 'Please fix this error'
                  : 'Please fix the following errors'}
              </p>
              {errors.length === 1 ? (
                <p className="mt-1 text-sm text-ink-muted">{errors[0]}</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {errors.map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="firstName"
                name="firstName"
                type="text"
                label="First name"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <Field
                id="lastName"
                name="lastName"
                type="text"
                label="Last name"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <Field
              id="username"
              name="username"
              type="text"
              label="Username"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              hint="This is how others will find you when sharing projects."
            />

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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="agree-terms"
                required
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
              disabled={isSubmitting || loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-wide text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
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
  hint,
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
  hint?: string;
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
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
