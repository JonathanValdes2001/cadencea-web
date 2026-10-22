'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { loginRedirectPath } from '@/lib/auth-route-policy.mjs';
import { accessErrorMessage, claimFreeProduct } from '@/lib/plugins/access-client';
import type { VaultChannel } from '@/lib/plugins/catalog';
import InAccountPanel from './InAccountPanel';

export const STORE_OFFLINE_NOTE = 'The plugin store isn’t connected yet. This opens at launch.';

export function signUpHref(returnTo: string): string {
  return `/signup?redirect=${encodeURIComponent(returnTo)}`;
}

/**
 * "Get for free" for a free plugin. Signed out it sends the visitor to sign in
 * (or create an account) and back to `returnTo`; signed in it claims the
 * product into the account (POST /v1/access/products/<id>/claim, idempotent)
 * and then points at Cadencea Vault ▸ Plugins.
 */
export default function GetForFree({
  productId,
  productName,
  apiReachable,
  owned,
  ownedLoading = false,
  onClaimed,
  vaultChannel,
  returnTo,
  variant = 'primary',
}: {
  productId: string;
  productName: string;
  apiReachable: boolean;
  /** Already in the account (from entitlements). */
  owned: boolean;
  /** Entitlements still loading for a signed-in visitor. */
  ownedLoading?: boolean;
  onClaimed?: () => void;
  vaultChannel: VaultChannel;
  /** Where sign-in and sign-up come back to. */
  returnTo: string;
  variant?: 'primary' | 'secondary';
}) {
  const { user, loading: authLoading } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  if (owned || claimed) {
    return <InAccountPanel productId={productId} vaultChannel={vaultChannel} />;
  }

  if (authLoading || (user && ownedLoading)) {
    return (
      <Button variant={variant} size="lg" fullWidth loading>
        Get for free
      </Button>
    );
  }

  if (!user) {
    return (
      <div>
        <Button href={loginRedirectPath(returnTo)} variant={variant} size="lg" fullWidth prefetch={false}>
          Get for free
        </Button>
        <p className="mt-3 text-sm text-ink-muted">
          Sign in to add it to your account. New to Cadencea?{' '}
          <Link href={signUpHref(returnTo)} prefetch={false} className="font-medium text-accent-ink hover:text-accent-hover">
            Create a free account
          </Link>
        </p>
      </div>
    );
  }

  const claim = async () => {
    setClaiming(true);
    setError('');
    try {
      await claimFreeProduct(productId);
      setClaimed(true);
      onClaimed?.();
    } catch (err) {
      setError(accessErrorMessage(err, `${productName} couldn’t be added. Please try again.`));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div>
      <Button
        variant={variant}
        size="lg"
        fullWidth
        loading={claiming}
        disabled={!apiReachable}
        disabledReason={!apiReachable ? STORE_OFFLINE_NOTE : undefined}
        onClick={claim}
      >
        Get for free
      </Button>
      {!apiReachable && <p className="mt-3 text-sm text-ink-muted">{STORE_OFFLINE_NOTE}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-tone-danger">
          {error}
        </p>
      )}
    </div>
  );
}
