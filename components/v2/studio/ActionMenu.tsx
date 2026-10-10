'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { More } from '@/components/ui/Icons';

export interface ActionMenuItem {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  /** A disabled item stays in the menu with its reason under the label (§6.4). */
  disabledReason?: string;
  danger?: boolean;
}

/**
 * The overflow menu on Studio rows and the Studio header: a menu button with
 * arrow-key navigation, Escape to close and focus returned to the button.
 */
export default function ActionMenu({
  label,
  items,
  className = '',
}: {
  /** Accessible name of the button, e.g. "More actions for Ice Road". */
  label: string;
  items: readonly ActionMenuItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  if (items.length === 0) return null;

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const nodes = itemRefs.current.filter((n): n is HTMLElement => n !== null);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      nodes[(to + nodes.length) % nodes.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(nodes.length - 1);
    else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') close(false);
  };

  const itemClass = (item: ActionMenuItem) =>
    `flex w-full flex-col items-start px-4 py-2.5 text-left text-sm min-h-11 focus-visible:outline-offset-[-2px] ${
      item.disabledReason
        ? 'cursor-not-allowed text-ink-subtle'
        : item.danger
          ? 'text-danger hover:bg-tone-danger-bg'
          : 'text-ink hover:bg-elevated'
    }`;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-canvas text-ink-muted hover:border-line-strong hover:text-ink"
      >
        <More size={20} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-md border border-line bg-canvas py-1 shadow-dropdown"
        >
          {items.map((item, i) => {
            const ref = (el: HTMLElement | null) => {
              itemRefs.current[i] = el;
            };
            const body = (
              <>
                <span className="font-medium">{item.label}</span>
                {item.disabledReason && <span className="mt-0.5 text-xs text-ink-subtle">{item.disabledReason}</span>}
              </>
            );
            if (item.href && !item.disabledReason) {
              return (
                <Link key={item.id} ref={ref} href={item.href} role="menuitem" tabIndex={-1} className={itemClass(item)} onClick={() => setOpen(false)}>
                  {body}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                ref={ref}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabledReason ? true : undefined}
                onClick={() => {
                  if (item.disabledReason) return;
                  close(true);
                  item.onSelect?.();
                }}
                className={itemClass(item)}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
