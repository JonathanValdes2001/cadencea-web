import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import HowItWorks from '@/components/plugins/HowItWorks';
import PluginsComingSoon, { comingSoonMetadata } from '@/components/plugins/PluginsComingSoon';
import StoreGrid from '@/components/plugins/StoreGrid';
import { PLUGIN_PRODUCTS, withListing } from '@/lib/plugins/products';
import { pluginStoreOpen } from '@/lib/plugins/store-gate.mjs';
import { loadStoreListing } from '@/lib/plugins/store-products';

const storeMetadata: Metadata = {
  title: 'Plugins',
  description:
    'Audio plugins by Cadencea. ATHENA EQ Mini is free; ATHENA EQ Complex adds dynamics, sidechain and EQ Match. Licenses belong to your Cadencea account and install with Cadencea Vault.',
};

// Production keeps the "coming" page until the store's go-live switch
// (lib/plugins/store-gate.mjs); previews show the store.
export async function generateMetadata(): Promise<Metadata> {
  return pluginStoreOpen() ? storeMetadata : comingSoonMetadata;
}

export default async function PluginsPage() {
  if (!pluginStoreOpen()) return <PluginsComingSoon />;
  const { products, apiReachable } = await loadStoreListing();
  const cards = PLUGIN_PRODUCTS.flatMap((product) => {
    const listing = withListing(products, product.id);
    return listing ? [{ product, listing }] : [];
  });

  return (
    <div className="bg-canvas text-ink">
      <section className="pb-14 pt-8 sm:pb-20 sm:pt-10 lg:pb-24">
        <Container>
          <h1 className="sr-only">Plugins</h1>
          <StoreGrid cards={cards} />
          {!apiReachable && (
            <p className="mt-6 text-sm text-ink-muted">Prices are list prices. Live prices and the store open at launch.</p>
          )}
        </Container>
      </section>

      <section className="border-t border-line py-14 sm:py-20 lg:py-24">
        <Container>
          <HowItWorks id="how-it-works" />
          <div className="mt-12 flex flex-wrap gap-3">
            <Button href="/cadenceavault#download">Get Cadencea Vault</Button>
            <Button href="/account" variant="secondary">
              My plugins
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
