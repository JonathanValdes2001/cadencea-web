import React from 'react';

type LegalLayoutProps = {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
};

export default function LegalLayout({
  title,
  effectiveDate,
  children,
}: LegalLayoutProps) {
  return (
    <div className="bg-canvas text-ink">
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Last updated: April 15, 2026
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Effective date: {effectiveDate}
          </p>
        </div>
      </section>

      <section>
        <div className="legal-prose mx-auto max-w-3xl px-6 py-16 lg:py-20">
          {children}
        </div>
      </section>
    </div>
  );
}
