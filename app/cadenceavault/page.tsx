import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { Check } from '@/components/ui/Icons';
import VaultMock from '@/components/v2/home/VaultMock';
import DetectCard from '@/components/v2/vault/DetectCard';
import { loadCadenceaVaultReleases } from '@/lib/cadencea-vault-releases.mjs';
import { isPreviewSite } from '@/lib/site-channel.mjs';

export const metadata: Metadata = {
  title: 'Cadencea Vault — DAW project library with lossless cloud sync',
  description:
    'Organize every DAW project, see BPM, key and tags at a glance, and push bit-for-bit copies to the cloud. Free for Windows and macOS.',
};

const heroChips = ['Lossless, bit for bit', 'Works with any DAW', 'Works offline'];

const showcases = [
  {
    eyebrow: 'Key wheel',
    title: 'Find every project in the right key.',
    desc: 'Browse your catalog on an interactive circle of fifths. Pick a major or minor key and the library filters instantly, which is ideal for building sets or finding the idea that fits a topline.',
    points: ['Major and minor keys', 'Camelot-style wheel', 'One-click filtering'],
    src: '/vault/key-wheel.png',
    alt: 'Cadencea Vault circle-of-fifths key wheel filtering projects by musical key',
    width: 1715,
    height: 1137,
  },
  {
    eyebrow: 'Table view',
    title: 'Every detail, sortable.',
    desc: 'See artist, BPM, key, date, DAW, tags and sync status for every project, and sort by any column to surface exactly what you need.',
    points: ['BPM, key and metadata', 'Sync status per project', 'Filter by tag'],
    src: '/vault/table.png',
    alt: 'Cadencea Vault table view showing artist, BPM, key, tags and sync status',
    width: 1713,
    height: 957,
  },
  {
    eyebrow: 'List view',
    title: 'Hundreds of projects, no clutter.',
    desc: 'A compact list fits more of your catalog on screen, with tags, sync status and playback one click away.',
    points: ['Dense layout', 'Instant playback', 'Color-coded tags'],
    src: '/vault/list.png',
    alt: 'Cadencea Vault compact list view of a large project library',
    width: 1702,
    height: 1002,
  },
];

const features = [
  {
    title: 'Organize',
    desc: 'Projects stay as normal folders on your drive. Cadencea Vault adds BPM, key, tags, artwork and notes without moving or renaming anything.',
  },
  {
    title: 'Back up',
    desc: "Push a lossless copy when you're ready and see which projects have changes that aren't backed up yet. Sync status comes from content hashes, so you know exactly which files changed.",
  },
  {
    title: 'Share',
    desc: 'Invite collaborators to a project with roles. They open the full session (project file, stems and artwork) with a free account.',
  },
];

const promises: { label: string; href?: string }[] = [
  { label: 'Normal folders on your drive' },
  { label: 'Works offline' },
  { label: 'Never transcoded or normalized' },
  { label: 'Encrypted in transit (TLS)' },
  { label: 'Downgrading never deletes files' },
  { label: 'Export your account data anytime', href: '/account/settings' },
];

/** How long this page waits for each platform's updater manifest (fetched fresh, never cached). */
const FEED_TIMEOUT_MS = 3000;

const systemRequirements = [
  {
    name: 'Windows',
    available: false,
    items: [
      'Windows 10 or later',
      '64-bit processor',
      '4 GB RAM minimum',
      '2 GB free disk space, plus room for your projects',
    ],
  },
  {
    name: 'macOS',
    available: false,
    items: [
      'macOS 12 Monterey or later',
      'Apple Silicon or Intel',
      '4 GB RAM minimum',
      '2 GB free disk space, plus room for your projects',
    ],
  },
  {
    name: 'Linux',
    available: false,
    items: [],
  },
];

