import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import Faq from '@/components/ui/Faq';
import SectionHeader from '@/components/ui/SectionHeader';
import AthenaEditions, { type EditionEntry } from '@/components/plugins/AthenaEditions';
import HowItWorks from '@/components/plugins/HowItWorks';
import PluginShot from '@/components/plugins/PluginShot';
import { priceLabel } from '@/lib/plugins/catalog';
import {
  ATHENA_ACCENT,
  ATHENA_REQUIREMENTS,
  SEATS_PER_LICENSE,
  pluginBySlugAndTier,
  withListing,
} from '@/lib/plugins/products';
import { pluginStoreOpen, siteVaultChannel } from '@/lib/plugins/store-gate.mjs';
import { loadStoreListing } from '@/lib/plugins/store-products';

const description =
  'ATHENA EQ for VST3, CLAP and Audio Unit. Mini is free: eight switchable bands. Complex adds 24 bands, dynamics, sidechain, mid/side and EQ Match. Installs with Cadencea Vault.';

// The store is preview-only until go-live (lib/plugins/store-gate.mjs), and so
// is this page's metadata.
export async function generateMetadata(): Promise<Metadata> {
  if (!pluginStoreOpen()) notFound();
  return {
    title: 'ATHENA EQ — Mini (free) and Complex',
    description,
    openGraph: {
      title: 'ATHENA EQ by Cadencea',
      description,
      url: '/vst-plugins/athena',
      images: [{ url: '/plugins/athena/athena-complex-dynamic.png', width: 2160, height: 1320, alt: 'ATHENA EQ Complex' }],
    },
  };
}

const faq = [
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
    q: 'Can I try ATHENA EQ Complex first?',
    a: 'ATHENA EQ Mini is the way to try ATHENA: it is free and runs the same filters. ATHENA EQ Complex has no trial; without a license it passes audio through unchanged and asks you to activate it in Cadencea Vault.',
  },
  {
    q: 'Which formats and systems are supported?',
    a: 'VST3 and CLAP on Windows 10 or later (64-bit) and macOS 12 or later (Apple Silicon and Intel), plus Audio Unit on macOS.',
  },
];

export default async function AthenaPage() {
  if (!pluginStoreOpen()) notFound();
  const { products, apiReachable } = await loadStoreListing();
  const vaultChannel = siteVaultChannel();

  const editions: EditionEntry[] = [];
  for (const tier of ['mini', 'complex'] as const) {
    const product = pluginBySlugAndTier('athena', tier);
    const listing = product && withListing(products, product.id);
    if (product && listing) editions.push({ product, listing });
  }
  const complex = editions.find((entry) => entry.product.tier === 'complex');
  const mini = editions.find((entry) => entry.product.tier === 'mini');
  if (!complex || !mini) notFound();

  return (
    <div className="bg-canvas text-ink">
      {/* Hero: the Complex on the showroom surface. */}
      <section className="on-dark relative isolate overflow-hidden bg-showroom py-14 text-dark-text sm:py-20 lg:py-24">
        <ShowroomGlow />
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: ATHENA_ACCENT }} />
              Cadencea plugins · EQ
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">ATHENA EQ</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-dark-muted">
              An EQ for every track, in two editions. <span className="text-dark-text">Mini</span> is free: eight bands,
              each with its own switch. <span className="text-dark-text">Complex</span> adds 24 bands, dynamic bands, a
              sidechain, mid/side placement and EQ Match. Both run the same zero-latency filters.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="#complex" variant="onDark" size="lg" prefetch={false}>
                Complex · {priceLabel(complex.listing)}
              </Button>
              <Button href="#mini" variant="onDarkOutline" size="lg" prefetch={false}>
                Mini · Free
              </Button>
            </div>
            <p className="mt-6 text-sm text-dark-muted">
              VST3 · CLAP · Audio Unit (macOS) · Windows and macOS · Installs with Cadencea Vault
            </p>
          </div>
          <PluginShot shot={complex.product.screenshot} accent={ATHENA_ACCENT} priority sizes="(min-width: 1024px) 55vw, 100vw" />
        </Container>
      </section>

      {/* The two editions */}
      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="Editions"
            title="Start free. Go further with Complex."
            subtitle="Both editions belong to your Cadencea account and install with Cadencea Vault."
          />
          <div className="mt-12">
            <AthenaEditions editions={editions} apiReachable={apiReachable} vaultChannel={vaultChannel} />
          </div>
          {!apiReachable && (
            <p className="mt-6 max-w-3xl text-sm text-ink-muted">
              Prices are list prices. Live prices and the store open at launch.
            </p>
          )}
        </Container>
      </section>

      {/* Screenshots with what each edition does */}
      <section className="border-t border-line bg-elevated py-14 sm:py-20 lg:py-24">
        <Container className="space-y-16 lg:space-y-24">
          <FeatureRow
            eyebrow="ATHENA EQ Complex"
            title="Dynamics, sidechain and placement on every band."
            body="Click in the Aegis display to add a band, drag to move it. Any bell or shelf can turn dynamic, with its own threshold and ratio, and listen to the sidechain so it ducks under a kick or a vocal. Put a band on the whole stereo signal or only on mid, side, left or right. Auto gain keeps the level while you shape the tone, and EQ Match makes your track’s balance meet a reference."
            shot={complex.product.screenshot}
          />
          <FeatureRow
            eyebrow="ATHENA EQ Mini · Free"
            title="Eight bands. Every move at once with the gain scale."
            body="Each band has its own switch and can be a low cut, low shelf, bell, notch, high shelf or high cut. The gain scale turns every boost and cut up or down together, and output sets the level. Zero latency, and the same filters as Complex."
            shot={mini.product.screenshot}
            reverse
          />
        </Container>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <HowItWorks />
        </Container>
      </section>

      {/* System requirements */}
      <section id="requirements" className="scroll-mt-24 border-t border-line py-14 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <SectionHeader eyebrow="System requirements" title="What you need." />
          <dl className="divide-y divide-line border-y border-line">
            {ATHENA_REQUIREMENTS.map((row) => (
              <div key={row.label} className="grid gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-sm font-semibold text-ink">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-ink-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-t border-line py-14 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <SectionHeader eyebrow="FAQ" title="Licenses, computers and Vault." />
          <Faq items={faq} />
        </Container>
      </section>
    </div>
  );
}

function FeatureRow({
  eyebrow,
  title,
  body,
  shot,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  shot: EditionEntry['product']['screenshot'];
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={body} />
      </div>
      <PluginShot shot={shot} accent={ATHENA_ACCENT} className={reverse ? 'lg:order-1' : ''} />
    </div>
  );
}
