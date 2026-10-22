import React, { useId } from 'react';
import {
  CHIP_TONE,
  type PrimaryChipId,
  type SecondaryChipId,
  type Tone,
} from '@/lib/v2-demo/release-lifecycle/types';
import Tooltip from './Tooltip';

const TONE_CLASS: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: 'bg-tone-neutral-bg text-tone-neutral', dot: 'bg-tone-neutral' },
  info: { chip: 'bg-tone-info-bg text-tone-info', dot: 'bg-tone-info' },
  update: { chip: 'bg-tone-update-bg text-tone-update', dot: 'bg-tone-update' },
  warning: { chip: 'bg-tone-warning-bg text-tone-warning', dot: 'bg-tone-warning' },
  success: { chip: 'bg-tone-success-bg text-tone-success', dot: 'bg-tone-success' },
  danger: { chip: 'bg-tone-danger-bg text-tone-danger', dot: 'bg-tone-danger' },
};

/**
 * A release status chip (RELEASE-LIFECYCLE §8.1): the tone comes from CHIP_TONE,
 * the label is always shown (never colour alone), and the hint becomes a tooltip
 * reachable by keyboard. Labels and hints come from release-lifecycle/copy.ts.
 */
export default function StatusChip({
  id,
  label,
  hint,
  size = 'sm',
  className = '',
}: {
  id: PrimaryChipId | SecondaryChipId;
  label: string;
  hint?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const tipId = useId();
  const tone = TONE_CLASS[CHIP_TONE[id]];
  const chip = (
    <span
      tabIndex={hint ? 0 : undefined}
      aria-describedby={hint ? tipId : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm font-semibold ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${tone.chip} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
  return hint ? (
    <Tooltip id={tipId} content={hint}>
      {chip}
    </Tooltip>
  ) : (
    chip
  );
}
