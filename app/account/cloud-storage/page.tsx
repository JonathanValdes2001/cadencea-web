import React from 'react';
import Link from 'next/link';

const devices = [
  {
    name: 'MacBook Pro (Main Studio)',
    type: 'macOS',
    lastSync: '2 hours ago',
    status: 'online' as const,
  },
  {
    name: 'Windows Desktop (Home)',
    type: 'Windows',
    lastSync: '1 day ago',
    status: 'offline' as const,
  },
];

/**
 * Cloud Storage Overview — ACCOUNT page, not a vault/project manager.
 * Project management lives in the Cadencea Vault desktop app.
 */
export default function CloudStorageOverview() {
  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Cloud storage.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            Monitor your cloud storage usage and connected devices. To manage
            vault projects, open the Cadencea Vault desktop app.
          </p>
        </header>

        {/* Usage */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <UsageCard
            label="Cloud storage used"
            headline="847 GB of 1 TB"
            percent={84.7}
            sub="84.7% used"
          />
          <UsageCard
            label="Connected devices"
            headline="2 devices"
            percent={0}
            sub="Unlimited on all plans"
          />
        </div>

        {/* Device management */}
        <section className="mb-8 rounded-md border border-line bg-canvas">
          <header className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
              Device management
            </h2>
          </header>
          <ul className="divide-y divide-line">
            {devices.map((d) => (
              <li
                key={d.name}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{d.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-ink-subtle">
                    {d.type} · last synced {d.lastSync}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-widest ${
                      d.status === 'online'
                        ? 'bg-elevated text-price'
                        : 'bg-elevated text-ink-muted'
                    }`}
                  >
                    {d.status}
                  </span>
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Info banner */}
        <section className="rounded-md border border-line bg-elevated px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Managing your projects
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Project management (creating, editing, and organizing vaults) is
            done exclusively in the Cadencea Vault desktop application. This
            page only shows your cloud storage usage and connected devices.
          </p>
          <Link
            href="/cadenceavault"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Download Cadencea Vault
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  headline,
  percent,
  sub,
}: {
  label: string;
  headline: string;
  percent: number;
  sub: string;
}) {
  return (
    <section className="rounded-md border border-line bg-canvas p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
        {headline}
      </p>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-inset">
        <div
          className="h-full bg-accent"
          style={{ width: `${percent}%` }}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
      <p className="mt-2 text-xs uppercase tracking-widest text-ink-subtle">
        {sub}
      </p>
    </section>
  );
}
