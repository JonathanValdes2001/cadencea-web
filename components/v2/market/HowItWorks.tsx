import React from 'react';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';

/** "How the Market works", three steps (WEB-V2-SPEC §4.2). */
export default function HowItWorks() {
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <SectionHeader title={MARKET_HOME_COPY.howTitle} />
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {MARKET_HOME_COPY.howSteps.map((step, index) => (
            <li key={step} className="border-t border-line pt-5">
              <span className="text-sm font-semibold tabular-nums text-accent-ink">{index + 1}.</span>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 text-sm text-ink-subtle">{MARKET_HOME_COPY.comingLater}</p>
        <p className="mt-2 text-sm text-ink-subtle">{MARKET_HOME_COPY.footnote}</p>
      </Container>
    </section>
  );
}
