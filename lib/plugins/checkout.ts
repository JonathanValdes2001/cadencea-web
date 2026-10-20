/**
 * THE checkout hook. Everything on the website that buys plugins goes through
 * startCheckout(); nothing else knows about the payment provider.
 *
 * Today it answers "not available yet". Launch plan S5 (Stripe Managed Payments,
 * hosted Checkout) fills it in:
 *   1. POST the items to a cadencea-api checkout endpoint with the Supabase
 *      session token (the server prices them; never send a price from here),
 *   2. return `{ status: 'redirect', url }` with the hosted Checkout URL,
 *   3. the API's webhook grants the licenses (`grant_license()`), and Stripe
 *      sends people back to a success page that points them at Cadencea Vault.
 * The cart page already requires sign-in and only calls this when every item is
 * purchasable according to the API (lib/plugins/cart-state.ts `checkoutBlock`).
 */

import type { CartItem } from './cart-state';

export type CheckoutResult =
  /** Send the browser to the provider's hosted checkout. */
  | { status: 'redirect'; url: string }
  /** Checkout isn't open (before launch, or switched off). Not an error. */
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

export async function startCheckout(items: readonly CartItem[]): Promise<CheckoutResult> {
  void items;
  return {
    status: 'unavailable',
    message: 'Checkout isn’t available yet. It opens when ATHENA launches; your cart is saved on this device.',
  };
}
