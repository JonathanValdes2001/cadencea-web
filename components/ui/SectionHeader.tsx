import React from 'react';

/** The eyebrow → heading → lead pattern used at the top of every section. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  onDark = false,
  align = 'left',
  as: Heading = 'h2',
  action,
  className = '',
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onDark?: boolean;
  align?: 'left' | 'center';
  /** h1 for page heroes and app pages; h2 (default) for sections. */
  as?: 'h1' | 'h2' | 'h3';
  /** A link or button on the right, e.g. "See all 12 →" on a rail. */
  action?: React.ReactNode;
  className?: string;
}) {
  const centered = align === 'center';
  const headingSize =
    Heading === 'h1'
      ? 'text-3xl md:text-4xl'
      : Heading === 'h3'
        ? 'text-base md:text-lg'
        : 'text-2xl md:text-3xl';
  return (
    <div
      className={`flex flex-col gap-4 ${action ? 'sm:flex-row sm:items-end sm:justify-between' : ''} ${
        centered ? 'items-center text-center' : ''
      } ${className}`}
    >
      <div className={centered ? 'mx-auto max-w-2xl' : 'max-w-3xl'}>
        {eyebrow && (
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${
              onDark ? 'text-brand-300' : 'text-ink-subtle'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <Heading
          className={`${eyebrow ? 'mt-3' : ''} ${headingSize} font-bold tracking-tight ${
            onDark ? 'text-dark-text' : 'text-ink'
          }`}
        >
          {title}
        </Heading>
        {subtitle && (
          <p
            className={`mt-4 text-base leading-relaxed md:text-lg ${
              onDark ? 'text-dark-muted' : 'text-ink-muted'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
