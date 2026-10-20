import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Container from '@/components/ui/Container';
import Faq from '@/components/ui/Faq';
import SectionHeader from '@/components/ui/SectionHeader';
import EditionCard from '@/components/plugins/EditionCard';
import HowItWorks from '@/components/plugins/HowItWorks';
import PluginShot from '@/components/plugins/PluginShot';
import { PLUGIN_REQUIREMENTS, SEATS_PER_LICENSE, pluginBySlug, withListing, type PluginProduct } from '@/lib/plugins/products';
import { pluginStoreOpen, siteVaultChannel } from '@/lib/plugins/store-gate.mjs';
import { loadStoreListing } from '@/lib/plugins/store-products';

type Props = { params: Promise<{ slug: string }> };

// The old combined ATHENA page; each edition has its own page now.
const MOVED = new Set(['athena']);

// The store is preview-only until go-live (lib/plugins/store-gate.mjs), and so
// is this page's metadata.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!pluginStoreOpen()) notFound();
  const { slug } = await params;
  const product = pluginBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.tagline,
    openGraph: {
      title: `${product.name} by Cadencea`,
      description: product.tagline,
      url: `/vst-plugins/${product.slug}`,
      images: [{ url: product.screenshot.src, width: product.screenshot.width, height: product.screenshot.height, alt: product.name }],
    },
  };
}

const faqFor = (product: PluginProduct) => [
  {
    q: 'Who owns the license?',
    a: 'Your Cadencea account. The license follows the account, not a computer: sign in to Cadencea Vault with the same account on any of your computers and your plugins are there.',
  },
  {
    q: 'How many computers can I use it on?',
    a: `Up to ${SEATS_PER_LICENSE} at the same time. Each computer you activate in Cadencea Vault uses one of them.`,
  },
  {
    q: 'I got a new computer. How do I move my license?',
    a: 'Deactivate the old computer any time, in Cadencea Vault ▸ Plugins on that computer or on your account page on this website, then activate the new one in Cadencea Vault.',
  },
  {
    q: 'Do I need Cadencea Vault?',
    a: 'Yes, to install and activate. Cadencea Vault is free for Windows and macOS.',
  },
  {
    q: 'Can I try it first?',
    a: `${product.family} Mini is the way to try it: it is free. ${product.name} has no trial; without a license it passes audio through unchanged and asks you to activate it in Cadencea Vault.`,
    paidOnly: true,
  },
  {
    q: 'Which formats and systems are supported?',
    a: 'VST3 and CLAP on Windows 10 or later (64-bit) and macOS 12 or later (Apple Silicon and Intel), plus Audio Unit on macOS.',
  },
];

export default async function PluginPage({ params }: Props) {
  if (!pluginStoreOpen()) notFound();
  const { slug } = await params;
  if (MOVED.has(slug)) permanentRedirect('/vst-plugins');
  const product = pluginBySlug(slug);
  if (!product) notFound();

  const { products, apiReachable } = await loadStoreListing();
  const listing = withListing(products, product.id);
  if (!listing) notFound();
  const free = listing.isFree || listing.priceMinor === 0;

  return (
    <div className="bg-canvas text-ink">
      <section className="py-14 sm:py-20 lg:py-24">
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <EditionCard product={product} listing={listing} apiReachable={apiReachable} vaultChannel={siteVaultChannel()} />
            {!free && (
              <p className="mt-4 text-sm text-ink-muted">
                Or get every plugin with{' '}
                <Link href="/pricing#all-plugins" className="font-medium text-accent-ink hover:text-accent-hover">
                  All Plugins: €4.99 a month
                </Link>
                .
              </p>
            )}
            {!apiReachable && (
              <p className="mt-4 text-sm text-ink-muted">Prices are list prices. Live prices and the store open at launch.</p>
            )}
          </div>
          <PluginShot shot={product.screenshot} accent={product.accent} priority sizes="(min-width: 1024px) 60vw, 100vw" />
        </Container>
      </section>

      <section className="border-t border-line py-14 sm:py-20 lg:py-24">
        <Container>
          <HowItWorks />
        </Container>
      </section>

      <section id="requirements" className="scroll-mt-24 border-t border-line py-14 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <SectionHeader eyebrow="System requirements" title="What you need." />
          <dl className="divide-y divide-line border-y border-line">
            {PLUGIN_REQUIREMENTS.map((row) => (
              <div key={row.label} className="grid gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-sm font-semibold text-ink">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-ink-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-t border-line py-14 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <SectionHeader eyebrow="FAQ" title="Licenses, computers and Vault." />
          <Faq items={faqFor(product).filter((item) => !item.paidOnly || !free).map(({ q, a }) => ({ q, a }))} />
        </Container>
      </section>
    </div>
  );
}
