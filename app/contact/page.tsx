import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Cadencea',
  description:
    'Get in touch with the Cadencea team for product support, privacy requests, or general inquiries.',
};

type Channel = {
  title: string;
  email: string;
  description: string;
  responseTime: string;
};

const channels: Channel[] = [
  {
    title: 'Product support',
    email: 'support@cadencea.app',
    description:
      'Account issues, billing questions, bug reports, and help using Cadencea Vault.',
    responseTime: 'Usually within 1–2 business days',
  },
  {
    title: 'Privacy & data requests',
    email: 'privacy@cadencea.app',
    description:
      'GDPR requests, data access, deletion, rectification, and data protection concerns.',
    responseTime: 'Within 30 days as required by GDPR',
  },
  {
    title: 'General inquiries',
    email: 'hello@cadencea.app',
    description:
      'Press, partnerships, feedback, and anything else that doesn’t fit above.',
    responseTime: 'We’ll get back to you as soon as we can',
  },
];

export default function ContactPage() {
  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Contact
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Get in touch.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            We read every message. Pick the channel that fits your question — it
            helps us route things to the right place and get back to you faster.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {channels.map((c) => (
              <div
                key={c.email}
                className="flex flex-col rounded-md border border-line bg-canvas p-8 transition-shadow hover:shadow-card-hover"
              >
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                  {c.title}
                </h2>
                <a
                  href={`mailto:${c.email}`}
                  className="mt-3 break-all text-xl font-semibold tracking-tight text-accent hover:text-accent-hover"
                >
                  {c.email}
                </a>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {c.description}
                </p>
                <p className="mt-6 border-t border-line pt-4 text-xs text-ink-subtle">
                  {c.responseTime}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company details */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Company details.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                Cadencea is an independent music software studio, registered
                and operated from Norway.
              </p>
            </div>

            <div className="md:col-span-2">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="border-t border-line pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Business name
                  </dt>
                  <dd className="mt-2 text-sm text-ink">
                    Yuma Pellon Valdes
                  </dd>
                </div>
                <div className="border-t border-line pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Organisation number
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-ink">930343870</dd>
                </div>
                <div className="border-t border-line pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Country
                  </dt>
                  <dd className="mt-2 text-sm text-ink">Norway</dd>
                </div>
                <div className="border-t border-line pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                    Website
                  </dt>
                  <dd className="mt-2 text-sm text-ink">
                    <a
                      href="https://cadencea.app"
                      className="text-accent hover:text-accent-hover"
                    >
                      cadencea.app
                    </a>
                  </dd>
                </div>
              </dl>

              <p className="mt-10 text-sm leading-relaxed text-ink-muted">
                For EU/EEA data protection matters, our supervisory authority
                is the Norwegian Data Protection Authority (Datatilsynet) —{' '}
                <a
                  href="https://www.datatilsynet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  datatilsynet.no
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
