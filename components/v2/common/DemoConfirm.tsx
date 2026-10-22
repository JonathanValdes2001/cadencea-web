'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';

/** Adds the demo marker to a confirm label once ("Buy" → "Buy (demo)"). */
export function demoLabel(label: string): string {
  return label.endsWith('(demo)') ? label : `${label} (demo)`;
}

/**
 * The confirmation for every demo buyer action and every RELEASE-LIFECYCLE §9.4
 * seller confirmation (WEB-V2-SPEC §2.5): it states what will and won't happen,
 * and its confirm button always ends in "(demo)". Autosave, "Save draft",
 * navigation and the Demo reviewer's buttons never open it.
 */
export default function DemoConfirm({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  /** What will and won't happen. */
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  /** E.g. until a required checkbox in `children` is ticked. */
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={body}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={confirmDisabled}>
            {demoLabel(confirmLabel)}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
