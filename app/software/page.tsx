import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import { ArrowRight } from '@/components/ui/Icons';
import {
  availabilityLabel,
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
  /** The subtitle: availability for a shipped app, a "Preview" badge for a v2 concept. */
  status: React.ReactNode;
  media: React.ReactNode;
};

export default async function SoftwarePage() {
  const preview = isPreviewSite();
  const releases: VaultReleases = await withTimeout(
    loadCadenceaVaultReleases(),
    RELEASE_FEED_TIMEOUT_MS,
    {},
  );

  const products: Product[] = [
    {
      name: 'Cadencea Vault',
      description:
        'Organize your DAW projects, see BPM, key and tags, and back up every session bit for bit. Share whole projects with collaborators.',
      href: '/cadenceavault',
      status: availabilityLabel(releases, { preview }),
      media: (
        <Image
          src="/logo/og-social-card.svg"
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      ),
    },
  ];

  if (preview) {
    products.push(
      {
        name: 'Cadencea Market',
        description: 'Sounds, Splits, presets and beats from producers, published from their vault.',
        href: '/market',
        status: <Badge tone="demo">Preview</Badge>,
        media: <ArcsCover seed="software-market" palette="violet" />,
      },
      {
        name: 'Cadencea Stream',
        description: 'A concept for streaming human-made music, where listeners pay the artists they play.',
        href: '/stream',
        status: <Badge tone="demo">Preview</Badge>,
        media: <ArcsCover seed="software-stream" palette="tide" />,
      },
    );
  }

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line py-20 lg:py-28">
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
      <section className="border-b border-line py-16 lg:py-24">
        <Container>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.name}>
                <Link
                  href={p.href}
                  className="hover-lift group flex h-full flex-col overflow-hidden rounded-md border border-line bg-canvas hover:border-line-strong"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-dark">{p.media}</div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{p.status}</div>
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

/** A square generated cover, centred and cropped into the card's 16:9 frame. */
function ArcsCover({ seed, palette }: { seed: string; palette: 'violet' | 'tide' }) {
  return (
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
      <CoverArt seed={seed} kind="theme" motif="arcs" palette={palette} decorative rounded="none" />
    </div>
  );
}
