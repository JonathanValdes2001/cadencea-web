'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Trash } from '@/components/ui/Icons';
import { useAuth } from '@/lib/auth-context';
import { loginRedirectPath } from '@/lib/auth-route-policy.mjs';
import { activeLicenseFor } from '@/lib/plugins/access-client';
import { formatPrice, priceLabel, type ListedProduct, type VaultChannel } from '@/lib/plugins/catalog';
import { cartTotals, checkoutBlock } from '@/lib/plugins/cart-state';
import { startCheckout } from '@/lib/plugins/checkout';
import { SEATS_PER_LICENSE, pluginById, productPageHref } from '@/lib/plugins/products';
import { useCart } from './CartContext';
import InAccountPanel from './InAccountPanel';
import PluginShot from './PluginShot';
import { useEntitlements } from './useEntitlements';

export const CHECKOUT_CLOSED = 'Checkout opens at launch';

/**
 * The plugin cart: items, remove, subtotal and the checkout button. Checkout is
 * offered only for prices the licensing API confirmed and products it marks
 * purchasable, and only to a signed-in visitor; it then goes through
 * startCheckout() (lib/plugins/checkout.ts), the one payment hook.
 */
export default function CartView({
  products,
  apiReachable,
  vaultChannel,
}: {
  products: ListedProduct[];
  apiReachable: boolean;
  vaultChannel: VaultChannel;
}) {
  const cart = useCart();
  const { user, loading: authLoading } = useAuth();
  const entitlements = useEntitlements();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const totals = cartTotals(cart.items, products);
  const byId = new Map(products.map((product) => [product.id, product]));
  const owned = cart.items.filter((item) => activeLicenseFor(entitlements.licenses, item.productId));
  const block = checkoutBlock(cart.items, products, { apiReachable });

  const checkout = async () => {
    setCheckingOut(true);
    setCheckoutMessage('');
    try {
      const result = await startCheckout(cart.items);
      if (result.status === 'redirect') {
        window.location.assign(result.url);
        return;
      }
      setCheckoutMessage(result.message);
    } catch {
      setCheckoutMessage('Checkout couldn’t start. Please try again.');
    }
    setCheckingOut(false);
  };

  let action: React.ReactNode;
  if (block !== null || totals.unknown.length) {
    action = (
      <>
        <Button size="lg" fullWidth disabled disabledReason={CHECKOUT_CLOSED}>
          Checkout
        </Button>
        <p className="mt-3 text-sm text-ink-muted">{CHECKOUT_CLOSED}. Your cart is saved on this device.</p>
      </>
    );
  } else if (owned.length) {
    action = (
      <>
        <Button size="lg" fullWidth disabled disabledReason="Remove what’s already in your account first">
          Checkout
        </Button>
        <p className="mt-3 text-sm text-ink-muted">Remove what’s already in your account to check out.</p>
      </>
    );
  } else if (authLoading) {
    action = (
      <Button size="lg" fullWidth loading>
        Checkout
      </Button>
    );
  } else if (!user) {
    action = (
      <>
        <Button href={loginRedirectPath('/cart')} size="lg" fullWidth prefetch={false}>
          Sign in to check out
        </Button>
        <p className="mt-3 text-sm text-ink-muted">Your plugins go to the Cadencea account you check out with.</p>
      </>
    );
  } else {
    action = (
      <>
        <Button size="lg" fullWidth loading={checkingOut} onClick={checkout}>
          Checkout
        </Button>
        <p className="mt-3 text-sm text-ink-muted">Your plugins go to {user.email ?? 'this account'}.</p>
      </>
    );
  }

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Plugins</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Your cart.</h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Plugins you buy belong to your Cadencea account. Install them with Cadencea Vault.
          </p>
        </header>

        {!cart.ready ? (
          <div className="h-40 animate-pulse rounded-md bg-elevated" aria-busy="true" aria-label="Loading your cart" />
        ) : cart.items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            body="ATHENA EQ Complex is on the plugins page. ATHENA EQ Mini is free: get it there too, no cart needed."
            action={<Button href="/vst-plugins">Browse plugins</Button>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <ul className="divide-y divide-line border-y border-line">
              {cart.items.map((item) => {
                const product = pluginById(item.productId);
                const listing = byId.get(item.productId);
                const isOwned = owned.some((o) => o.productId === item.productId);
                return (
                  <li key={item.productId} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start">
                    {product && (
                      <Link href={productPageHref(product.id)} className="block w-full shrink-0 sm:w-40">
                        <PluginShot shot={product.screenshot} accent={product.accent} crop sizes="160px" />
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-ink">
                            {product ? (
                              <Link href={productPageHref(product.id)} className="hover:text-accent-ink">
                                {product.name}
                              </Link>
                            ) : (
                              item.productId
                            )}
                          </h2>
                          <p className="mt-1 text-sm text-ink-muted">
                            {product && listing
                              ? `One-time purchase · Up to ${listing.maxActivations || SEATS_PER_LICENSE} computers`
                              : 'This item is no longer available.'}
                          </p>
                        </div>
                        {listing && <p className="shrink-0 text-base font-bold text-ink">{priceLabel(listing)}</p>}
                      </div>
                      {isOwned && (
                        <InAccountPanel
                          productId={item.productId}
                          vaultChannel={vaultChannel}
                          title="Already in your account"
                          className="mt-4"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => cart.remove(item.productId)}
                        className="-ml-2 mt-3 inline-flex h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-muted hover:bg-elevated hover:text-ink"
                      >
                        <Trash size={16} />
                        Remove<span className="sr-only"> {product?.name ?? item.productId}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside aria-labelledby="cart-summary" className="h-fit rounded-md border border-line bg-canvas p-6">
              <h2 id="cart-summary" className="text-lg font-semibold tracking-tight text-ink">
                Summary
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">
                    {totals.count} {totals.count === 1 ? 'item' : 'items'}
                  </dt>
                  <dd className="text-ink">{totals.currency ? formatPrice(totals.subtotalMinor, totals.currency) : '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                  <dt className="font-semibold text-ink">Subtotal</dt>
                  <dd className="font-bold text-ink">{totals.currency ? formatPrice(totals.subtotalMinor, totals.currency) : '—'}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                VAT included where it applies. The final price is confirmed at checkout.
              </p>
              <div className="mt-6">{action}</div>
              {checkoutMessage && (
                <p role="status" className="mt-3 text-sm text-ink">
                  {checkoutMessage}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
