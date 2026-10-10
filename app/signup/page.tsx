'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { CheckboxField, TextField } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth-context';
import { AUTH_MESSAGES, looksLikeEmail, signUpErrorMessage } from '@/lib/auth-messages.mjs';

type FieldName = 'firstName' | 'lastName' | 'username' | 'email' | 'password' | 'confirmPassword' | 'agreeTerms';

const FIELD_ORDER: FieldName[] = ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword', 'agreeTerms'];

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as FieldName]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (formError) setFormError('');
  };

  const validate = (): Partial<Record<FieldName, string>> => {
    const errors: Partial<Record<FieldName, string>> = {};
    const username = formData.username.trim();
    if (!formData.firstName.trim()) errors.firstName = 'Enter your first name.';
    if (!formData.lastName.trim()) errors.lastName = 'Enter your last name.';
    if (username.length < 3) errors.username = 'Choose a username of at least 3 characters.';
    else if (!/^[a-zA-Z0-9_-]+$/.test(username)) errors.username = 'Usernames can only use letters, numbers, - and _.';
    if (!formData.email.trim()) errors.email = 'Enter your email.';
    else if (!looksLikeEmail(formData.email)) errors.email = AUTH_MESSAGES.invalidEmail;
    if (formData.password.length < 8) errors.password = 'Choose a password of at least 8 characters.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "The passwords don't match.";
    if (!agreeTerms) errors.agreeTerms = 'Agree to the Terms of Service and Privacy Policy to continue.';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const errors = validate();
    setFieldErrors(errors);
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`#${firstInvalid}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const { error, session } = await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.username.trim().toLowerCase()
      );

      if (error) {
        console.warn('[signup] Sign-up failed:', error.message);
        setFormError(signUpErrorMessage(error));
      } else if (session) {
        router.push('/');
      } else {
        setSentTo(formData.email.trim());
      }
    } catch (err) {
      setFormError(signUpErrorMessage(err));
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
          <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">Create your free account.</h1>
          <p className="mt-3 text-sm text-ink-muted">
            One account for Cadencea Vault and this website. Already have one?{' '}
            <Link href="/login" className="font-medium text-accent-ink hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-line bg-canvas p-8">
          {sentTo ? (
            <div role="status">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Check your inbox</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                We sent a confirmation link to {sentTo}. Open it, then sign in.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center text-sm font-medium text-accent-ink hover:text-accent-hover"
              >
                Go to sign in →
              </Link>
            </div>
          ) : (
            <>
              {formError && (
                <div
                  role="alert"
                  className="mb-6 rounded-sm border border-line bg-tone-danger-bg px-4 py-3 text-sm text-tone-danger"
                >
                  {formError}
                </div>
              )}

              <form ref={formRef} className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    id="firstName"
                    name="firstName"
                    type="text"
                    label="First name"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    error={fieldErrors.firstName}
                  />
                  <TextField
                    id="lastName"
                    name="lastName"
                    type="text"
                    label="Last name"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    error={fieldErrors.lastName}
                  />
                </div>

                <TextField
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  hint="Collaborators find you by this name. Letters, numbers, - and _ only."
                  error={fieldErrors.username}
                />

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
                  error={fieldErrors.email}
                />

                <TextField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  hint="At least 8 characters."
                  error={fieldErrors.password}
                />

                <TextField
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={fieldErrors.confirmPassword}
                />

                <CheckboxField
                  id="agreeTerms"
                  name="agree-terms"
                  required
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (fieldErrors.agreeTerms) setFieldErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                  }}
                  error={fieldErrors.agreeTerms}
                  label={
                    <>
                      I agree to the{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent-ink hover:text-accent-hover"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent-ink hover:text-accent-hover"
                      >
                        Privacy Policy
                      </a>
                      .
                    </>
                  }
                />

                <Button type="submit" size="lg" fullWidth disabled={isSubmitting || loading}>
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
