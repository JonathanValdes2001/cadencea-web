'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { fill } from '@/lib/v2-demo/format';
import { FILTER_COPY } from '@/lib/v2-demo/market/copy';

/**
 * The filters below lg: a sheet whose primary button reads "Show {n} results"
 * (WEB-V2-SPEC §3.6). Changes apply as they are made; the button closes it.
 */
export default function FilterSheet({
  open,
  onClose,
  resultCount,
  onClear,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={FILTER_COPY.panelTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClear}>
            {FILTER_COPY.clearAll}
          </Button>
          <Button onClick={onClose}>
            {resultCount === 1 ? FILTER_COPY.showOneResult : fill(FILTER_COPY.showResults, { n: resultCount })}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
