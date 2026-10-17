import React, { useId } from 'react';
import { PREFILL_COPY } from '@/lib/v2-demo/prefill-copy';
import { Minus, Plus } from './Icons';
import Tooltip from './Tooltip';

/**
 * Labelled form fields. Each wires its hint and error to the control with
 * aria-describedby and sets aria-invalid on error. `sourceChip` shows where a
 * prefilled value came from (RELEASE-LIFECYCLE §5.2 prefill chips).
 */

export type SourceChipKind = 'project' | 'detected' | 'needs_input';
export type SourceChip = SourceChipKind | { kind: SourceChipKind; hint?: string };

const CHIP: Record<SourceChipKind, { label: string; className: string }> = {
  project: { label: PREFILL_COPY.fromProject, className: 'bg-tone-neutral-bg text-tone-neutral' },
  detected: { label: PREFILL_COPY.detected, className: 'bg-tone-info-bg text-tone-info' },
  needs_input: { label: PREFILL_COPY.needsInput, className: 'bg-tone-warning-bg text-tone-warning' },
};

interface FieldBaseProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  sourceChip?: SourceChip;
}

const CONTROL =
  'w-full rounded-sm border bg-elevated px-3 text-base text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm';

function controlBorder(error: React.ReactNode) {
  return error ? 'border-danger' : 'border-line';
}

function describedBy(id: string, hint: React.ReactNode, error: React.ReactNode, extra?: string) {
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : '', extra ?? ''].filter(Boolean).join(' ') || undefined;
}

function SourceChipLabel({ chip }: { chip: SourceChip }) {
  const tipId = useId();
  const { kind, hint } = typeof chip === 'string' ? { kind: chip, hint: undefined } : chip;
  const pill = (
    <span
      tabIndex={hint ? 0 : undefined}
      aria-describedby={hint ? tipId : undefined}
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${CHIP[kind].className}`}
    >
      {CHIP[kind].label}
    </span>
  );
  return hint ? (
    <Tooltip id={tipId} content={hint} align="end">
      {pill}
    </Tooltip>
  ) : (
    pill
  );
}

function FieldShell({
  id,
  label,
  hint,
  error,
  sourceChip,
  children,
}: FieldBaseProps & { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {sourceChip && <SourceChipLabel chip={sourceChip} />}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  sourceChip,
  className = '',
  ...input
}: FieldBaseProps & Omit<React.ComponentPropsWithRef<'input'>, 'id'>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} sourceChip={sourceChip}>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, input['aria-describedby'])}
        className={`${CONTROL} h-11 ${controlBorder(error)} ${className}`}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  sourceChip,
  className = '',
  ...textarea
}: FieldBaseProps & Omit<React.ComponentPropsWithRef<'textarea'>, 'id'>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} sourceChip={sourceChip}>
      <textarea
        id={id}
        rows={4}
        {...textarea}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, textarea['aria-describedby'])}
        className={`${CONTROL} py-2.5 leading-relaxed ${controlBorder(error)} ${className}`}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  hint,
  error,
  sourceChip,
  options,
  className = '',
  children,
  ...select
}: FieldBaseProps &
  Omit<React.ComponentPropsWithRef<'select'>, 'id'> & {
    options?: readonly { value: string; label: string }[];
  }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} sourceChip={sourceChip}>
      <select
        id={id}
        {...select}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, select['aria-describedby'])}
        className={`${CONTROL} h-11 pr-8 ${controlBorder(error)} ${className}`}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
    </FieldShell>
  );
}

/** A checkbox with its label to the right; the label may contain links. */
export function CheckboxField({
  id,
  label,
  hint,
  error,
  className = '',
  ...input
}: Omit<FieldBaseProps, 'sourceChip'> & Omit<React.ComponentPropsWithRef<'input'>, 'id' | 'type'>) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          {...input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error, input['aria-describedby'])}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm border-line-strong accent-[var(--color-accent)] disabled:cursor-not-allowed"
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink">
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="ml-8 mt-1 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ml-8 mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A slider. `valueText` is shown next to the label and read as aria-valuetext. */
export function RangeField({
  id,
  label,
  hint,
  error,
  sourceChip,
  valueText,
  className = '',
  ...input
}: FieldBaseProps & Omit<React.ComponentPropsWithRef<'input'>, 'id' | 'type'> & { valueText?: string }) {
  return (
    <FieldShell
      id={id}
      label={
        <>
          {label}
          {valueText && <span className="ml-2 font-semibold tabular-nums text-ink">{valueText}</span>}
        </>
      }
      hint={hint}
      error={error}
      sourceChip={sourceChip}
    >
      <input
        id={id}
        type="range"
        {...input}
        aria-valuetext={valueText}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error, input['aria-describedby'])}
        className={`h-11 w-full cursor-pointer accent-[var(--color-accent)] ${className}`}
      />
    </FieldShell>
  );
}

/** A number with − and + buttons, clamped to [min, max] in `step`s. */
export function StepperField({
  id,
  label,
  hint,
  error,
  sourceChip,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  prefix,
  addon,
  disabled = false,
}: FieldBaseProps & {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Shown inside the field before the number, e.g. "€". */
  prefix?: string;
  /** Shown after the control, e.g. "= 150 credits". */
  addon?: React.ReactNode;
  disabled?: boolean;
}) {
  const clamp = (n: number) => {
    const snapped = Math.round((n - min) / step) * step + min;
    return Math.min(max, Math.max(min, snapped));
  };
  const labelText = typeof label === 'string' ? label : 'value';
  const stepButton =
    'flex h-11 w-11 shrink-0 items-center justify-center border-line text-ink hover:bg-inset disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} sourceChip={sourceChip}>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex items-stretch overflow-hidden rounded-sm border bg-elevated focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${controlBorder(error)}`}
        >
          <button
            type="button"
            aria-label={`Decrease ${labelText}`}
            disabled={disabled || value <= min}
            onClick={() => onValueChange(clamp(value - step))}
            className={`${stepButton} border-r`}
          >
            <Minus size={16} />
          </button>
          <div className="flex items-center px-2">
            {prefix && <span className="text-sm text-ink-muted">{prefix}</span>}
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              step={step}
              value={value}
              disabled={disabled}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isNaN(next)) onValueChange(next);
              }}
              onBlur={() => onValueChange(clamp(value))}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id, hint, error)}
              className="h-11 w-16 bg-transparent text-center text-base font-semibold tabular-nums text-ink focus:outline-none [appearance:textfield] sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <button
            type="button"
            aria-label={`Increase ${labelText}`}
            disabled={disabled || value >= max}
            onClick={() => onValueChange(clamp(value + step))}
            className={`${stepButton} border-l`}
          >
            <Plus size={16} />
          </button>
        </div>
        {addon && <div className="text-sm text-ink-muted tabular-nums">{addon}</div>}
      </div>
    </FieldShell>
  );
}
