import React from 'react';
import Form from 'next/form';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import { Check, Search } from '@/components/ui/Icons';
import { MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';

/**
 * The /market hero on the showroom surface (WEB-V2-SPEC §4.2). The search
 * submits to /market?q=…, which shows the "All results" grid.
 */
export default function MarketHero() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-showroom py-16 text-dark-text lg:py-24">
      <ShowroomGlow />
      <Container>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">{MARKET_HOME_COPY.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {MARKET_HOME_COPY.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-dark-muted md:text-lg">{MARKET_HOME_COPY.lead}</p>

          <Form action="/market" role="search" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="market-hero-search" className="sr-only">
              {MARKET_HOME_COPY.searchLabel}
            </label>
            <div className="relative flex-1">
              <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" />
              <input
                id="market-hero-search"
                name="q"
                type="search"
                placeholder={MARKET_HOME_COPY.searchPlaceholder}
                className="h-12 w-full rounded-sm border border-white/20 bg-white/5 pl-12 pr-4 text-base text-dark-text placeholder:text-dark-muted focus:border-brand-400"
              />
            </div>
            <Button type="submit" variant="onDark" size="lg">
              {MARKET_HOME_COPY.searchSubmit}
            </Button>
          </Form>

          <ul className="mt-6 flex flex-col gap-2 text-sm text-dark-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
            {MARKET_HOME_COPY.trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-brand-300" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button href="/publish" variant="onDarkOutline">
              {MARKET_HOME_COPY.sell}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
