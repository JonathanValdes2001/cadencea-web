import React from 'react';

export type ChipVariant = 'tag' | 'tagLink' | 'onDark' | 'filter';

const VARIANT: Record<ChipVariant, string> = {
  /** A tag on a card: quiet, filled. */
  tag: 'bg-elevated px-2 py-0.5 text-xs text-ink-muted',
  /** The same tag as a link (item pages): a touch-sized hit area. */
  tagLink: 'min-h-9 bg-elevated px-3 text-sm text-ink-muted hover:bg-inset hover:text-ink pointer-coarse:min-h-11',
  /** A tag on the dark showroom surface. */
  onDark: 'border border-white/20 px-2.5 py-1 text-xs text-dark-text',
  /** A toggle in a filter row; pair with aria-pressed. */
  filter: 'h-11 border px-3 text-sm font-medium',
};

/**
 * The one chip style (WEB-V2-SPEC §3.1: chips are `rounded-sm`; `rounded-full`
 * is only for avatars, status dots and the credits chip). Returns classes so
 * the chip can be an li, a link or a button.
 */
export function chipClass(variant: ChipVariant, { selected = false }: { selected?: boolean } = {}): string {
  const state =
    variant === 'filter'
      ? selected
        ? 'border-ink bg-ink text-canvas'
        : 'border-line bg-canvas text-ink-muted hover:border-line-strong hover:text-ink'
      : '';
  return `inline-flex items-center rounded-sm ${VARIANT[variant]} ${state}`.trim();
}

/** A filter toggle: a real button with aria-pressed, so the state never relies on color alone. */
export function FilterChip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={selected} onClick={onToggle} className={chipClass('filter', { selected })}>
      {children}
    </button>
  );
}

/** The numbered marker of a step list ("How the Market works", "How credits work"). */
export function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-sm font-semibold tabular-nums text-brand-700"
    >
      {n}
    </span>
  );
}
