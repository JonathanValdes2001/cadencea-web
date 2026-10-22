/**
 * The plugin cart's state, without React. The cart lives in the browser (one
 * of each product, no quantities: a license covers a person, not a copy) and is
 * saved to localStorage by components/plugins/CartContext.tsx. Free of React and
 * Next so tests/plugins-store.test.mjs can import it.
 */

// The `.ts` extension lets Node's test runner load this file without a bundler.
import { isValidProductId as validId, type ListedProduct } from './catalog.ts';

export interface CartItem {
  productId: string;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: 'add'; productId: string }
  | { type: 'remove'; productId: string }
  | { type: 'clear' }
  /** Replaces the cart with what was saved (another tab, or the first render). */
  | { type: 'hydrate'; items: unknown };

export const CART_STORAGE_KEY = 'cadencea.plugin-cart.v1';
export const MAX_CART_ITEMS = 20;
export const EMPTY_CART: CartState = { items: [] };

/** Keeps valid, unique product ids in order, at most MAX_CART_ITEMS. Accepts ids or `{ productId }`. */
export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of value) {
    const id = typeof entry === 'string' ? entry : entry && typeof entry === 'object' ? (entry as { productId?: unknown }).productId : null;
    if (!validId(id) || seen.has(id)) continue;
    seen.add(id);
    items.push({ productId: id });
    if (items.length >= MAX_CART_ITEMS) break;
  }
  return items;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      if (!validId(action.productId)) return state;
      if (state.items.some((item) => item.productId === action.productId)) return state;
      if (state.items.length >= MAX_CART_ITEMS) return state;
      return { items: [...state.items, { productId: action.productId }] };
    }
    case 'remove': {
      const items = state.items.filter((item) => item.productId !== action.productId);
      return items.length === state.items.length ? state : { items };
    }
    case 'clear':
      return state.items.length ? EMPTY_CART : state;
    case 'hydrate':
      return { items: sanitizeCartItems(action.items) };
    default:
      return state;
  }
}

/** What localStorage held, or an empty list for anything unreadable. */
export function parseStoredCart(raw: string | null | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const items = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as { items?: unknown }).items : parsed;
    return sanitizeCartItems(items);
  } catch {
    return [];
  }
}

export function serializeCart(state: CartState): string {
  return JSON.stringify({ items: state.items.map((item) => item.productId) });
}

export interface CartTotals {
  count: number;
  /** Sum of the known items' prices, in minor units. */
  subtotalMinor: number;
  /** The one currency of the cart; null when empty or when items disagree. */
  currency: string | null;
  /** Items whose product the site doesn't list (an old id left in storage). */
  unknown: string[];
}

export function cartTotals(items: readonly CartItem[], products: readonly ListedProduct[]): CartTotals {
  const byId = new Map(products.map((product) => [product.id, product]));
  let subtotalMinor = 0;
  const currencies = new Set<string>();
  const unknown: string[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      unknown.push(item.productId);
      continue;
    }
    subtotalMinor += product.isFree ? 0 : product.priceMinor;
    currencies.add(product.currency.toUpperCase());
  }
  return {
    count: items.length,
    subtotalMinor,
    currency: currencies.size === 1 ? [...currencies][0] : null,
    unknown,
  };
}

export type CheckoutBlock =
  /** Nothing to buy. */
  | 'empty'
  /** The licensing API didn't answer, or doesn't list an item: prices can't be confirmed. */
  | 'unavailable'
  /** An item has no payment-provider price yet (`purchasable: false`). */
  | 'not_purchasable'
  /** Items are priced in different currencies. */
  | 'mixed_currency';

/**
 * Why checkout can't start, or null when it can. Checkout is only offered for
 * prices the API confirmed and products it marks purchasable.
 */
export function checkoutBlock(
  items: readonly CartItem[],
  products: readonly ListedProduct[],
  { apiReachable }: { apiReachable: boolean },
): CheckoutBlock | null {
  if (!items.length) return 'empty';
  if (!apiReachable) return 'unavailable';
  const byId = new Map(products.map((product) => [product.id, product]));
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || !product.fromApi) return 'unavailable';
    if (!product.purchasable) return 'not_purchasable';
  }
  if (cartTotals(items, products).currency === null) return 'mixed_currency';
  return null;
}
