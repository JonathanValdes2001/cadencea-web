'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Close } from '@/components/ui/Icons';
import { PUBLISH_WINDOW } from '@/lib/v2-demo/release-lifecycle/publish-copy';

/**
 * The one Publish window (PUBLISH-PROCEDURE §3), the same layout as the Vault's
 * Publish window: a header with "Publish" and "{project} · {type}", the stepper,
 * a body that scrolls on its own, and the footer actions. It is sized to the
 * viewport, so on desktop and phones it behaves like an app window rather than
 * a long page form: it measures where it starts (the preview strip and navbar
 * wrap differently on phones) and fills the rest of the screen. The creator
 * gate (§1) uses the same shell.
 */
export default function PublishWindow({
  subtitle,
  closeHref = '/studio',
  status,
  stepper,
  footer,
  bodyRef,
  children,
}: {
  /** "{project} · {type}"; left out while there is nothing to name. */
  subtitle?: string;
  closeHref?: string;
  /** Right of the title: the save state, read out politely. */
  status?: React.ReactNode;
  stepper?: React.ReactNode;
  footer?: React.ReactNode;
  bodyRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (el) setTop(Math.round(el.getBoundingClientRect().top + window.scrollY));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="publish-window-title"
      style={top === null ? undefined : { height: `calc(100dvh - ${top}px - 1rem)` }}
      className="mx-auto flex h-[calc(100dvh-11rem)] min-h-[30rem] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-line bg-canvas shadow-modal md:max-h-[56rem]"
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <h1 id="publish-window-title" className="text-base font-semibold tracking-tight text-ink md:text-lg">
            {PUBLISH_WINDOW.title}
          </h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {status && (
          <p aria-live="polite" className="shrink-0 text-xs text-ink-subtle">
            {status}
          </p>
        )}
        <Link
          href={closeHref}
          aria-label={PUBLISH_WINDOW.close}
          title={PUBLISH_WINDOW.close}
          className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-elevated hover:text-ink"
        >
          <Close size={20} />
        </Link>
      </header>
      {stepper && <div className="border-b border-line px-4 py-3 md:px-6">{stepper}</div>}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-8">
        {children}
      </div>
      {footer && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-4 py-3 md:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}
