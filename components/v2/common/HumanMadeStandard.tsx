import React from 'react';
import { HUMAN_MADE_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { Check, Close } from '@/components/ui/Icons';

/**
 * The Human-Made Standard as RELEASE-LIFECYCLE §9.7 words it: intro, Allowed,
 * Not allowed and the "unsure" line. Shared by the Market, Publish and the
 * Stream teaser so the standard reads the same everywhere.
 */
export default function HumanMadeStandard({
  headingLevel = 'h2',
  showTitle = true,
  onDark = false,
  className = '',
}: {
  headingLevel?: 'h2' | 'h3';
  showTitle?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const Heading = headingLevel;
  const Sub = headingLevel === 'h2' ? 'h3' : 'h4';
  const muted = onDark ? 'text-dark-muted' : 'text-ink-muted';
  const strong = onDark ? 'text-dark-text' : 'text-ink';
  const yes = onDark ? 'text-brand-300' : 'text-tone-success';
  const no = onDark ? 'text-dark-muted' : 'text-tone-danger';
  return (
    <div className={className}>
      {showTitle && (
        <Heading className={`text-xl font-bold tracking-tight ${strong}`}>{HUMAN_MADE_COPY.title}</Heading>
      )}
      <p className={`${showTitle ? 'mt-3' : ''} text-base leading-relaxed ${muted}`}>{HUMAN_MADE_COPY.intro}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <Sub className={`text-sm font-semibold ${strong}`}>{HUMAN_MADE_COPY.allowedTitle}</Sub>
          <ul className="mt-3 space-y-2">
            {HUMAN_MADE_COPY.allowed.map((line) => (
              <li key={line} className={`flex gap-2 text-sm leading-relaxed ${muted}`}>
                <Check size={16} className={`mt-0.5 shrink-0 ${yes}`} />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Sub className={`text-sm font-semibold ${strong}`}>{HUMAN_MADE_COPY.notAllowedTitle}</Sub>
          <ul className="mt-3 space-y-2">
            {HUMAN_MADE_COPY.notAllowed.map((line) => (
              <li key={line} className={`flex gap-2 text-sm leading-relaxed ${muted}`}>
                <Close size={16} className={`mt-0.5 shrink-0 ${no}`} />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={`mt-6 text-sm leading-relaxed ${muted}`}>{HUMAN_MADE_COPY.unsure}</p>
    </div>
  );
}
