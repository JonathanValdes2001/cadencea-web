import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { Diamond } from '@/components/ui/Icons';
import { PRICING_CREDITS } from '@/lib/v2-demo/credits/copy';

// The price strip read as rows ("One-shot, loop or MIDI file" → "1 credit (€0.10)"),
// split from the one CREDITS-MODEL §9.1 string so the words stay verbatim.
const PRICE_ROWS = PRICING_CREDITS.priceStrip.split(' · ').map((part) => {
  const [item, price] = part.split(': ');
  return { item, price };
});

/**
 * The preview-only credits section on /pricing (WEB-V2-SPEC §5.5, CREDITS-MODEL
 * §9.1). The pricing page renders it only when useShowV2() is true.
 */
export default function PricingCreditsSection() {
  return (
    <section id="credits" className="scroll-mt-24 border-b border-line bg-elevated">
      <Container className="py-20 lg:py-28">
        <SectionHeader
          eyebrow={PRICING_CREDITS.eyebrow}
          title={PRICING_CREDITS.heading}
          subtitle={PRICING_CREDITS.subheading}
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_CREDITS.cards.map((card) => (
            <div key={card.title} className="rounded-md border border-line bg-canvas p-6">
              <h3 className="text-base font-semibold text-ink md:text-lg">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{card.body}</p>
            </div>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-1 divide-y divide-line rounded-md border border-line bg-canvas md:grid-cols-3 md:divide-x md:divide-y-0">
          {PRICE_ROWS.map((row) => (
            <div key={row.item} className="flex items-center justify-between gap-4 px-6 py-4 md:flex-col md:items-start md:gap-1">
              <dt className="text-sm text-ink-muted">{row.item}</dt>
              <dd className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-credit">
                <Diamond size={16} />
                {row.price}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-muted">{PRICING_CREDITS.footnote}</p>
        <Button href="/credits" variant="secondary" className="mt-8">
          See the demo wallet
        </Button>
      </Container>
    </section>
  );
}
