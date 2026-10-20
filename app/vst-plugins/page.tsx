import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import HowItWorks from '@/components/plugins/HowItWorks';
import PluginsComingSoon, { comingSoonMetadata } from '@/components/plugins/PluginsComingSoon';
import ProductCard from '@/components/plugins/ProductCard';
import { PLUGIN_PRODUCTS, SEATS_PER_LICENSE, withListing } from '@/lib/plugins/products';
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
      <section className="on-dark relative isolate overflow-hidden bg-showroom py-14 text-dark-text sm:py-20 lg:py-24">
        <ShowroomGlow />
        <Container>
          <SectionHeader
            as="h1"
            onDark
            eyebrow="Plugins"
            title="Cadencea plugins."
            subtitle={`Mixing tools from the team behind Cadencea Vault. Your licenses belong to your Cadencea account, work on up to ${SEATS_PER_LICENSE} computers, and install with Cadencea Vault.`}
          />
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/vst-plugins/athena" variant="onDark" size="lg">
              See ATHENA EQ
            </Button>
            <Button href="#how-it-works" variant="onDarkOutline" size="lg" prefetch={false}>
              How it works
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="ATHENA EQ"
            title="The EQ, in two editions."
            subtitle="Start with Mini for free. Complex adds dynamics, sidechain, mid/side and EQ Match."
          />
          <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {cards.map(({ product, listing }) => (
              <ProductCard key={product.id} product={product} listing={listing} />
            ))}
          </ul>
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
