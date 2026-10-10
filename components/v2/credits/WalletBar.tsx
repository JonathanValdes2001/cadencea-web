import React from 'react';

const SEGMENTS = [
  { key: 'included', label: 'Included', swatch: 'bg-brand-700' },
  { key: 'bought', label: 'Bought', swatch: 'bg-brand-400' },
] as const;

/**
 * The two-segment Included / Bought bar on the Total card. The legend carries
 * the numbers, so the split never relies on colour alone.
 */
export default function WalletBar({ included, bought }: { included: number; bought: number }) {
  const total = included + bought;
  const values = { included, bought };
  return (
    <div>
      <div
        role="img"
        aria-label={`${included.toLocaleString('en-US')} included and ${bought.toLocaleString('en-US')} bought credits`}
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sm"
      >
        {total === 0 ? (
          <span className="h-full w-full bg-inset" />
        ) : (
          SEGMENTS.filter((s) => values[s.key] > 0).map((s) => (
            <span
              key={s.key}
              title={`${s.label}: ${values[s.key].toLocaleString('en-US')}`}
              className={`h-full ${s.swatch}`}
              // Grow in proportion, so the 2px gap between segments doesn't skew them.
              style={{ flex: `${values[s.key]} 1 0%` }}
            />
          ))
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${s.swatch}`} />
            {s.label}
            <span className="font-semibold tabular-nums text-ink">{values[s.key].toLocaleString('en-US')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
