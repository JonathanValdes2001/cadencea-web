import React from 'react';

/**
 * A CSS-only tooltip shown on hover and on keyboard focus inside it. The
 * trigger (the child) must point at it with `aria-describedby={id}`, so screen
 * readers hear the text as a description. Works in server components.
 */
export default function Tooltip({
  id,
  content,
  children,
  align = 'center',
  className = '',
}: {
  id: string;
  content: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  const position =
    align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  return (
    <span className={`group/tip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none invisible absolute bottom-full z-40 mb-2 w-max max-w-xs rounded-sm bg-ink px-2.5 py-1.5 text-xs font-normal leading-snug text-canvas opacity-0 shadow-dropdown group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100 ${position}`}
      >
        {content}
      </span>
    </span>
  );
}
