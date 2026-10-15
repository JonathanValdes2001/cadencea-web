import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import { ArrowRight } from '@/components/ui/Icons';
import VaultMock from '@/components/v2/home/VaultMock';
import PluginWindow from '@/components/v2/plugins/PluginWindow';
import {
  availabilityLabel,
  RELEASE_FEED_REVALIDATE_S,
  RELEASE_FEED_TIMEOUT_MS,
  withTimeout,
  type VaultReleases,
} from '@/components/v2/home/availability';
import { loadCadenceaVaultReleases } from '@/lib/cadencea-vault-releases.mjs';
import { isPreviewSite } from '@/lib/site-channel.mjs';

export const metadata: Metadata = {
  title: 'Software',
  description: 'Software from Cadencea for music producers, starting with Cadencea Vault.',
};

type Product = {
  name: string;
  description: string;
  href: string;
  /** The subtitle: availability for a shipped app, a "Coming soon" badge for what isn't out yet. */
  status: React.ReactNode;
  media: React.ReactNode;
};

export default async function SoftwarePage() {
  const preview = isPreviewSite();
  // Three B2 manifests, cached for a few minutes and each given up on after
  // the timeout, so a slow platform drops out alone; the outer timeout is a
  // last safety net so B2 can never stall the page.
  const releases: VaultReleases = await withTimeout(
    loadCadenceaVaultReleases(fetch, { revalidate: RELEASE_FEED_REVALIDATE_S, timeoutMs: RELEASE_FEED_TIMEOUT_MS }),
    RELEASE_FEED_TIMEOUT_MS + 500,
    {},
  );

  const products: Product[] = [
    {
      name: 'Cadencea Vault',
      description:
        'Organize your DAW projects, see BPM, key and tags, and back up every session bit for bit. Share whole projects with collaborators.',
      href: '/cadenceavault',
      status: <Badge tone="neutral">{availabilityLabel(releases, { preview })}</Badge>,
      // The library, cropped into the card: a picture of the app, not a logo.
      media: (
        <div className="absolute inset-x-6 top-6">
          <VaultMock />
        </div>
      ),
    },
  ];

  if (preview) {
    products.push({
      name: 'Cadencea plugins',
      description: 'Audio plugins from the team behind Vault. They are not available yet.',
      href: '/vst-plugins',
      status: <Badge tone="neutral">Coming soon</Badge>,
      media: (
        <div className="absolute inset-x-10 top-6">
          <PluginWindow />
        </div>
      ),
    });
  }

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line py-14 sm:py-20 lg:py-24">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Software</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Software for producers.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            One app today, built carefully: Cadencea Vault, the lossless project vault for Windows and macOS.
          </p>
        </Container>
      </section>

      {/* Product grid */}
      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.name}>
                <Link
                  href={p.href}
                  className="hover-lift group flex h-full flex-col overflow-hidden rounded-md border border-line bg-canvas hover:border-line-strong"
                >
                  {/* One media treatment for every product: its own picture on the showroom surface. Decorative:
                      the card's title and text already name it. */}
                  <div aria-hidden="true" className="relative aspect-[16/9] w-full overflow-hidden bg-showroom">
                    {p.media}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex h-6 items-center">{p.status}</div>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">{p.name}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{p.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-accent-ink">
                      Learn more
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
