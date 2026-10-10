import React from 'react';
import Container from '@/components/ui/Container';

const PRINCIPLES = [
  {
    title: 'Human-made, reviewed',
    body: 'Every release is checked by a person against the Human-Made Standard before it goes live. Detection tools only flag releases for a closer listen.',
  },
  {
    title: 'Your money, your artists',
    body: 'Your subscription is split between the artists you played that month, not pooled by total plays.',
  },
  {
    title: 'Artists keep their rights',
    body: 'Cadencea is a store and streaming service, never a label or publisher. Artists grant a non-exclusive license and keep everything else.',
  },
];

/** The three Stream principles on /stream (WEB-V2-SPEC §4.9). */
export default function StreamPrinciples() {
  return (
    <section aria-labelledby="stream-principles" className="border-b border-line py-14 sm:py-20 lg:py-24">
      <Container>
        <h2 id="stream-principles" className="sr-only">
          Three principles
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="border-t-2 border-accent pt-6">
              <h3 className="text-base font-semibold text-ink md:text-lg">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
