'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Chevron } from '@/components/ui/Icons';
import type { FilterField } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { FIELD_CLEAR, fieldCount } from '@/lib/v2-demo/market/browse';
import { BROWSE_COPY } from '@/lib/v2-demo/market/copy';
import { FIELD_TITLE, FilterFieldControls, availableFields, type FilterFieldProps } from './FilterPanel';

/** Wide enough for the 6-column key grid; the panel flips to end-align when it would leave the viewport. */
const PANEL_WIDTH = 320;
const VIEWPORT_GUTTER = 16;

/**
 * One filter button and its panel (the Splice pattern: "Key ▾" opens a small
 * panel above the results). A disclosure: the panel follows its button in the
 * tab order; Esc or a click outside closes it and Esc returns focus.
 */
function FilterDropdown({
  field,
  open,
  onOpenChange,
  ...props
}: FilterFieldProps & { field: FilterField; open: boolean; onOpenChange: (open: boolean) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [alignEnd, setAlignEnd] = useState(false);
  const count = fieldCount(field, props.filters);
  const panelId = `${props.idPrefix}-${field}-panel`;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const { left } = buttonRef.current.getBoundingClientRect();
    setAlignEnd(left + PANEL_WIDTH > window.innerWidth - VIEWPORT_GUTTER);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onOpenChange(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      // Tabbing out of the panel closes it; a click on blank panel space (no relatedTarget) doesn't.
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (open && next && !wrapRef.current?.contains(next)) onOpenChange(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className={`inline-flex h-10 items-center gap-2 rounded-sm border pl-3.5 pr-2.5 text-sm font-medium pointer-coarse:h-11 ${
          count > 0
            ? 'border-brand-600 bg-brand-50 text-brand-800'
            : open
              ? 'border-ink bg-canvas text-ink'
              : 'border-line bg-canvas text-ink hover:border-line-strong'
        }`}
      >
        {FIELD_TITLE[field]}
        {count > 0 && (
          <>
            <span
              aria-hidden="true"
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-brand-600 px-1 text-xs font-semibold tabular-nums text-white"
            >
              {count}
            </span>
            <span className="sr-only">, {fill(BROWSE_COPY.selected, { n: count })}</span>
          </>
        )}
        <Chevron size={16} className={`shrink-0 text-ink-subtle ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={panelId}
          style={{ width: PANEL_WIDTH }}
          className={`absolute top-full z-40 mt-2 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-canvas p-4 shadow-dropdown ${
            alignEnd ? 'right-0' : 'left-0'
          }`}
        >
          <FilterFieldControls field={field} {...props} legendClassName="sr-only" />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => props.onChange(FIELD_CLEAR[field])}
              disabled={count === 0 && !(field === 'bpm' && props.filters.half)}
              className="inline-flex h-9 items-center px-1 text-sm font-semibold text-accent-ink hover:text-accent-hover disabled:cursor-not-allowed disabled:text-ink-subtle pointer-coarse:h-11"
            >
              {BROWSE_COPY.clearField}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                buttonRef.current?.focus();
              }}
              className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink/85 pointer-coarse:h-11"
            >
              {BROWSE_COPY.doneField}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The row of filter buttons above the results from md (WEB-V2-SPEC §4.3, laid
 * out the way Splice does it): one button per field the category filters on,
 * each showing how many choices it holds. Tags have their own row.
 */
export default function FilterBar({
  fields,
  className = '',
  ...props
}: FilterFieldProps & { fields: readonly FilterField[]; className?: string }) {
  const [open, setOpen] = useState<FilterField | null>(null);
  const shown = availableFields(fields, props.pool, props.priceUnit).filter((field) => field !== 'tags');
  if (!shown.length) return null;
  return (
    <div role="group" aria-label={BROWSE_COPY.filterBarLabel} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {shown.map((field) => (
        <FilterDropdown
          key={field}
          field={field}
          open={open === field}
          onOpenChange={(next) => setOpen(next ? field : (current) => (current === field ? null : current))}
          {...props}
        />
      ))}
    </div>
  );
}
