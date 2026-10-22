'use client';

import { useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { requirePublicSupabaseConfig } from '@/lib/supabase/config';
import { changeAccountPassword, passwordChangeError } from '@/lib/password-change.mjs';

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };
const inputStyle = 'mt-2 block h-11 w-full rounded-sm border border-line bg-elevated px-3.5 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60';
const buttonStyle = 'inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-sm font-semibold disabled:opacity-60';

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [nonce, setNonce] = useState('');
  const [codeRequired, setCodeRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);
  const toggle = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    setPasswords(emptyPasswords);
    setNonce('');
    setCodeRequired(false);
    setError('');
    setNotice('');
    toggle.current?.focus();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const [url, key] = requirePublicSupabaseConfig();
      const verifier = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'cadencea-password-verification',
        },
      });
      const result = await changeAccountPassword(supabase.auth, verifier.auth, { ...passwords, nonce });
      if (result === 'code_required') {
        setCodeRequired(true);
        setNotice('We emailed you a confirmation code. Enter it below to finish changing your password.');
      } else {
        close();
        setNotice('Your password has been changed. Use your new password the next time you sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password. Try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function resend() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: sendError } = await supabase.auth.reauthenticate();
      if (sendError) throw sendError;
      setNonce('');
      setNotice('A new confirmation code has been emailed to you.');
    } catch (err) {
      setError(passwordChangeError(err));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <li>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="change-password-form"
        disabled={busy}
        onClick={() => {
          if (open) close();
          else {
            setNotice('');
            setOpen(true);
          }
        }}
        className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-elevated disabled:opacity-60"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">Change password</span>
          <span className="mt-1 block text-sm text-ink-muted">Update your account password securely.</span>
        </span>
        <span aria-hidden="true" className="text-ink-muted">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <form id="change-password-form" onSubmit={submit} className="space-y-4 pb-6" aria-label="Change password" aria-busy={busy}>
          <p className="text-sm text-ink-muted">Enter your current password and choose a new password with at least 8 characters.</p>
          <fieldset disabled={busy} className="space-y-4">
            {([
              ['currentPassword', 'Current password', 'current-password'],
              ['newPassword', 'New password', 'new-password'],
              ['confirmPassword', 'Confirm new password', 'new-password'],
            ] as const).map(([name, label, autoComplete]) => (
              <div key={name}>
                <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
                <input id={name} name={name} type="password" autoComplete={autoComplete}
                  required minLength={name === 'newPassword' ? 8 : undefined}
                  value={passwords[name]} className={inputStyle}
                  onChange={(event) => setPasswords({ ...passwords, [name]: event.target.value })} />
              </div>
            ))}
            {codeRequired && (
              <div>
                <label htmlFor="password-confirmation-code" className="text-sm font-semibold text-ink">Email confirmation code</label>
                <input id="password-confirmation-code" name="nonce" type="text" autoComplete="one-time-code"
                  inputMode="numeric" required value={nonce} className={inputStyle}
                  onChange={(event) => setNonce(event.target.value)} />
              </div>
            )}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={`${buttonStyle} bg-accent text-white hover:bg-accent-hover`}>
              {busy ? 'Please wait…' : codeRequired ? 'Confirm password change' : 'Save new password'}
            </button>
            <button type="button" disabled={busy} onClick={close} className={`${buttonStyle} border border-line text-ink`}>Cancel</button>
            {codeRequired && <button type="button" disabled={busy} onClick={resend} className={`${buttonStyle} text-ink`}>Send a new code</button>}
          </div>
        </form>
      )}
      {error && <p role="alert" className="pb-4 text-sm text-rose-400">{error}</p>}
      {notice && <p role="status" className="pb-4 text-sm text-ink-muted">{notice}</p>}
    </li>
  );
}
