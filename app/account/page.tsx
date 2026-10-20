import type { Metadata } from 'next';
import AccountOverview from '@/components/plugins/AccountOverview';
import { pluginStoreOpen, siteVaultChannel } from '@/lib/plugins/store-gate.mjs';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

// The account overview Cadencea Vault links to. Live on every deployment (the
// middleware sends signed-out visitors to /login first); store links appear
// only while the plugin store is open.
export default function AccountPage() {
  return <AccountOverview vaultChannel={siteVaultChannel()} storeOpen={pluginStoreOpen()} />;
}
