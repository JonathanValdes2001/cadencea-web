import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

const macArm64FallbackUrl =
  'https://f003.backblazeb2.com/file/cadencea-products/updates/cadencea-vault/mac/arm64/CadenceaVault-1.0.6-arm64.dmg';
const macX64FallbackUrl =
  'https://f003.backblazeb2.com/file/cadencea-products/updates/cadencea-vault/mac/x64/CadenceaVault-1.0.6-x64.dmg';

export default function CadenceaVault() {
  const windowsDownloadUrl = process.env.NEXT_PUBLIC_WIN_DOWNLOAD_URL;
  const macArm64DownloadUrl =
    process.env.NEXT_PUBLIC_MAC_ARM64_DOWNLOAD_URL || macArm64FallbackUrl;
  const macX64DownloadUrl =
    process.env.NEXT_PUBLIC_MAC_X64_DOWNLOAD_URL || macX64FallbackUrl;
  const macAvailable = Boolean(macArm64DownloadUrl || macX64DownloadUrl);
  const systems = systemRequirements.map((system) =>
    system.name === 'macOS' ? { ...system, available: macAvailable } : system,
  );

  return (
    <div className="bg-canvas text-ink">
      {/* Hero — dark immersive */}
      <section className="bg-dark text-dark-text">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c4b5fd]">
                Cadencea Vault · Desktop app
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Music project management.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dark-muted md:text-xl">
                Organize your samples, projects, and stems. Back them up
                securely to the cloud. {macAvailable
                  ? 'Available for Windows and macOS desktop workflows, with Linux planned for a later release.'
                  : 'Currently available for Windows, with macOS build support being prepared next.'}
              </p>

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

            <div className="lg:col-span-5">
              <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-md border border-white/10 shadow-2xl">
                <Image
                  src="/logo/og-social-card.svg"
                  alt="Cadencea Vault"
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
    <a
      href={href}
      rel="noopener noreferrer"
      className={classes}
    >
      Download for {platform}
    </a>
  );
}
