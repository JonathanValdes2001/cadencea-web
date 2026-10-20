'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { ArrowRight } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { accessErrorMessage, redeemSerial } from '@/lib/plugins/access-client';
import type { VaultChannel } from '@/lib/plugins/catalog';
import { pluginById } from '@/lib/plugins/products';
import MyPlugins from './MyPlugins';
import { useEntitlements } from './useEntitlements';

const ACCOUNT_LINKS = [
  { href: '/account/subscription', title: 'Subscription', body: 'Your Cadencea Vault plan, billing and invoices.' },
  { href: '/account/cloud-storage', title: 'Cloud storage', body: 'Where to see and manage your cloud space.' },
  { href: '/account/settings', title: 'Account settings', body: 'Profile, email, password, data export and deletion.' },
];

/**
 * /account: the signed-in overview Cadencea Vault links to. My plugins first
 * (licenses and the computers using them), then serial redemption and the
 * existing account pages.
 */
export default function AccountOverview({ vaultChannel, storeOpen }: { vaultChannel: VaultChannel; storeOpen: boolean }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const entitlements = useEntitlements();

  // Same gate as the other account pages: the middleware redirects first, this
  // covers a session that ends while the page is open.
  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=${encodeURIComponent('/account')}`);
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="bg-canvas text-ink">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="h-40 animate-pulse rounded-md bg-elevated" aria-busy="true" aria-label="Loading your account" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Account</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Your account.</h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Signed in as {user.email}. The same account signs in to Cadencea Vault.
          </p>
        </header>

        <section aria-labelledby="my-plugins" className="mb-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="my-plugins" className="text-2xl font-bold tracking-tight text-ink">
                My plugins
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                Install and activate them in Cadencea Vault ▸ Plugins. Each license works on a limited number of
                computers; deactivate one here to free it.
              </p>
            </div>
            {storeOpen && (
              <Link href="/vst-plugins" className="text-sm font-medium text-accent-ink hover:text-accent-hover">
                Browse plugins
              </Link>
            )}
          </div>
          <MyPlugins entitlements={entitlements} vaultChannel={vaultChannel} storeOpen={storeOpen} />
        </section>

        <section aria-labelledby="redeem" className="mb-12 rounded-md border border-line bg-canvas p-6">
          <h2 id="redeem" className="text-lg font-semibold tracking-tight text-ink">
            Redeem a serial number
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Got a Cadencea serial number? Redeem it to add the plugin to this account.
          </p>
          <RedeemSerialForm onRedeemed={entitlements.reload} />
        </section>

        <section aria-labelledby="account-pages">
          <h2 id="account-pages" className="sr-only">
            Account pages
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover-lift group flex h-full flex-col rounded-md border border-line bg-canvas p-6 hover:border-line-strong"
                >
                  <span className="flex items-center justify-between gap-3 text-base font-semibold text-ink group-hover:text-accent-ink">
                    {link.title}
                    <ArrowRight size={16} />
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-ink-muted">{link.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function RedeemSerialForm({ onRedeemed }: { onRedeemed: () => void }) {
  const toast = useToast();
  const [serial, setSerial] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = serial.trim();
    if (!value) {
      setError('Enter your serial number.');
      return;
    }
    if (value.length > 64) {
      setError('That is not a valid Cadencea serial number.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const license = await redeemSerial(value);
      const name = pluginById(license.productId)?.name ?? license.productId;
      toast.show(`${name} is in your account. Install it from Cadencea Vault ▸ Plugins.`);
      setSerial('');
      onRedeemed();
    } catch (err) {
      setError(accessErrorMessage(err, 'That serial number couldn’t be redeemed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <TextField
          id="serial"
          name="serial"
          label="Serial number"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          value={serial}
          onChange={(e) => {
            setSerial(e.target.value);
            if (error) setError('');
          }}
          error={error || undefined}
        />
      </div>
      <Button type="submit" loading={submitting} className="sm:mt-7">
        Redeem
      </Button>
    </form>
  );
}
