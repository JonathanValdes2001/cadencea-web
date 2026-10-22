'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { resetWalletDemo } from '@/lib/v2-demo/credits/store';

/** "Reset demo wallet": CREDITS-MODEL §10 and Maya's seeded library again (WEB-V2-SPEC §2.5). */
export default function ResetWalletButton() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reset demo wallet
      </Button>
      <DemoConfirm
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          resetWalletDemo();
          toast.show('Demo: the wallet and library are back to the sample data.');
        }}
        title="Reset the demo wallet?"
        body="Maya's wallet and Market library go back to the sample data. Top-ups, purchases and refunds made in this browser are removed."
        confirmLabel="Reset"
        tone="danger"
      />
    </>
  );
}
