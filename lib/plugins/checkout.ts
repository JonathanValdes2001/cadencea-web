/**
 * THE checkout hook. Everything on the website that buys plugins goes through
 * here; nothing else knows about the payment provider (Stripe hosted Checkout,
 * with Managed Payments when the API's switch is on).
 *
 *   1. POST the product ids (never a price) to cadencea-api with the Supabase
 *      session token; the API prices them and creates the Checkout,
 *   2. send the browser to the hosted Checkout (Stripe's own pages only),
 *   3. the API's webhook grants the licenses, and Stripe sends people back to
 *      /account?purchase=complete.
 * The cart page already requires sign-in and only calls startCheckout when every
 * item is purchasable according to the API (lib/plugins/cart-state.ts `checkoutBlock`).
 */

import { AccessApiError, createAllPluginsCheckout, createPluginCheckout } from './access-client';
import type { CartItem } from './cart-state';

export type CheckoutResult =
  /** Send the browser to the provider's hosted checkout. */
  | { status: 'redirect'; url: string }
  /** Checkout isn't open (before launch, or switched off). Not an error. */
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

const UNAVAILABLE = 'Checkout isn’t available right now. Your cart is saved on this device.';

function failed(error: unknown): CheckoutResult {
  if (error instanceof AccessApiError) {
    if (error.status === 503) return { status: 'unavailable', message: UNAVAILABLE };
    return { status: 'error', message: error.message };
  }
  return { status: 'error', message: 'Checkout couldn’t start. Please try again.' };
}

export async function startCheckout(items: readonly CartItem[]): Promise<CheckoutResult> {
  try {
    return { status: 'redirect', url: await createPluginCheckout(items.map((item) => item.productId)) };
  } catch (error) {
    return failed(error);
  }
}

/** The All Plugins subscription: the same flow, from the pricing page. */
export async function startAllPluginsCheckout(): Promise<CheckoutResult> {
  try {
    return { status: 'redirect', url: await createAllPluginsCheckout() };
  } catch (error) {
    return failed(error);
  }
}
