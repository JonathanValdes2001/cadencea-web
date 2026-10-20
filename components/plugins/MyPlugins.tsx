'use client';

import React, { useState } from 'react';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  accessErrorMessage,
  deactivateActivation,
  type Activation,
  type License,
} from '@/lib/plugins/access-client';
import { vaultDeepLink, type VaultChannel } from '@/lib/plugins/catalog';
import { pluginById } from '@/lib/plugins/products';
import type { EntitlementsState } from './useEntitlements';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  expired: { label: 'Expired', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'warning' },
  revoked: { label: 'Revoked', tone: 'danger' },
};

const PLATFORM: Record<string, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function sourceLabel(license: License): string {
  switch (license.source) {
    case 'purchase':
      return 'Purchased';
    case 'serial':
      return 'Redeemed';
    case 'trial':
      return 'Trial started';
    default:
      return 'Added';
  }
}

/**
 * "My plugins" on the account page: each license with its status and the
 * computers holding its seats, each with a Deactivate button.
 */
export default function MyPlugins({
  entitlements,
  vaultChannel,
  storeOpen,
}: {
  entitlements: EntitlementsState & { reload: () => void };
  vaultChannel: VaultChannel;
  storeOpen: boolean;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<{ activation: Activation; productName: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  if (entitlements.status === 'loading' || entitlements.status === 'signed-out') {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading your plugins">
        <div className="h-28 animate-pulse rounded-md bg-elevated" />
      </div>
    );
  }

  if (entitlements.status === 'error') {
    return (
      <div role="alert" className="rounded-md border border-line bg-elevated p-6">
        <p className="text-base font-semibold text-ink">Your plugins can’t be loaded right now.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {accessErrorMessage(entitlements.error)} Your licenses are safe; Cadencea Vault keeps working with the ones
          already activated.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={entitlements.reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (!entitlements.licenses.length) {
    return (
      <EmptyState
        headingLevel="h3"
        title="No plugins yet"
        body="Plugins you buy, get for free or redeem with a serial number show up here and in Cadencea Vault ▸ Plugins."
        action={storeOpen ? <Button href="/vst-plugins">Browse plugins</Button> : undefined}
      />
    );
  }

  const confirmDeactivate = async () => {
    if (!pending) return;
    setBusy(true);
    setDialogError('');
    try {
      await deactivateActivation(pending.activation.id);
      toast.show(`${pending.activation.machineName} no longer uses a seat for ${pending.productName}.`);
      setPending(null);
      entitlements.reload();
    } catch (error) {
      setDialogError(accessErrorMessage(error, 'That computer couldn’t be deactivated. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ul className="space-y-4">
        {entitlements.licenses.map((license) => {
          const product = pluginById(license.productId);
          const name = product?.name ?? license.productId;
          const status = STATUS[license.status] ?? { label: license.status, tone: 'neutral' as BadgeTone };
          const deepLink = license.status === 'active' ? vaultDeepLink(license.productId, vaultChannel) : null;
          return (
            <li key={license.id} className="rounded-md border border-line bg-canvas p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {product && (
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: product.accent }} />
                    )}
                    <h3 className="text-lg font-semibold tracking-tight text-ink">{name}</h3>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {sourceLabel(license)} {formatDate(license.createdAt)}
                    {license.serialHint ? ` · Serial ending ${license.serialHint}` : ''}
                    {license.kind === 'perpetual' ? ' · Perpetual license' : ''}
                    {license.expiresAt ? ` · ${license.status === 'expired' ? 'Expired' : 'Expires'} ${formatDate(license.expiresAt)}` : ''}
                  </p>
                </div>
                {deepLink && (
                  <Button href={deepLink} variant="secondary" size="sm" prefetch={false}>
                    Open in Cadencea Vault
                  </Button>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">
                  Computers{' '}
                  <span className="font-normal text-ink-muted">
                    · {license.activations.length} of {license.maxActivations} in use
                  </span>
                </p>
                {license.activations.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Not activated on a computer yet. Activate it in Cadencea Vault ▸ Plugins.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {license.activations.map((activation) => (
                      <li key={activation.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{activation.machineName}</p>
                          <p className="text-xs text-ink-muted">
                            {PLATFORM[activation.platform] ?? activation.platform} · Activated {formatDate(activation.createdAt)} ·
                            Last seen {formatDate(activation.lastSeenAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="self-start sm:self-auto"
                          onClick={() => {
                            setDialogError('');
                            setPending({ activation, productName: name });
                          }}
                        >
                          Deactivate<span className="sr-only"> {activation.machineName}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={pending !== null}
        onClose={() => {
          if (!busy) setPending(null);
        }}
        title={pending ? `Deactivate ${pending.activation.machineName}?` : 'Deactivate computer?'}
        description={
          pending
            ? `This frees one of the computers for ${pending.productName}. That computer stops using it the next time Cadencea Vault checks in, and you can activate it again later.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </>
        }
      >
        {dialogError ? (
          <p role="alert" className="text-tone-danger">
            {dialogError}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
