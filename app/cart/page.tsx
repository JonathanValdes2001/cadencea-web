import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CartView from '@/components/plugins/CartView';
import { pluginStoreOpen, siteVaultChannel } from '@/lib/plugins/store-gate.mjs';
import { loadStoreListing } from '@/lib/plugins/store-products';

// The plugin cart (docs/PARKED-FEATURES.md §5: /cart returns with the plugin
// checkout). Preview-only until the store's go-live switch, like the store.
export async function generateMetadata(): Promise<Metadata> {
  if (!pluginStoreOpen()) notFound();
  return { title: 'Cart', robots: { index: false, follow: false } };
}

export default async function CartPage() {
  if (!pluginStoreOpen()) notFound();
  const { products, apiReachable } = await loadStoreListing();
  return <CartView products={products} apiReachable={apiReachable} vaultChannel={siteVaultChannel()} />;
}
