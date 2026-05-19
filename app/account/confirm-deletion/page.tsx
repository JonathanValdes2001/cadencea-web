'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  accountDeletion,
  type AccountDeletionStatusResponse,
  ApiError,
} from '@/lib/api-client';

/**
 * ADR-0038: magic-link confirmation page.
 *
 * The user clicks the link from their email; this page reads `token` from
 * the URL and POSTs it to /auth/me/deletion-confirm. On success the API
 * flips the user to pending_deletion, bumps token_version (logging them
 * out of every device), and runs share cleanup synchronously.
 *
 * After confirm, we show the scheduled purge date and a Cancel button
 * route — but the user is now signed out, so cancellation requires a fresh
 * sign-in.
 */
export default function ConfirmDeletionPage() {
  return (
    <Suspense fallback={<ConfirmDeletionShell />}>
      <ConfirmDeletionContent />
    </Suspense>
  );
}

function ConfirmDeletionContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  type State =
    | { kind: 'ready' }
    | { kind: 'submitting' }
    | { kind: 'success'; data: AccountDeletionStatusResponse }
    | { kind: 'error'; message: string };

  const [state, setState] = useState<State>(
    token ? { kind: 'ready' } : { kind: 'error', message: 'Missing confirmation token. Open the link from your email.' }
  );

  const submit = async () => {
    if (!token) return;
    setState({ kind: 'submitting' });
    try {
      const data = await accountDeletion.confirm(token);
      setState({ kind: 'success', data });
    } catch (err) {
      setState({
        kind: 'error',
        message:
          err instanceof ApiError
            ? err.message
            : 'Could not confirm deletion. The link may have expired.',
      });
    }
  };

  // Auto-submit on load. The user already opted in by clicking the email
  // link; making them click another button is friction without security
  // gain.
  useEffect(() => {
    if (state.kind === 'ready') submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-xl px-6 py-24 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          Account deletion
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Confirming…</h1>

        {state.kind === 'submitting' && (
          <p className="mt-6 text-sm text-ink-muted">
            Confirming your account deletion…
          </p>
        )}

        {state.kind === 'error' && (
          <div className="mt-8 rounded-md border border-rose-500/40 bg-rose-500/10 p-6">
            <p className="font-semibold text-rose-300">
              Could not confirm deletion
            </p>
            <p className="mt-2 text-sm text-ink-muted">{state.message}</p>
            <Link
              href="/account/settings"
              className="mt-4 inline-flex h-9 items-center rounded-sm border border-line px-4 text-xs font-semibold tracking-wide text-ink hover:bg-elevated"
            >
              Back to settings
            </Link>
          </div>
        )}

        {state.kind === 'success' && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">
              Your account is scheduled for deletion.
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              {state.data.scheduled_purge_at ? (
                <>
                  We&apos;ll permanently delete your cloud vault and Cadencea
                  profile on{' '}
                  <strong>
                    {new Date(state.data.scheduled_purge_at).toLocaleString()}
                  </strong>
                  . After that, this cannot be undone.
                </>
              ) : (
                'We will permanently delete your cloud vault and profile in 30 days.'
              )}
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              You have been signed out of every device. Sign back in any time
              before the deletion date to cancel.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-muted">
              <li>Shared projects you owned have been unshared.</li>
              <li>Projects shared with you have been removed from your inbox.</li>
              <li>Files on your computer were not touched.</li>
              <li>
                Your subscription, if any, will end at the close of the current
                billing period.
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-sm bg-accent px-5 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
              >
                Sign in to cancel
              </Link>
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-sm border border-line px-5 text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Done
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDeletionShell() {
  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-xl px-6 py-24 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          Account deletion
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Confirmingâ€¦</h1>
        <p className="mt-6 text-sm text-ink-muted">
          Loading your confirmation linkâ€¦
        </p>
      </div>
    </div>
  );
}
