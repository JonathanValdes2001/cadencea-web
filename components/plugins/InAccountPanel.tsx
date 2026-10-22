import React from 'react';
import Button from '@/components/ui/Button';
import { Check } from '@/components/ui/Icons';
import { vaultDeepLink, type VaultChannel } from '@/lib/plugins/catalog';

/**
 * "It's in your account": shown after a free claim and wherever the visitor
 * already owns the product. Points at Cadencea Vault ▸ Plugins, which installs
 * and activates it.
 */
export default function InAccountPanel({
  productId,
  vaultChannel,
  title = 'It’s in your account',
  className = '',
}: {
  productId: string;
  vaultChannel: VaultChannel;
  title?: string;
  className?: string;
}) {
  const deepLink = vaultDeepLink(productId, vaultChannel);
  return (
    <div role="status" className={`rounded-md border border-line bg-tone-success-bg p-4 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-tone-success">
        <Check size={16} />
        {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        Install it from Cadencea Vault ▸ Plugins, signed in with this account.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {deepLink && (
          <Button href={deepLink} size="sm" prefetch={false}>
            Open Cadencea Vault
          </Button>
        )}
        <Button href="/cadenceavault#download" variant="secondary" size="sm" prefetch={false}>
          Download Cadencea Vault
        </Button>
      </div>
    </div>
  );
}
