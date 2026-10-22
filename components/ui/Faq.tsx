import React from 'react';
import { Chevron } from './Icons';

/** Questions and answers in native <details>, so it needs no JavaScript. */
export default function Faq({
  items,
  headingLevel = 'h3',
  className = '',
}: {
  items: readonly { q: string; a: React.ReactNode }[];
  headingLevel?: 'h2' | 'h3' | 'h4';
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <div className={`divide-y divide-line border-y border-line ${className}`}>
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <Heading className="text-base font-semibold text-ink">{item.q}</Heading>
            <Chevron className="shrink-0 text-ink-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-6 pr-10 text-base leading-relaxed text-ink-muted">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
