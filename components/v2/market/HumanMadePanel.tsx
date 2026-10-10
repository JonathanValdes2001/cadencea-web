'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Shield } from '@/components/ui/Icons';
import HumanMadeStandard from '@/components/v2/common/HumanMadeStandard';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import { HUMAN_MADE_COPY, PUBLIC_COPY } from '@/lib/v2-demo/release-lifecycle/copy';

/**
 * "Human-made · Reviewed by Cadencea" (WEB-V2-SPEC §4.4 item 7). Buyers never
 * see the review evidence, only this line (RELEASE-LIFECYCLE §9.7).
 */
export default function HumanMadePanel() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="human-made-panel" className="border-t border-line pt-8">
      <h2 id="human-made-panel" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
        <Shield size={20} className="text-accent-ink" />
        {PUBLIC_COPY.humanMade}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{ITEM_COPY.humanMadeBody}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:text-accent-hover"
      >
        {ITEM_COPY.humanMadeLink}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={HUMAN_MADE_COPY.title}
        size="lg"
        footer={<Button onClick={() => setOpen(false)}>{ITEM_COPY.close}</Button>}
      >
        <HumanMadeStandard showTitle={false} />
      </Dialog>
    </section>
  );
}
