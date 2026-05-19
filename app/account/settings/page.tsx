'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  accountDeletion,
  dataExport,
  type AccountDeletionStatusResponse,
  type DataExportResponse,
  ApiError,
} from '@/lib/api-client';

export default function AccountSettings() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    username: profile?.username || '',
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
        username: profile.username || '',
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

    const trimmedUsername = formData.username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      setMessage({
        type: 'error',
        text: 'Username must be at least 3 characters.',
      });
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
      setMessage({
        type: 'error',
        text: 'Username can only contain lowercase letters, numbers, underscores, and hyphens.',
      });
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    try {
      const { error } = await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: trimmedUsername,
        email: formData.email,
      });
      if (error) {
        const code = (error as { code?: string })?.code;
        const rawMessage = (error as { message?: string })?.message || '';
        // `code` is the HTTP status when the error came back from
        // cadencea-api (ApiError), or a Postgres code ('23505') when it came
        // from a direct Supabase write for non-username fields.
        const isCooldown = code === '429';
        const isUsernameTaken =
          code === '409' ||
          code === '23505' ||
          /duplicate key|unique constraint|already taken/i.test(rawMessage);
        const isProviderDown = code === '502';
        setMessage({
          type: 'error',
          text: isCooldown
            ? rawMessage || 'You can only change your username once every 24 hours.'
            : isUsernameTaken
              ? 'That username is already taken. Please choose another.'
              : isProviderDown
                ? 'Could not sync the username change with the authentication provider. Please try again in a moment.'
                : rawMessage || 'Failed to update profile',
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
        username: profile.username || '',
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
                  label="Username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  hint="Lowercase letters, numbers, underscores, and hyphens. Minimum 3 characters."
                />
              </div>
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
            <ul className="divide-y divide-line">
              <li>
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
              </li>
              <ExportDataRow />
              <DeleteAccountRow />
            </ul>
          </Section>

          <PendingDeletionBanner />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADR-0038: Pending-deletion banner shown on the settings page when the user
// is in the 30-day grace window. Mirrors the design language of the rest of
// the page; lives at the bottom so it doesn't block primary actions.
// ============================================================================

function PendingDeletionBanner() {
  const [status, setStatus] = useState<AccountDeletionStatusResponse | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    accountDeletion
      .getStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        // 404 (flag off) or other errors -> just hide the banner
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || status.deletion_status !== 'pending_deletion') return null;

  const handleCancel = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const next = await accountDeletion.cancel();
      setStatus(next);
      setMessage(
        'Account deletion cancelled. Your shared projects were not restored — re-share them manually if needed.'
      );
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? err.message
          : 'Could not cancel deletion. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const purgeDate = status.scheduled_purge_at
    ? new Date(status.scheduled_purge_at).toLocaleDateString()
    : 'soon';

  return (
    <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-ink">
      <p className="font-semibold text-rose-300">
        Your account is scheduled for deletion on {purgeDate}.
      </p>
      <p className="mt-2 text-ink-muted">
        After that date, this cannot be undone. Cloud-stored files and your
        Cadencea profile will be permanently deleted. Files on your computer
        are not affected.
      </p>
      {message && <p className="mt-3 text-sm text-ink-muted">{message}</p>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy}
        className="mt-4 inline-flex h-9 items-center rounded-sm border border-rose-400 px-4 text-xs font-semibold tracking-wide text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
      >
        {busy ? 'Cancelling…' : 'Cancel deletion'}
      </button>
    </div>
  );
}

// ============================================================================
// ADR-0038: Export data row + modal
// ============================================================================

function ExportDataRow() {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-elevated"
      >
        <div>
          <p className="text-sm font-semibold text-ink">Export my data</p>
          <p className="mt-1 text-sm text-ink-muted">
            Download a zip of every file in your cloud vault.
          </p>
        </div>
        <Chevron />
      </button>
      {open && <ExportModal onClose={() => setOpen(false)} />}
    </li>
  );
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const [job, setJob] = useState<DataExportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Poll while running.
  useEffect(() => {
    if (!job) return;
    if (job.status === 'succeeded' || job.status === 'failed') return;
    const t = setInterval(async () => {
      try {
        const next = await dataExport.get(job.export_id);
        setJob(next);
      } catch {
        /* swallow polling errors */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [job]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const created = await dataExport.request();
      setJob(created);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not start export. Please try again.'
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-md border border-line bg-canvas p-6 text-ink">
        <h3 className="text-lg font-semibold">Export your data</h3>
        <p className="mt-2 text-sm text-ink-muted">
          We&apos;ll build a zip of every file in your cloud vault and email
          you a download link when it&apos;s ready. The link expires in 24
          hours.
        </p>
        {!job && (
          <>
            <p className="mt-3 text-sm text-ink-muted">
              Files on your local computer are not included — only what was
              uploaded to the cloud.
            </p>
            {error && (
              <p className="mt-3 text-sm text-rose-300">{error}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Close
              </button>
              <button
                type="button"
                onClick={start}
                disabled={starting}
                className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold tracking-wide text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {starting ? 'Starting…' : 'Start export'}
              </button>
            </div>
          </>
        )}
        {job && (
          <div className="mt-4 text-sm">
            {job.status === 'pending' && (
              <p className="text-ink-muted">Queued. Starting shortly…</p>
            )}
            {job.status === 'running' && (
              <p className="text-ink-muted">Building your zip…</p>
            )}
            {job.status === 'succeeded' && job.download_url && (
              <div>
                <p className="text-emerald-300">Ready.</p>
                <a
                  href={job.download_url}
                  className="mt-2 inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold tracking-wide text-white hover:bg-accent-hover"
                >
                  Download zip
                </a>
                <p className="mt-2 text-xs text-ink-subtle">
                  Link expires{' '}
                  {job.expires_at
                    ? new Date(job.expires_at).toLocaleString()
                    : 'in 24 hours'}
                  .
                </p>
              </div>
            )}
            {job.status === 'failed' && (
              <p className="text-rose-300">
                Export failed. {job.error_message ?? 'Please try again.'}
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADR-0038: Delete account row + multi-step modal
// ============================================================================

type DeleteStep = 'intro' | 'export' | 'confirm' | 'sent';

function DeleteAccountRow() {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-elevated"
      >
        <div>
          <p className="text-sm font-semibold text-rose-400">Delete account</p>
          <p className="mt-1 text-sm text-ink-muted">
            Permanently delete your Cadencea account and cloud data.
          </p>
        </div>
        <Chevron />
      </button>
      {open && <DeleteAccountModal onClose={() => setOpen(false)} />}
    </li>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<DeleteStep>('intro');
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await accountDeletion.request(reason || undefined);
      setMaskedEmail(resp.email_sent_to);
      setStep('sent');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not send confirmation email. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-md border border-line bg-canvas p-6 text-ink">
        <h3 className="text-lg font-semibold text-rose-400">Delete account</h3>

        {step === 'intro' && (
          <div>
            <p className="mt-3 text-sm text-ink-muted">
              Read carefully. After 30 days, this cannot be undone.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-muted">
              <li>
                Your cloud vault and uploaded files will be permanently
                deleted after 30 days.
              </li>
              <li>
                Projects you&apos;ve shared with others will be unshared
                immediately.
              </li>
              <li>
                Projects shared with you will be removed from your inbox
                immediately.
              </li>
              <li>
                Files on your own computer are not affected.
              </li>
              <li>
                Your subscription will be cancelled at the end of the current
                billing period.
              </li>
              <li>
                Payment records are retained as required by law.
              </li>
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('export')}
                className="inline-flex h-9 items-center rounded-sm border border-rose-400 bg-rose-500/10 px-4 text-xs font-semibold tracking-wide text-rose-200 hover:bg-rose-500/20"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'export' && (
          <div>
            <p className="mt-3 text-sm text-ink-muted">
              Want to download your files first? You&apos;ll get a zip of
              everything in your cloud vault.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await dataExport.request();
                  } catch {
                    /* non-fatal — user can still try from the export modal */
                  }
                  setStep('confirm');
                }}
                className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold tracking-wide text-white hover:bg-accent-hover"
              >
                Start export &amp; continue
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <p className="mt-3 text-sm text-ink-muted">
              We&apos;ll email you a confirmation link. After clicking the
              link, your account will be scheduled for deletion. After 30
              days, this cannot be undone.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-ink">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Helps us improve Cadencea"
              maxLength={500}
              className="mt-2 block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-ink">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-2 block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink placeholder-ink-subtle focus:border-accent focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={typed !== 'DELETE' || submitting}
                className="inline-flex h-9 items-center rounded-sm bg-rose-600 px-4 text-xs font-semibold tracking-wide text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send confirmation email'}
              </button>
            </div>
          </div>
        )}

        {step === 'sent' && (
          <div>
            <p className="mt-3 text-sm text-ink-muted">
              Check your email — we sent a confirmation link to{' '}
              <span className="font-mono text-ink">{maskedEmail}</span>. The
              link expires in 60 minutes.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Until you click the link, nothing has changed. If you change
              your mind, just close this dialog and the link will expire on
              its own.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Close
              </button>
            </div>
          </div>
        )}
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
  hint,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hint?: string;
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
      {hint && !disabled && (
        <p className="mt-2 text-xs text-ink-muted">{hint}</p>
      )}
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
