'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const faqs = [
  {
    q: 'What is Cadencea?',
    a: 'Cadencea is a technology company building innovative software for music creators. We design tools that help artists organize, protect, and elevate their creative work.',
  },
  {
    q: 'Is Cadencea Vault free to use?',
    a: 'Yes. Cadencea Vault has a free tier with 5 GB of cloud storage. Paid plans start at €4.99/month for more storage and features.',
  },
  {
    q: 'Which DAWs does Cadencea Vault support?',
    a: 'Cadencea Vault is DAW-agnostic. It works with any DAW, including Ableton, FL Studio, Logic Pro, Pro Tools, and more. It manages your project files regardless of what software created them.',
  },
  {
    q: 'What platforms is Cadencea Vault available on?',
    a: 'Cadencea Vault is available on Windows and macOS. Separate macOS installers are available for Apple Silicon and Intel Macs. Linux is coming later.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All cloud backups are encrypted and stored securely. Your music and project files remain private and under your control at all times.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. All paid plans can be cancelled at any time. You’ll retain access until the end of your current billing period.',
  },
];

const pillars = [
  {
    title: 'Built for musicians',
    desc: 'Every product is designed by people who make music. We understand the workflow because we live it.',
  },
  {
    title: 'Privacy first',
    desc: 'Your creative work stays yours. Encrypted cloud storage and no data harvesting, ever.',
  },
  {
    title: 'Stay in flow',
    desc: 'Our tools are designed to stay out of your way. No bloat, no distractions, just what you need.',
  },
  {
    title: 'Always evolving',
    desc: 'We’re constantly building and shipping new tools to solve real problems in music production.',
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Software for Music Creators
            </p>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-ink md:text-6xl lg:text-7xl">
              Building the future of music creation.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
              Innovative software and technology designed for music creators,
              by music creators.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/software"
                className="inline-flex h-12 items-center rounded-sm bg-accent px-8 text-sm font-semibold tracking-wide text-white hover:bg-accent-hover"
              >
                Explore our software
              </Link>
              <Link
                href="/cadenceavault"
                className="inline-flex h-12 items-center rounded-sm border border-ink px-8 text-sm font-semibold tracking-wide text-ink hover:bg-elevated"
              >
                Meet Cadencea Vault
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                Our mission
              </p>
              <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
                Organize. Protect. Share.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
                Cadencea builds software that solves real problems in music
                production. We keep projects organized, back them up
                losslessly to the cloud, and make them easy to share with
                collaborators. No transcoding, no vendor lock-in, no
                distractions. Just your work, safe and within reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured product */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                Featured
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Cadencea Vault
              </h2>
            </div>
            <Link
              href="/software"
              className="hidden text-sm font-medium text-ink hover:text-accent md:inline-flex"
            >
              All software →
            </Link>
          </div>

          <Link
            href="/cadenceavault"
            className="group block overflow-hidden rounded-md border border-line bg-canvas hover:border-line-strong hover:shadow-card-hover"
          >
            {/* Product image area — 16:9 dark plate */}
            <div className="relative aspect-[16/9] w-full bg-dark">
              <Image
                src="/logo/og-social-card.svg"
                alt="Cadencea Vault"
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-8 lg:p-12">
                <span className="mb-3 inline-flex items-center rounded-sm bg-price px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                  Available now
                </span>
                <p className="text-sm uppercase tracking-widest text-dark-muted">
                  Desktop · Windows and macOS
                </p>
              </div>
            </div>

            {/* Text area */}
            <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-12 lg:p-12">
              <div className="lg:col-span-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                  Professional music project manager
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink group-hover:text-accent">
                  Organize, protect, and sync your creative work.
                </h3>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
                  Organize your music projects, back them up securely to the
                  cloud, and collaborate with ease. Available for Windows and
                  macOS, with Linux planned for a later release.
                </p>
              </div>
              <div className="flex items-end lg:col-span-4">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-accent">
                  Learn more
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Why Cadencea */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Why Cadencea
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              A deliberate approach to the tools you use every day.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((item) => (
              <div
                key={item.title}
                className="border-t border-line pt-6"
              >
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Frequently asked questions.
            </h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-base font-semibold text-ink md:text-lg">
                      {faq.q}
                    </span>
                    <svg
                      className={`h-5 w-5 flex-shrink-0 text-ink-muted transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {open && (
                    <p className="px-1 pb-6 text-base leading-relaxed text-ink-muted">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
