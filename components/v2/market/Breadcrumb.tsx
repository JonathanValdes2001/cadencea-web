import React from 'react';
import Link from 'next/link';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';

/** "Market / Sample packs / Kiln Drill Kit": every step but the last is a link. */
export default function Breadcrumb({
  trail,
  onDark = false,
}: {
  trail: readonly { label: string; href?: string }[];
  /** On the showroom surface (category and "All results" headers). */
  onDark?: boolean;
}) {
  return (
    <nav aria-label={ITEM_COPY.breadcrumbLabel}>
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${onDark ? 'text-dark-muted' : 'text-ink-muted'}`}>
        {trail.map((step, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={step.label} className="flex min-w-0 items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {step.href && !last ? (
                <Link
                  href={step.href}
                  className={`inline-flex min-h-11 items-center md:min-h-0 ${onDark ? 'hover:text-dark-text' : 'hover:text-ink'}`}
                >
                  {step.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={`truncate ${onDark ? 'text-dark-text' : 'text-ink'}`}>
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
