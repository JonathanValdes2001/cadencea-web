'use client';

import React from 'react';
import type { ViewMode } from '@/lib/v2-demo/market/browse';
import { BROWSE_COPY } from '@/lib/v2-demo/market/copy';

const ICON: Record<ViewMode, React.ReactNode> = {
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
};

const OPTIONS: readonly { mode: ViewMode; label: string; spoken: string }[] = [
  { mode: 'grid', label: BROWSE_COPY.gridView, spoken: BROWSE_COPY.gridViewLabel },
  { mode: 'list', label: BROWSE_COPY.listView, spoken: BROWSE_COPY.listViewLabel },
];

/** Grid or list: two pressed-state buttons, labelled for screen readers; the words show from md. */
export default function ViewToggle({
  value,
  onChange,
  className = '',
}: {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={BROWSE_COPY.viewLabel}
      className={`inline-flex shrink-0 rounded-sm border border-line bg-canvas p-0.5 ${className}`}
    >
      {OPTIONS.map(({ mode, label, spoken }) => {
        const pressed = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={pressed}
            aria-label={spoken}
            title={spoken}
            onClick={() => onChange(mode)}
            className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-[3px] px-2 text-sm font-medium pointer-coarse:h-11 pointer-coarse:min-w-11 md:px-3 ${
              pressed ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              aria-hidden="true"
              focusable="false"
              fill={mode === 'grid' ? 'currentColor' : 'none'}
              stroke={mode === 'list' ? 'currentColor' : 'none'}
              strokeWidth={2}
              strokeLinecap="round"
            >
              {ICON[mode]}
            </svg>
            <span aria-hidden="true" className="hidden md:inline">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
