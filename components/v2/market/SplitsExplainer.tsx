import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { Check } from '@/components/ui/Icons';
import { MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { SPLITS_COPY } from '@/lib/v2-demo/release-lifecycle/copy';

/** "What is a Split?" on /market (WEB-V2-SPEC §4.2). */
export default function SplitsExplainer() {
  return (
    <section aria-labelledby="splits-explainer" className="border-y border-line bg-elevated py-16 lg:py-20">
      <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <Badge tone="warning" size="md">
            {SPLITS_COPY.badge}
          </Badge>
          <h2 id="splits-explainer" className="mt-4 text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {MARKET_HOME_COPY.splitsTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">{MARKET_HOME_COPY.splitsBody}</p>
        </div>
        <div className="flex flex-col justify-center">
          <ul className="space-y-3">
            {MARKET_HOME_COPY.splitsPoints.map((point) => (
              <li key={point} className="flex gap-3 text-base text-ink">
                <Check size={20} className="mt-0.5 shrink-0 text-tone-success" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button href="/market/splits" variant="secondary">
              {MARKET_HOME_COPY.splitsButton}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
