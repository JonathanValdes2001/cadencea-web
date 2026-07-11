import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadCadenceaVaultReleases } from '@/lib/cadencea-vault-releases.mjs';

const heroChips = ['Lossless backups', 'Works with any DAW', 'Offline-first'];

const showcases = [
  {
    eyebrow: 'Harmonic filtering',
    title: 'Find every track in the right key.',
    desc: 'Browse your catalog through an interactive circle of fifths. Click any major or minor key and your projects filter instantly — ideal for building harmonically compatible sets and finding the track that fits next.',
    points: ['Major and minor selection', 'Camelot-style key wheel', 'One-click filtering'],
    src: '/vault/key-wheel.png',
    alt: 'Cadencea Vault circle-of-fifths key wheel filtering projects by musical key',
    width: 1715,
    height: 1137,
    reverse: false,
  },
  {
    eyebrow: 'Detail view',
    title: 'Every detail, at a glance.',
    desc: 'Switch to a sortable table to see artist, BPM, key, date, DAW, tags, and cloud-sync status across your whole library — then sort by any column to surface exactly what you need.',
    points: ['BPM, key & metadata', 'Per-project sync status', 'Sort and filter by tag'],
    src: '/vault/table.png',
    alt: 'Cadencea Vault detailed table view showing artist, BPM, key, tags and sync status',
    width: 1713,
    height: 957,
    reverse: true,
  },
  {
    eyebrow: 'Built for big libraries',
    title: 'Hundreds of projects, zero clutter.',
    desc: 'A compact list packs more of your catalog onto the screen while keeping tags, sync indicators, and instant playback one click away — so moving through a deep library stays fast.',
    points: ['High-density layout', 'Instant in-app playback', 'Color-coded tags'],
    src: '/vault/list.png',
    alt: 'Cadencea Vault compact list view of a large project library',
    width: 1702,
    height: 1002,
    reverse: false,
  },
];

const features = [
  {
    title: 'Project management',
    desc: 'Organize your music projects with intuitive file management, version control, and collaborative workflows.',
  },
  {
    title: 'Secure cloud backup',
    desc: 'Automatic, encrypted backups keep your creative work safe and accessible from anywhere.',
  },
  {
    title: 'File sharing',
    desc: 'Share projects and collaborate with other artists seamlessly. Control access and permissions per project.',
  },
];

