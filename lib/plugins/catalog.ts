/**
 * Plugin store rules that don't depend on React, Next or the network: product
 * ids, prices, merging the API's store list over the local fallback, and the
 * Cadencea Vault deep links. Dependency-free so tests/plugins-store.test.mjs can
 * import it directly.
 */

/** Same rule as cadencea-api `app/access/routes.py` (`_PRODUCT_ID`, ≤ 64 characters). */
export const PRODUCT_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
export const PRODUCT_ID_MAX_LENGTH = 64;

export function isValidProductId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= PRODUCT_ID_MAX_LENGTH && PRODUCT_ID_PATTERN.test(value);
}

/** One product as `GET /v1/access/store/products` returns it. */
export interface StoreProduct {
  id: string;
  name: string;
  type: string;
  isFree: boolean;
  priceMinor: number;
  currency: string;
  maxActivations: number;
  trialDays: number | null;
  /** Paid products become buyable once a payment-provider price is attached. */
  purchasable: boolean;
}

/** A product as the website shows it: the API's values when it answered, else the local fallback. */
export interface ListedProduct extends StoreProduct {
  /** True when the price and availability came from the API just now. */
  fromApi: boolean;
}

/**
 * Formats an amount in minor units (cents): 4999 EUR → "€49.99". Unknown
 * currency codes fall back to "49.99 XYZ" instead of throwing.
 */
export function formatPrice(minor: number, currency: string, locale = 'en-IE'): string {
  const amount = (Number.isFinite(minor) ? Math.round(minor) : 0) / 100;
  const code = String(currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

/** "Free" for free products, the formatted price otherwise. */
export function priceLabel(product: Pick<StoreProduct, 'isFree' | 'priceMinor' | 'currency'>): string {
  if (product.isFree || product.priceMinor === 0) return 'Free';
  return formatPrice(product.priceMinor, product.currency);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the store response defensively. Returns null when the body isn't the
 * documented shape, so a half-deployed API never puts a wrong price on a page.
 */
export function parseStoreProducts(body: unknown): StoreProduct[] | null {
  if (!isRecord(body) || !Array.isArray(body.products)) return null;
  const products: StoreProduct[] = [];
  for (const raw of body.products) {
    if (!isRecord(raw)) return null;
    const { id, name, type, isFree, priceMinor, currency, maxActivations, trialDays, purchasable } = raw;
    if (
      !isValidProductId(id) ||
      typeof name !== 'string' ||
      typeof isFree !== 'boolean' ||
      typeof priceMinor !== 'number' ||
      !Number.isInteger(priceMinor) ||
      priceMinor < 0 ||
      typeof currency !== 'string' ||
      !/^[A-Za-z]{3}$/.test(currency) ||
      typeof maxActivations !== 'number' ||
      typeof purchasable !== 'boolean'
    ) {
      return null;
    }
    products.push({
      id,
      name,
      type: typeof type === 'string' ? type : 'effect',
      isFree,
      priceMinor,
      currency: currency.toUpperCase(),
      maxActivations,
      trialDays: typeof trialDays === 'number' ? trialDays : null,
      purchasable,
    });
  }
  return products;
}

/**
 * The products the website shows, in the local order. The API's price, free
 * flag, seats and availability win when it lists the product; otherwise the
 * local fallback is shown and can't be bought (`purchasable: false`). Products
 * the API lists but the site has no page for are left out.
 */
export function mergeStoreProducts(fallback: readonly StoreProduct[], api: readonly StoreProduct[] | null): ListedProduct[] {
  const byId = new Map((api ?? []).map((product) => [product.id, product]));
  return fallback.map((local) => {
    const remote = byId.get(local.id);
    if (!remote) return { ...local, purchasable: false, fromApi: false };
    return {
      ...local,
      isFree: remote.isFree,
      priceMinor: remote.priceMinor,
      currency: remote.currency,
      maxActivations: remote.maxActivations,
      trialDays: remote.trialDays,
      purchasable: remote.purchasable,
      fromApi: true,
    };
  });
}

/* Cadencea Vault deep links ------------------------------------------------ */

export type VaultChannel = 'stable' | 'beta';

/** URL schemes registered by Cadencea Vault and CadenceaVault Beta. */
export const VAULT_SCHEMES: Record<VaultChannel, string> = {
  stable: 'app.cadencea.vault',
  beta: 'app.cadencea.vault.beta',
};

/** `?channel=beta` (as plugins built for the beta pass it) → beta; anything else → stable. */
export function normalizeChannel(value: unknown): VaultChannel {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' && first.trim().toLowerCase() === 'beta' ? 'beta' : 'stable';
}

/** Opens a product in Vault ▸ Plugins. Null for an invalid product id, so nothing unsafe reaches an href. */
export function vaultDeepLink(productId: string, channel: VaultChannel = 'stable'): string | null {
  if (!isValidProductId(productId)) return null;
  return `${VAULT_SCHEMES[channel === 'beta' ? 'beta' : 'stable']}://plugins/product/${productId}`;
}
