'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AccountSettings() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    email: profile?.email || user?.email || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || user?.email || '',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      const { error } = await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
      });
      if (error) {
        setMessage({
          type: 'error',
          text: error.message || 'Failed to update profile',
        });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
        setIsEditing(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || user?.email || '',
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Settings.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Manage your account preferences and profile information.
          </p>
        </header>

        <div className="space-y-8">
          {message && (
            <div className="rounded-sm border border-line bg-elevated px-4 py-3 text-sm text-ink">
              {message.text}
            </div>
          )}

          {/* Profile */}
          <Section
            title="Profile information"
            action={
              !isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold tracking-wide text-white hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isUpdating ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field
                label="First name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
              />
              <Field
                label="Last name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
              />
              <div className="md:col-span-2">
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Section>

          {/* Security */}
          <Section title="Security">
            <ul className="divide-y divide-line">
              {[
                {
                  title: 'Change email',
                  desc: 'Update your email address.',
                },
                {
                  title: 'Change password',
                  desc: 'Update your account password.',
                },
                {
                  title: 'Two-factor authentication',
                  desc: 'Add extra security to your account.',
                  status: 'Enabled',
                },
              ].map((row) => (
                <li key={row.title}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-elevated"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {row.title}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{row.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.status && (
                        <span className="text-xs font-semibold uppercase tracking-widest text-price">
                          {row.status}
                        </span>
                      )}
                      <Chevron />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <ul className="divide-y divide-line">
              <PreferenceRow
                title="Email notifications"
                desc="Receive updates about new products and features."
                defaultChecked
              />
              <PreferenceRow
                title="Marketing communications"
                desc="Receive promotional offers and product announcements."
              />
            </ul>
          </Section>

          {/* Account actions */}
          <Section title="Account">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-elevated"
            >
              <div>
                <p className="text-sm font-semibold text-ink">Sign out</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Sign out of your account.
                </p>
              </div>
              <Chevron />
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-canvas">
      <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
          {title}
        </h2>
        {action}
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type,
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function PreferenceRow({
  title,
  desc,
  defaultChecked,
}: {
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{desc}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-inset after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-canvas after:shadow-card-hover after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/30" />
      </label>
    </li>
  );
}

function Chevron() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-ink-subtle"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
