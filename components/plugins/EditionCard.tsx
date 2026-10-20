'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { Check } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { activeLicenseFor } from '@/lib/plugins/access-client';
import { priceLabel, type ListedProduct, type VaultChannel } from '@/lib/plugins/catalog';
import { SEATS_PER_LICENSE, type PluginProduct } from '@/lib/plugins/products';
import { useCart } from './CartContext';
import GetForFree from './GetForFree';
import InAccountPanel from './InAccountPanel';
import { useEntitlements } from './useEntitlements';

export interface EditionEntry {
  product: PluginProduct;
  listing: ListedProduct;
}

/**
 * One plugin's buy box: name, price, the action and its features. Free
 * products are claimed into the account ("Get for free"); paid ones go in the
 * cart. A signed-in visitor who already owns it sees "It's in your account".
 */
export default function EditionCard({
  product,
  listing,
  apiReachable,
  vaultChannel,
}: EditionEntry & { apiReachable: boolean; vaultChannel: VaultChannel }) {
  const entitlements = useEntitlements();
  const owned = Boolean(activeLicenseFor(entitlements.licenses, product.id));
  const free = listing.isFree || listing.priceMinor === 0;
  return (
    <article
      aria-labelledby={`${product.tier}-title`}
      className={`flex flex-col rounded-md border bg-canvas p-6 sm:p-8 ${free ? 'border-line' : 'border-ink'}`}
    >
      <h1 id={`${product.tier}-title`} className="text-2xl font-bold tracking-tight text-ink">
        {product.name}
      </h1>

      <div className="mt-6">
        <p className="text-3xl font-bold tracking-tight text-ink">{priceLabel(listing)}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {free ? 'Added to your Cadencea account.' : 'One-time purchase. VAT included where it applies.'}
        </p>
      </div>

      <div className="mt-6">
        {free ? (
          <GetForFree
            productId={product.id}
            productName={product.name}
            apiReachable={apiReachable}
            owned={owned}
            ownedLoading={entitlements.status === 'loading'}
            onClaimed={entitlements.reload}
            vaultChannel={vaultChannel}
            returnTo={`/vst-plugins/${product.slug}`}
            variant="secondary"
          />
        ) : (
          <AddToCart product={product} owned={owned} vaultChannel={vaultChannel} />
        )}
      </div>

      <ul className="mt-8 space-y-3 border-t border-line pt-6">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-relaxed text-ink">
            <Check size={16} className="mt-0.5 shrink-0 text-ink-muted" />
            {feature}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-6 text-xs text-ink-subtle">
        Up to {listing.maxActivations || SEATS_PER_LICENSE} computers · Installs with Cadencea Vault (free)
      </p>
    </article>
  );
}

function AddToCart({ product, owned, vaultChannel }: { product: PluginProduct; owned: boolean; vaultChannel: VaultChannel }) {
  const cart = useCart();
  const toast = useToast();

  if (owned) {
    return <InAccountPanel productId={product.id} vaultChannel={vaultChannel} title="You own this" />;
  }
  if (cart.ready && cart.has(product.id)) {
    return (
      <div>
        <Button href="/cart" size="lg" fullWidth>
          View cart
        </Button>
        <p className="mt-3 text-sm text-ink-muted">{product.name} is in your cart.</p>
      </div>
    );
  }
  return (
    <Button
      size="lg"
      fullWidth
      loading={!cart.ready}
      onClick={() => {
        cart.add(product.id);
        toast.show(`${product.name} is in your cart.`);
      }}
    >
      Add to cart
    </Button>
  );
}
