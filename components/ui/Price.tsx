import React from 'react';
import type { Price as PriceValue } from '@/lib/v2-demo/release-lifecycle/types';
import { PRICE_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { creditsToEurCents, fill, formatCredits, formatEurCents, formatMoney } from '@/lib/v2-demo/format';
import { Diamond } from './Icons';

const SIZE = {
  sm: { text: 'text-sm', icon: 16 as const },
  md: { text: 'text-base', icon: 16 as const },
  lg: { text: 'text-2xl font-bold tracking-tight', icon: 20 as const },
};

/**
 * Every price on the v2 site. Credits always carry euros ("30 credits (€3.00)");
 * a no-charge price reads "0 credits", never "Free" (CREDITS-MODEL §9); Splits
 * prices are followed by their terms (DECISIONS.md D2).
 */
export default function Price({
  price,
  fromEurCents,
  splitTerms,
  size = 'md',
  className = '',
}: {
  price: PriceValue;
  /** The cheapest enabled tier, for `per_tier` ("From €30"). */
  fromEurCents?: number;
  /** Splits terms, shown after the price. */
  splitTerms?: { publishing: number; advance: number };
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];
  let visual: React.ReactNode;
  let spoken: string;

  switch (price.kind) {
    case 'credits':
    case 'free': {
      const credits = price.kind === 'credits' ? price.credits : 0;
      const eur = formatEurCents(creditsToEurCents(credits));
      // In a narrow card the euros wrap under the credits; "120 credits" itself never breaks.
      visual = (
        <span className="inline-flex flex-wrap items-center gap-x-1">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Diamond size={s.icon} className="text-credit" />
            <span className="font-semibold text-credit">{formatCredits(credits)}</span>
          </span>
          {credits > 0 && <span className="whitespace-nowrap text-ink-muted">({eur})</span>}
        </span>
      );
      spoken = credits > 0 ? `${formatCredits(credits)}, ${eur}` : PRICE_COPY.zeroCredits;
      break;
    }
    case 'card':
      spoken = formatMoney(price.amount);
      visual = <span className="font-semibold text-ink">{spoken}</span>;
      break;
    case 'per_tier':
      spoken =
        fromEurCents === undefined ? 'Priced per lease' : `From ${formatEurCents(fromEurCents, { trimZeros: true })}`;
      visual = <span className="font-semibold text-ink">{spoken}</span>;
      break;
    case 'stream_only':
      spoken = PRICE_COPY.streamOnly;
      visual = <span className="font-medium text-ink">{spoken}</span>;
      break;
  }

  const terms = splitTerms
    ? fill(PRICE_COPY.splitsTerms, { publishing: splitTerms.publishing, advance: splitTerms.advance })
    : null;

  return (
    <span className={`inline-flex tabular-nums ${s.text} ${className}`}>
      <span className="sr-only">
        Price: {spoken}
        {terms ? `, ${terms}` : ''}
      </span>
      <span aria-hidden="true" className="inline-flex flex-wrap items-baseline gap-x-2">
        {visual}
        {terms && <span className="text-sm font-normal text-ink-muted">{terms}</span>}
      </span>
    </span>
  );
}
