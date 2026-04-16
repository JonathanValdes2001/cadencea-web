import React from 'react';
import Link from 'next/link';

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

const systems = [
  {
    name: 'macOS',
    items: [
      'macOS 10.15 or later',
      'Intel or Apple Silicon',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
  {
    name: 'Windows',
    items: [
      'Windows 10 or later',
      '64-bit processor',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
  {
    name: 'Linux',
    items: [
      'Ubuntu 18.04 or later',
      '64-bit processor',
      '4 GB RAM minimum',
      '2 GB free disk space',
    ],
  },
];

export default function CadenceaVault() {
  return (
    <div className="bg-canvas text-ink">
      {/* Hero — dark immersive */}
      <section className="bg-dark text-dark-text">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
          <p className="text-xs font-semibold uppercase tracking-widest text-dark-muted">
            Cadencea Vault · Desktop app
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Professional music project management.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dark-muted md:text-xl">
            Organize your samples, projects, and stems. Back them up securely
            to the cloud. Access them from any device.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <DownloadButton platform="Mac" primary />
            <DownloadButton platform="Windows" />
            <DownloadButton platform="Linux" />
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
            Choose the plan that fits your workflow — from a free tier to get
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
              <div key={sys.name} className="border-t border-line pt-6">
                <h3 className="text-lg font-semibold text-ink">{sys.name}</h3>
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
}: {
  platform: 'Mac' | 'Windows' | 'Linux';
  primary?: boolean;
}) {
  const cls = primary
    ? 'bg-accent text-white hover:bg-accent-hover'
    : 'border border-dark-text text-dark-text hover:bg-white/10';
  return (
    <button
      type="button"
      className={`inline-flex h-12 items-center rounded-sm px-8 text-sm font-semibold tracking-wide ${cls}`}
    >
      Download for {platform}
    </button>
  );
}
