import React from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'dark' | 'demo';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-tone-neutral-bg text-tone-neutral',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-tone-success-bg text-tone-success',
  warning: 'bg-tone-warning-bg text-tone-warning',
  danger: 'bg-tone-danger-bg text-tone-danger',
  dark: 'bg-dark text-dark-text',
  demo: 'bg-brand-800 text-brand-50',
};

/** Small uppercase label. `demo` marks preview-only content ("Preview", "Demo"). */
export default function Badge({
  tone = 'neutral',
  size = 'sm',
  icon,
  className = '',
  children,
}: {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm font-semibold uppercase tracking-widest ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
      } ${TONE[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
