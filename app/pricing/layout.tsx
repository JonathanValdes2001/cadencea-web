import type { Metadata } from 'next';
import { StoreOpenProvider } from '@/components/plugins/StoreOpenContext';
import { pluginStoreOpen } from '@/lib/plugins/store-gate.mjs';

// The pricing page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'The Cadencea Vault app is free. Cloud storage from €4.99 a month for 50 GB. Prices in euros.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  // The All Plugins plan shows only while the plugin store is open (preview until launch).
  return <StoreOpenProvider open={pluginStoreOpen()}>{children}</StoreOpenProvider>;
}
