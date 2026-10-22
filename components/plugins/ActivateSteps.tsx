'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { StepNumber } from '@/components/ui/Chip';
import { useAuth } from '@/lib/auth-context';
import { loginRedirectPath } from '@/lib/auth-route-policy.mjs';
import { accessErrorMessage, activeLicenseFor } from '@/lib/plugins/access-client';
import { priceLabel, vaultDeepLink, type ListedProduct, type VaultChannel } from '@/lib/plugins/catalog';
import { productPageHref } from '@/lib/plugins/products';
import GetForFree, { signUpHref } from './GetForFree';
import { useEntitlements } from './useEntitlements';

/**
 * The /activate/<id> checklist: a Cadencea account, a license, then Cadencea
 * Vault (open it, or download it: `downloads` is rendered on the server).
 */
export default function ActivateSteps({
  productId,
  productName,
  listing,
  apiReachable,
  storeOpen,
  channel,
  returnTo,
  downloads,
}: {
  productId: string;
  productName: string;
  listing: ListedProduct;
  apiReachable: boolean;
  storeOpen: boolean;
  channel: VaultChannel;
  returnTo: string;
  downloads: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const entitlements = useEntitlements();
  const free = listing.isFree || listing.priceMinor === 0;
  const owned = Boolean(activeLicenseFor(entitlements.licenses, productId));
  const deepLink = vaultDeepLink(productId, channel);
  const appName = channel === 'beta' ? 'CadenceaVault Beta' : 'Cadencea Vault';

  const buyLink = storeOpen ? (
    <Button href={productPageHref(productId)} size="md">
      {free ? `Get ${productName} for free` : `Buy ${productName} · ${priceLabel(listing)}`}
    </Button>
  ) : (
    <p className="text-sm text-ink-muted">
      {productName} isn’t on sale yet. Have a serial number? Redeem it on{' '}
      <Link href="/account" className="font-medium text-accent-ink hover:text-accent-hover">
        your account page
      </Link>
      .
    </p>
  );

  let licenseStep: React.ReactNode;
  let licenseDone = false;
  if (authLoading || (user && entitlements.status === 'loading')) {
    licenseStep = <p className="text-sm text-ink-muted">Checking your licenses…</p>;
  } else if (!user) {
    licenseStep = (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">Sign in first and we’ll check whether {productName} is in your account.</p>
        {!free && buyLink}
      </div>
    );
  } else if (owned) {
    licenseDone = true;
    licenseStep = <p className="text-sm text-ink-muted">{productName} is in your account.</p>;
  } else if (entitlements.status === 'error' && !free) {
    licenseStep = (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          {accessErrorMessage(entitlements.error)} If you already own {productName}, go ahead and open Cadencea Vault.
        </p>
        {buyLink}
      </div>
    );
  } else if (free) {
    licenseStep = (
      <div className="max-w-sm">
        <GetForFree
          productId={productId}
          productName={productName}
          apiReachable={apiReachable}
          owned={false}
          onClaimed={entitlements.reload}
          vaultChannel={channel}
          returnTo={returnTo}
        />
      </div>
    );
  } else {
    licenseStep = (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">{productName} isn’t in this account yet.</p>
        {buyLink}
      </div>
    );
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      <Step n={1} title="Your Cadencea account" done={Boolean(user)}>
        {authLoading ? (
          <p className="text-sm text-ink-muted">Checking…</p>
        ) : user ? (
          <p className="text-sm text-ink-muted">Signed in as {user.email}. Use the same account in {appName}.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">Licenses belong to your Cadencea account, the one you use for {appName}.</p>
            <div className="flex flex-wrap gap-3">
              <Button href={loginRedirectPath(returnTo)} size="md" prefetch={false}>
                Sign in
              </Button>
              <Button href={signUpHref(returnTo)} variant="secondary" size="md" prefetch={false}>
                Create a free account
              </Button>
            </div>
          </div>
        )}
      </Step>

      <Step n={2} title={`A license for ${productName}`} done={licenseDone}>
        {licenseStep}
      </Step>

      <Step n={3} title={`Open ${appName}`}>
        <p className="text-sm leading-relaxed text-ink-muted">
          {appName} opens {productName} in Plugins. Activate it there for this computer.
        </p>
        {deepLink && (
          <Button href={deepLink} size="lg" className="mt-4" prefetch={false}>
            Open {appName}
          </Button>
        )}
        <div className="mt-8">
          <p className="text-sm font-semibold text-ink">Don’t have {appName} yet?</p>
          <p className="mt-1 text-sm text-ink-muted">It’s free. Install it, sign in, then come back and open it from here.</p>
          <div className="mt-4">{downloads}</div>
        </div>
      </Step>
    </ol>
  );
}

function Step({ n, title, done = false, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-8">
      <StepNumber n={n} />
      <div>
        <h2 className="flex flex-wrap items-center gap-3 text-lg font-semibold tracking-tight text-ink">
          {title}
          {done && <Badge tone="success">Done</Badge>}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}
