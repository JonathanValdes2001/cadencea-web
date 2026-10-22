'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { fill } from '@/lib/v2-demo/format';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';

/** "Report this listing" with ADR-0042's reasons; nothing is sent (WEB-V2-SPEC §4.4 item 9). */
export default function ReportDialog({ title }: { title: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setReason(null);
  };

  return (
    <div className="border-t border-line pt-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
      >
        {ITEM_COPY.report}
      </button>
      <DemoConfirm
        open={open}
        onClose={close}
        onConfirm={() => {
          close();
          toast.show(ITEM_COPY.reportToast);
        }}
        title={fill(ITEM_COPY.reportTitle, { title })}
        body={ITEM_COPY.reportBody}
        confirmLabel={ITEM_COPY.reportConfirm}
        confirmDisabled={reason === null}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">{ITEM_COPY.reportLegend}</legend>
          {ITEM_COPY.reportReasons.map((option, index) => {
            const id = `report-reason-${index}`;
            return (
              <div key={option} className="flex min-h-11 items-center gap-3">
                <input
                  id={id}
                  type="radio"
                  name="report-reason"
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
                />
                <label htmlFor={id} className="cursor-pointer text-sm text-ink">
                  {option}
                </label>
              </div>
            );
          })}
        </fieldset>
      </DemoConfirm>
    </div>
  );
}
