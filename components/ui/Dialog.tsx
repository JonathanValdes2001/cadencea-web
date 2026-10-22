'use client';

import React, { useEffect, useId, useRef } from 'react';
import { Close } from './Icons';

const WIDTH = { sm: 'md:max-w-md', md: 'md:max-w-lg', lg: 'md:max-w-2xl' } as const;

/**
 * A modal on the native <dialog> (showModal gives the focus trap, Esc and the
 * inert page). Focus returns to whatever opened it. Below md it is a bottom sheet.
 * The parent owns `open`; Esc, the close button and a backdrop click call onClose.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof WIDTH;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const restoreFocus = () => opener.current?.focus();
    dialog.addEventListener('close', restoreFocus);
    return () => {
      dialog.removeEventListener('close', restoreFocus);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`ui-dialog fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90vh] w-full max-w-none rounded-t-md bg-canvas p-0 text-ink shadow-modal md:inset-0 md:m-auto md:h-fit md:w-[calc(100%-2rem)] md:rounded-md ${WIDTH[size]}`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-elevated hover:text-ink"
          >
            <Close size={20} />
          </button>
        </div>
        {children && <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-muted">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