export default async function CadenceaVault() {
  const preview = isPreviewSite();
  const releases = await loadCadenceaVaultReleases(fetch, { timeoutMs: FEED_TIMEOUT_MS });
  const windowsDownloadUrl = releases.windows?.downloadUrl;
  const macArm64DownloadUrl = releases.macArm64?.downloadUrl;
  const macX64DownloadUrl = releases.macX64?.downloadUrl;
  const macAvailable = Boolean(macArm64DownloadUrl || macX64DownloadUrl);
  const noneAvailable = !windowsDownloadUrl && !macAvailable;
  const someMissing = !noneAvailable && (!windowsDownloadUrl || !macArm64DownloadUrl || !macX64DownloadUrl);
  // Windows and macOS have both shipped, so a missing build is an outage (or,
  // on the preview, a beta that isn't published yet), never a planned platform.
  const unavailableLabel = preview && noneAvailable ? 'Not published yet' : 'Temporarily unavailable';
  const systems = systemRequirements.map((system) => {
    if (system.name === 'Windows') return { ...system, available: Boolean(windowsDownloadUrl) };
    if (system.name === 'macOS') return { ...system, available: macAvailable };
    return system;
  });

  // With nothing to download, the status card under the lead says so instead.
  let availability = '';
  if (windowsDownloadUrl && macAvailable) {
    availability = 'For Windows 10+ and macOS 12+ on Apple Silicon and Intel.';
  } else if (windowsDownloadUrl) {
    availability = 'For Windows 10+. The macOS download is temporarily unavailable.';
  } else if (macAvailable) {
    availability = 'For macOS 12+ on Apple Silicon and Intel. The Windows download is temporarily unavailable.';
  }

  const betaNote = (
    <>
      These are CadenceaVault Beta builds. The beta installs next to Cadencea Vault, keeps its own local settings and
      signs in with your normal Cadencea account. It uses the same cloud, so pushes, shares and deletes are real. Use a
      separate test vault folder; the beta won&rsquo;t open the folder your main app uses.
    </>
  );

  return (
    <div className="bg-canvas text-ink">
      {/* ============================================================
          DARK IMMERSIVE SHOWROOM — hero + product showcase.
          One continuous violet-lit dark region, the way a product
          gets its own color world on Native Instruments.
          ============================================================ */}
      <div className="on-dark relative isolate overflow-hidden bg-showroom text-dark-text">
        <ShowroomGlow />

        {/* Hero */}
        <section className="relative">
          <Container className="pt-20 lg:pt-28">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
                {preview ? 'CadenceaVault Beta · Desktop app' : 'Cadencea Vault · Desktop app'}
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Every session, organized and backed up bit for bit.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dark-muted md:text-xl">
                Cadencea Vault reads the project folders you already have, shows each one with its BPM, key, tags and
                artwork, and pushes a lossless copy to the cloud when you&rsquo;re ready.
                {availability && ` ${availability}`}
              </p>

              <ul className="mt-8 flex flex-wrap items-center gap-2.5">
                {heroChips.map((chip) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-brand-400/30 bg-brand-400/10 px-2.5 py-1 text-xs font-medium text-brand-300"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    {chip}
                  </li>
                ))}
              </ul>

              <div id="download" className="scroll-mt-24">
                {noneAvailable ? (
                  <>
                    <div className="mt-10 max-w-xl rounded-md border border-white/10 bg-white/5 p-5">
                      <p className="text-base font-semibold text-dark-text">
                        {preview ? 'Beta builds are coming' : 'Downloads are temporarily unavailable'}
                      </p>
                      <p className="mt-1 text-sm text-dark-muted">
                        Windows · macOS (Apple Silicon and Intel) · Linux planned
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-dark-muted">
                        {preview ? 'The beta builds aren’t published yet. Check back soon.' : 'Please check back soon.'}{' '}
                        Questions? Contact{' '}
                        <a href="mailto:support@cadencea.app" className="font-medium text-brand-300 hover:text-brand-200">
                          support@cadencea.app
                        </a>
                        .
                      </p>
                      {preview && (
                        <Button href="#detect" variant="onDark" size="md" className="mt-5" prefetch={false}>
                          See what&rsquo;s in 2.0
                        </Button>
                      )}
                    </div>
                    {preview && <p className="mt-4 max-w-xl text-xs leading-relaxed text-dark-muted">{betaNote}</p>}
                  </>
                ) : (
                  <>
                    {preview && (
                      <p className="mt-10 max-w-2xl rounded-md border border-brand-400/30 bg-brand-950 px-4 py-3 text-sm leading-relaxed text-brand-100">
                        {betaNote}
                      </p>
                    )}
                    <div className="mt-10 flex flex-wrap gap-3">
                      <DownloadButton platform="Windows" variant="primary" href={windowsDownloadUrl} />
                      <DownloadButton platform="Mac (Apple Silicon)" variant="onDark" href={macArm64DownloadUrl} />
                      <DownloadButton platform="Mac (Intel)" variant="onDark" href={macX64DownloadUrl} />
                      <Button variant="onDarkOutline" size="lg" disabled>
                        Linux · planned
                      </Button>
                    </div>
                    {someMissing && (
                      <p className="mt-4 text-sm text-dark-muted">
                        Some downloads are temporarily unavailable. Try again later or contact{' '}
                        <a href="mailto:support@cadencea.app" className="font-medium text-brand-300 hover:text-brand-200">
                          support@cadencea.app
                        </a>
                        .
                      </p>
                    )}
                    {macAvailable && (
                      <p className="mt-4 text-sm text-dark-muted">
                        Not sure which Mac you have? Apple menu → About This Mac. &ldquo;Chip: Apple M…&rdquo; means
                        Apple Silicon; &ldquo;Processor: Intel&rdquo; means Intel.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Flagship visual: a code-built library of fictional projects (the old screenshot showed a real
                account's name, email and third-party artwork; WEB-V2-SPEC §9.1 tracks clean reshoots). */}
            <div className="relative isolate mx-auto mt-16 max-w-4xl lg:mt-20">
              <FrameGlow />
              <VaultMock />
            </div>
          </Container>
        </section>

        {/* Product showcase — alternating rows */}
        <section className="relative">
          <Container className="pb-24 pt-24 lg:pb-32 lg:pt-32">
            <SectionHeader
              onDark
              eyebrow="A closer look"
              title="Built around the way you work."
              subtitle="Every view is designed to keep your catalog organized and your next idea close at hand."
              className="mb-16 lg:mb-20"
            />

            <div className="space-y-24 lg:space-y-32">
              {showcases.map((s, i) => (
                <ShowcaseRow
                  key={s.title}
                  eyebrow={s.eyebrow}
                  title={s.title}
                  desc={s.desc}
                  points={s.points}
                  reverse={i % 2 === 1}
                >
                  <ScreenshotFrame
                    src={s.src}
                    alt={s.alt}
                    width={s.width}
                    height={s.height}
                    sizes="(min-width: 1024px) 600px, 100vw"
                  />
                </ShowcaseRow>
              ))}
              {preview && (
                <ShowcaseRow
                  id="detect"
                  eyebrow="New in 2.0 · Detect"
                  title="Key, BPM and tag suggestions, on your computer."
                  desc="Detect listens to a project's audio on your computer and suggests a key and BPM, each marked High, Medium or Low confidence, with alternates. It also suggests tags from your own library and file names. Nothing changes until you accept it, field by field, and it's free on every plan."
                  points={['Free · runs on your computer', 'Confidence and alternates', 'You approve every change']}
                  reverse
                >
                  <div className="mx-auto max-w-md">
                    <DetectCard />
                  </div>
                </ShowcaseRow>
              )}
            </div>
          </Container>
        </section>
      </div>

      {/* Features */}
      <section className="border-b border-line py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow="What it does"
            title="Three jobs, done carefully."
            subtitle="Organize, back up and share, without moving or converting anything."
          />
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="border-t border-line pt-6">
                <h3 className="text-base font-semibold text-ink md:text-lg">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Promises you can check */}
      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader title="Promises you can check" />
          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {promises.map((p) => (
              <li key={p.label} className="flex items-start gap-3 text-base text-ink">
                <Check size={20} className="mt-0.5 shrink-0 text-accent" />
                {p.href ? (
                  <Link href={p.href} className="font-medium text-accent-ink underline-offset-2 hover:underline">
                    {p.label}
                  </Link>
                ) : (
                  p.label
                )}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Pricing CTA */}
      <section className="bg-elevated py-14 sm:py-20 lg:py-24">
        <Container className="text-center">
          <SectionHeader
            align="center"
            eyebrow="Pricing"
            title="Free app. Pay only for cloud space."
            subtitle="Start with 5 GB free. Paid plans go up to 500 GB."
          />
          <Button href="/pricing" size="lg" className="mt-8">
            Compare plans
          </Button>
        </Container>
      </section>

      {/* System requirements */}
      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader eyebrow="Specs" title="System requirements." />
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
            {systems.map((sys) => (
              <div key={sys.name} className="border-t border-line pt-6">
                <h3 className="text-lg font-semibold text-ink">
                  {sys.name}
                  {!sys.available && sys.items.length > 0 && (
                    <span className="ml-2 text-xs font-normal uppercase tracking-wide text-ink-subtle">
                      {unavailableLabel}
                    </span>
                  )}
                </h3>
                {sys.items.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                    {sys.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">Planned. No date yet.</p>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

function ShowcaseRow({
  id,
  eyebrow,
  title,
  desc,
  points,
  reverse,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  reverse: boolean;
  /** The visual: a screenshot or an HTML mock. */
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-24 grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-dark-muted">{desc}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm text-dark-text">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-brand-400/40 bg-brand-400/10">
                <Check size={16} className="h-3 w-3 text-brand-300" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>{children}</div>
    </div>
  );
}

/** The violet bloom behind a framed product visual. */
function FrameGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(55%_55%_at_50%_45%,color-mix(in_srgb,var(--color-brand-500)_40%,transparent),color-mix(in_srgb,var(--color-brand-700)_12%,transparent)_55%,transparent_78%)] blur-2xl"
    />
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
      <FrameGlow />
      <div className="overflow-hidden rounded-lg border border-white/10 bg-showroom-to shadow-brand-glow ring-1 ring-white/5">
        <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes={sizes} className="h-auto w-full" />
      </div>
    </div>
  );
}

function DownloadButton({
  platform,
  variant,
  href,
}: {
  platform: 'Windows' | 'Mac (Apple Silicon)' | 'Mac (Intel)';
  variant: 'primary' | 'onDark';
  href?: string;
}) {
  if (!href) {
    // The longest label is wider than a phone; it wraps inside the button instead of overflowing.
    return (
      <Button variant="onDarkOutline" size="lg" disabled className="max-w-full">
        <span className="whitespace-normal text-center leading-tight">{platform} download unavailable</span>
      </Button>
    );
  }
  return (
    <Button href={href} variant={variant} size="lg" rel="noopener noreferrer" prefetch={false}>
      Download for {platform}
    </Button>
  );
}
