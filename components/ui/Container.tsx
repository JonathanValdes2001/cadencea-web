import React from 'react';

/** The page column: max 1280px with 24px gutters (32px from lg). */
export default function Container({
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'article' | 'main';
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  return (
    <Tag className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * The three ambient violet glows of the showroom surface. Place it as the first
 * child of a `relative isolate overflow-hidden bg-showroom` section.
 */
export function ShowroomGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-40 left-1/2 h-[460px] w-[940px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),transparent)] blur-3xl" />
      <div className="absolute left-[-10%] top-[38%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)] blur-3xl" />
      <div className="absolute right-[-8%] top-[64%] h-[460px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.16),transparent)] blur-3xl" />
    </div>
  );
}
