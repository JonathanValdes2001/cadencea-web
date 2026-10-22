import React from 'react';

/** Used by every empty filter result, tab and stub page. */
export default function EmptyState({
  icon,
  title,
  body,
  action,
  headingLevel = 'h2',
  className = '',
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  headingLevel?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <div
      className={`flex flex-col items-center rounded-md border border-dashed border-line-strong px-6 py-12 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-ink-subtle">{icon}</div>}
      <Heading className="text-base font-semibold text-ink md:text-lg">{title}</Heading>
      {body && <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
