/**
 * The store list for server components: `GET /v1/access/store/products`
 * (public, no auth) merged over the local fallback prices. Read on the server so
 * the price is in the HTML, the API's CORS list doesn't matter, and Next's Data
 * Cache can keep it for a few minutes (the API itself sends max-age=300).
 *
 * Never throws: when the API is down, not deployed, slow or answers something
 * unexpected, the pages show the local fallback and `apiReachable` is false,
 * which disables free claims and checkout with a note.
 */

import { accessApiOrigin } from './access-origin';
import { mergeStoreProducts, parseStoreProducts, type ListedProduct } from './catalog';
import { FALLBACK_STORE_PRODUCTS } from './products';

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 2500;

export interface StoreListing {
  products: ListedProduct[];
  /** The API answered with a valid store list. */
  apiReachable: boolean;
}

export async function loadStoreListing(fetchImpl: typeof fetch = fetch): Promise<StoreListing> {
  const origin = accessApiOrigin({
    NEXT_PUBLIC_ACCESS_API_URL: process.env.NEXT_PUBLIC_ACCESS_API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });
  let remote = null;
  try {
    const response = await fetchImpl(`${origin}/v1/access/store/products`, {
      headers: { accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) remote = parseStoreProducts(await response.json());
  } catch {
    remote = null;
  }
  return {
    products: mergeStoreProducts(FALLBACK_STORE_PRODUCTS, remote),
    apiReachable: remote !== null,
  };
}