const systemRequirements = [
  {
    name: 'Windows',
    available: true,
    items: [
      'Windows 10 or later',
      '64-bit processor',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
  {
    name: 'macOS',
    available: false,
    items: [
      'macOS 10.15 or later',
      'Apple Silicon (M1 or later) or 64-bit Intel',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
  {
    name: 'Linux',
    available: false,
    items: [
      'Ubuntu 18.04 or later',
      '64-bit processor',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
];

export default async function CadenceaVault() {
  const releases = await loadCadenceaVaultReleases();
  const windowsDownloadUrl = releases.windows?.downloadUrl;
  const macArm64DownloadUrl = releases.macArm64?.downloadUrl;
  const macX64DownloadUrl = releases.macX64?.downloadUrl;
  const macAvailable = Boolean(macArm64DownloadUrl || macX64DownloadUrl);
  const systems = systemRequirements.map((system) =>
    system.name === 'macOS' ? { ...system, available: macAvailable } : system,
  );

  return (
    <div className="bg-canvas text-ink">
      {/* ============================================================
          DARK IMMERSIVE SHOWROOM — hero + product showcase.
          One continuous violet-lit dark region, the way a product
          gets its own color world on Native Instruments.
          ============================================================ */}
      <div className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#1A1A1A_0%,#15121c_42%,#100d18_100%)] text-dark-text">
        {/* Ambient purple glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[460px] w-[940px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),transparent)] blur-3xl" />
          <div className="absolute left-[-10%] top-[38%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)] blur-3xl" />
          <div className="absolute right-[-8%] top-[64%] h-[460px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.16),transparent)] blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative">
          <div className="mx-auto max-w-7xl px-6 pt-20 lg:px-8 lg:pt-28">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c4b5fd]">
                Cadencea Vault · Desktop app
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Music project management.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dark-muted md:text-xl">
                Organize your samples, projects, and stems. Back them up
                securely to the cloud.{' '}
                {macAvailable
                  ? 'Available for Windows and macOS desktop workflows, with Linux planned for a later release.'
                  : 'Currently available for Windows, with macOS build support being prepared next.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                {heroChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1 text-xs font-medium text-[#c4b5fd]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <DownloadButton
                  platform="Windows"
                  available
                  primary
                  href={windowsDownloadUrl}
                />
                <DownloadButton
                  platform="Mac (Apple Silicon)"
                  available={Boolean(macArm64DownloadUrl)}
                  href={macArm64DownloadUrl}
                />
                <DownloadButton
                  platform="Mac (Intel)"
                  available={Boolean(macX64DownloadUrl)}
                  href={macX64DownloadUrl}
                />
                <DownloadButton platform="Linux" available={false} />
              </div>
              {macAvailable && (
                <p className="mt-4 text-sm text-dark-muted">
                  Choose Apple Silicon for M1, M2, M3, M4, and newer chips.
                  Choose Intel for older Intel-based Macs.
                </p>
              )}
            </div>

            {/* Flagship screenshot */}
            <div className="relative mx-auto mt-16 max-w-6xl lg:mt-20">
              <ScreenshotFrame
                src="/vault/library.png"
                alt="Cadencea Vault project library with album art, tags and a playback bar"
                width={2005}
                height={1357}
                priority
                sizes="(min-width: 1024px) 1152px, 100vw"
              />
            </div>
          </div>
        </section>

        {/* Product showcase — alternating screenshot rows */}
        <section className="relative">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
            <div className="mb-16 max-w-2xl lg:mb-20">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c4b5fd]">
                A closer look
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Built around the way you work.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-dark-muted">
                Every view in Cadencea Vault is designed to keep your catalog
                organized and your next idea close at hand.
              </p>
            </div>

            <div className="space-y-24 lg:space-y-32">
              {showcases.map((s) => (
                <ShowcaseRow key={s.title} {...s} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              What it does
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Everything you need to create.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Streamline your creative workflow with professional-grade tools
              designed for modern music production.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="border-t border-line pt-6">
                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="border-b border-line bg-elevated">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted">
            Choose the plan that fits your workflow, from a free tier to get
            you going, up to 500 GB for serious creators.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-flex h-12 items-center rounded-sm bg-accent px-8 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
          >
            View plans &amp; pricing
          </Link>
        </div>
      </section>

      {/* System requirements */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Specs
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              System requirements.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {systems.map((sys) => (
              <div
                key={sys.name}
                className={`border-t border-line pt-6${!sys.available ? ' opacity-50' : ''}`}
              >
                <h3 className="text-lg font-semibold text-ink">
                  {sys.name}
                  {!sys.available && (
                    <span className="ml-2 text-xs font-normal uppercase tracking-wide text-ink-muted">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                  {sys.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ShowcaseRow({
  eyebrow,
  title,
  desc,
  points,
  src,
  alt,
  width,
  height,
  reverse,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  src: string;
  alt: string;
  width: number;
  height: number;
  reverse: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c4b5fd]">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h3>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-dark-muted">
          {desc}
        </p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm text-dark-text">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#a78bfa]/40 bg-[#a78bfa]/10">
                <svg
                  className="h-3 w-3 text-[#c4b5fd]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>
        <ScreenshotFrame
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 1024px) 600px, 100vw"
        />
      </div>
    </div>
  );
}

function ScreenshotFrame({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(139,92,246,0.40),rgba(109,40,217,0.12)_55%,transparent_78%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0c11] shadow-[0_24px_70px_-24px_rgba(124,58,237,0.55)] ring-1 ring-white/[0.06]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

function DownloadButton({
  platform,
  primary,
  available = true,
  href,
}: {
  platform: 'Mac (Apple Silicon)' | 'Mac (Intel)' | 'Windows' | 'Linux';
  primary?: boolean;
  available?: boolean;
  href?: string;
}) {
  const isMac = platform === 'Mac (Apple Silicon)' || platform === 'Mac (Intel)';
  const classes = `inline-flex h-12 items-center justify-center rounded-sm border px-8 text-sm font-semibold tracking-wide shadow-sm ${
    !available || !href
      ? 'cursor-not-allowed border-dark-text/30 text-dark-text/40 shadow-none'
      : primary
        ? 'border-accent bg-accent text-white shadow-[0_4px_14px_rgba(0,102,255,0.25)] hover:-translate-y-0.5 hover:bg-accent-hover'
        : isMac
          ? 'border-white bg-white text-[#111111] shadow-[0_4px_14px_rgba(255,255,255,0.14)] hover:-translate-y-0.5 hover:border-[#e5e5e5] hover:bg-[#e5e5e5]'
          : 'border-dark-text text-dark-text hover:bg-white/10'
  }`;

  if (!available) {
    return (
      <button type="button" disabled className={classes}>
        {platform} — Coming Soon
      </button>
    );
  }

  if (!href) {
    return (
      <button type="button" disabled className={classes}>
        Download for {platform}
      </button>
    );
  }

  return (
    <a href={href} rel="noopener noreferrer" className={classes}>
      Download for {platform}
    </a>
  );
}
