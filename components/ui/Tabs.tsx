'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  /** With hrefs the tabs are navigation links; without, an ARIA tablist. */
  href?: string;
}

/** The ids that tie a tab to its panel: give the panel `role="tabpanel"`, `id={panelId}`, `aria-labelledby={tabId}`. */
export function tabIds(idPrefix: string, id: string): { tabId: string; panelId: string } {
  return { tabId: `${idPrefix}-tab-${id}`, panelId: `${idPrefix}-panel-${id}` };
}

const STYLE = {
  underline: {
    list: 'gap-6 border-b border-line',
    item: 'inline-flex h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-1 text-sm font-medium focus-visible:outline-offset-[-2px]',
    active: 'border-accent text-ink',
    idle: 'border-transparent text-ink-muted hover:text-ink',
  },
  pill: {
    list: 'gap-2',
    item: 'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-sm px-4 text-sm font-medium focus-visible:outline-offset-[-2px] pointer-coarse:h-11',
    active: 'bg-ink text-canvas',
    idle: 'bg-elevated text-ink-muted hover:bg-inset hover:text-ink',
  },
} as const;

/**
 * Tabs that scroll sideways on small screens. Link tabs mark the current one
 * with aria-current; tablist tabs use roving tabindex with arrow, Home and End.
 */
export default function Tabs({
  items,
  value,
  onChange,
  variant = 'underline',
  label,
  idPrefix = 'tabs',
  className = '',
}: {
  items: readonly TabItem[];
  value: string;
  onChange?: (id: string) => void;
  variant?: keyof typeof STYLE;
  /** Accessible name of the tab row. */
  label: string;
  idPrefix?: string;
  className?: string;
}) {
  const style = STYLE[variant];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isNav = items.some((item) => item.href);

  const inner = (item: TabItem) => (
    <>
      {item.label}
      {item.count !== undefined && (
        <span className={`tabular-nums ${item.id === value && variant === 'pill' ? 'text-canvas' : 'text-ink-subtle'}`}>
          {item.count}
        </span>
      )}
    </>
  );

  const row = (children: React.ReactNode, props: React.HTMLAttributes<HTMLDivElement> = {}) => (
    <div className={`scroll-fade-x scrollbar-none overflow-x-auto ${className}`}>
      <div {...props} className={`flex w-max min-w-full pr-6 ${style.list}`}>
        {children}
      </div>
    </div>
  );

  if (isNav) {
    return (
      <nav aria-label={label}>
        {row(
          items.map((item) => {
            const active = item.id === value;
            return (
              <Link
                key={item.id}
                href={item.href ?? '#'}
                aria-current={active ? 'page' : undefined}
                className={`${style.item} ${active ? style.active : style.idle}`}
              >
                {inner(item)}
              </Link>
            );
          }),
        )}
      </nav>
    );
  }

  const focusAndSelect = (index: number) => {
    const item = items[(index + items.length) % items.length];
    refs.current[(index + items.length) % items.length]?.focus();
    onChange?.(item.id);
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      focusAndSelect(moves[event.key]);
    }
  };

  return row(
    items.map((item, index) => {
      const active = item.id === value;
      const { tabId, panelId } = tabIds(idPrefix, item.id);
      return (
        <button
          key={item.id}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="tab"
          id={tabId}
          aria-selected={active}
          aria-controls={panelId}
          tabIndex={active ? 0 : -1}
          onClick={() => onChange?.(item.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className={`${style.item} ${active ? style.active : style.idle}`}
        >
          {inner(item)}
        </button>
      );
    }),
    { role: 'tablist', 'aria-label': label },
  );
}
