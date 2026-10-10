'use client';

import React, { useId } from 'react';
import { Check } from './Icons';

export interface StepItem {
  id: string;
  label: string;
}

/**
 * The wizard's step bar (RELEASE-LIFECYCLE §5.2): every step can be visited,
 * completed steps show a check and steps with issues show a count. Below md it
 * collapses to "Step 2 of 6 · Details" plus a step menu.
 */
export default function Stepper({
  steps,
  current,
  completed,
  issues = {},
  onStepClick,
  label = 'Steps',
}: {
  steps: readonly StepItem[];
  current: string;
  completed: readonly string[];
  issues?: Readonly<Record<string, number>>;
  onStepClick: (id: string) => void;
  label?: string;
}) {
  const menuId = useId();
  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const issueText = (n: number) => `${n} ${n === 1 ? 'thing' : 'things'} to fix`;

  return (
    <nav aria-label={label}>
      <ol className="hidden flex-wrap gap-2 md:flex">
        {steps.map((step, i) => {
          const isCurrent = step.id === current;
          const isDone = completed.includes(step.id);
          const count = issues[step.id] ?? 0;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-sm border px-3 text-sm font-medium ${
                  isCurrent
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line bg-canvas text-ink-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isDone ? 'bg-tone-success-bg text-tone-success' : isCurrent ? 'bg-canvas text-ink' : 'bg-elevated'
                  }`}
                >
                  {isDone ? <Check size={16} /> : i + 1}
                </span>
                {step.label}
                {isDone && <span className="sr-only">, done</span>}
                {count > 0 && (
                  <>
                    <span
                      aria-hidden="true"
                      className="rounded-sm bg-tone-warning-bg px-1.5 text-[11px] font-semibold tabular-nums text-tone-warning"
                    >
                      {count}
                    </span>
                    <span className="sr-only">, {issueText(count)}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
        <p className="text-sm font-medium text-ink" aria-live="polite">
          Step {index + 1} of {steps.length} · {steps[index]?.label}
        </p>
        <label className="sr-only" htmlFor={menuId}>
          Go to step
        </label>
        <select
          id={menuId}
          value={current}
          onChange={(e) => onStepClick(e.target.value)}
          className="h-11 rounded-sm border border-line bg-elevated px-3 text-base text-ink"
        >
          {steps.map((step, i) => {
            const count = issues[step.id] ?? 0;
            const note = completed.includes(step.id) ? ' (done)' : count > 0 ? ` (${issueText(count)})` : '';
            return (
              <option key={step.id} value={step.id}>
                {`${i + 1}. ${step.label}${note}`}
              </option>
            );
          })}
        </select>
      </div>
    </nav>
  );
}
