import React from 'react';
import Faq from '@/components/ui/Faq';
import { CREDITS_EXPLAINER, CREDITS_FAQ } from '@/lib/v2-demo/credits/copy';

/** "How credits work" on /credits: CREDITS-MODEL §9.2's seven steps, then its §9.4 FAQ. */
export default function CreditsExplainer() {
  return (
    <section aria-labelledby="how-credits-work" className="scroll-mt-24">
      <h2 id="how-credits-work" className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
        How credits work
      </h2>
      <ol className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
        {CREDITS_EXPLAINER.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold tabular-nums text-brand-700"
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink-muted">
              <strong className="font-semibold text-ink">{step.title}</strong> {step.body}
            </p>
          </li>
        ))}
      </ol>
      <Faq items={CREDITS_FAQ} className="mt-12" />
    </section>
  );
}
