'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { StepperField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { CREDITS } from '@/lib/v2-demo/credits/config';
import { CHECKOUT_COPY, WALLET_COPY } from '@/lib/v2-demo/credits/copy';
import { addTopUp, refundTopUpLot, useWallet } from '@/lib/v2-demo/credits/store';
import type { BoughtLot } from '@/lib/v2-demo/credits/types';
import { refundableLots, topUpError } from '@/lib/v2-demo/credits/wallet';
import { fill, formatCredits, formatDate, formatEurCents } from '@/lib/v2-demo/format';

const { exact, quickPicks } = CREDITS.topUp;
const toCredits = (eurCents: number) => eurCents / CREDITS.eurCentsPerCredit;
const euros = (eurCents: number) => formatEurCents(eurCents, { trimZeros: true });

/**
 * "Top up" on /credits (WEB-V2-SPEC §4.8, CREDITS-MODEL §4): quick picks, an exact
 * amount from €10 to €100 in €5 steps, the 2,000 bought-credit cap, and the
 * 14-day refund of unspent top-up credits. Every action goes through DemoConfirm
 * and only changes this browser's demo wallet.
 */
export default function TopUpPanel() {
  const { wallet } = useWallet();
  const toast = useToast();
  const [amountEur, setAmountEur] = useState(quickPicks[0].eurCents / 100);
  const [confirmTopUp, setConfirmTopUp] = useState(false);
  const [refundLot, setRefundLot] = useState<BoughtLot | null>(null);

  const eurCents = amountEur * 100;
  const credits = toCredits(eurCents);
  // The stepper takes any typed value and snaps it on blur, so an amount can be briefly off-step.
  const amountError = topUpError(wallet, eurCents);
  const overCap = amountError === 'over_cap';
  const refundable = refundableLots(wallet);

  const onTopUp = () => {
    setConfirmTopUp(false);
    const result = addTopUp(eurCents);
    if (result.ok) toast.show(`Demo: ${formatCredits(credits)} added to the Bought wallet.`);
    else toast.show(result.error === 'over_cap' ? `Demo: ${CHECKOUT_COPY.boughtCap}` : 'Demo: nothing was added.');
  };

  const onRefund = () => {
    if (!refundLot) return;
    const { lot_id: lotId, remaining } = refundLot;
    setRefundLot(null);
    const result = refundTopUpLot(lotId);
    toast.show(result.ok ? `Demo: ${formatCredits(remaining)} refunded.` : 'Demo: this top-up can no longer be refunded.');
  };

  return (
    <section id="top-up" aria-labelledby="top-up-heading" className="scroll-mt-24">
      <h2 id="top-up-heading" className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Top up
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Quick picks">
        {quickPicks.map((pick) => {
          const selected = pick.eurCents === eurCents;
          return (
            <button
              key={pick.eurCents}
              type="button"
              aria-pressed={selected}
              onClick={() => setAmountEur(pick.eurCents / 100)}
              className={`rounded-md border p-4 text-left ${
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-canvas hover:border-line-strong'
              }`}
            >
              <span className="block text-base font-semibold tabular-nums text-ink">
                {pick.credits} credits · {euros(pick.eurCents)}
              </span>
              <span className="mt-1 block text-sm text-ink-muted">€0.10 per credit, no bonus</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <StepperField
          id="top-up-exact"
          label="Exact amount"
          value={amountEur}
          onValueChange={setAmountEur}
          min={exact.minEurCents / 100}
          max={exact.maxEurCents / 100}
          step={exact.stepEurCents / 100}
          prefix="€"
          addon={`= ${formatCredits(credits)}`}
        />
        <Button
          onClick={() => setConfirmTopUp(true)}
          disabled={amountError !== null}
          disabledReason={overCap ? CHECKOUT_COPY.boughtCap : undefined}
        >
          Add to demo wallet
        </Button>
      </div>
      {overCap && <p className="mt-3 text-sm text-tone-warning">{CHECKOUT_COPY.boughtCap}</p>}

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-muted">
        Anyone can top up, Free accounts included. You&rsquo;ll need a verified email, to be 18 or over, and a card
        that passes 3&#8209;D Secure. Prices include VAT.
      </p>

      {refundable.length > 0 && (
        <ul className="mt-6 divide-y divide-line rounded-md border border-line">
          {refundable.map((lot) => (
            <li key={lot.lot_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-ink">
                {fill(WALLET_COPY.refundHint, { n: lot.remaining, date: formatDate(lot.refundable_until) })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setRefundLot(lot)} className="-ml-4 self-start sm:ml-0 sm:self-auto">
                Refund unspent credits (demo)
              </Button>
            </li>
          ))}
        </ul>
      )}

      <DemoConfirm
        open={confirmTopUp}
        onClose={() => setConfirmTopUp(false)}
        onConfirm={onTopUp}
        title={`Top up ${euros(eurCents)}?`}
        body={`Demo top-up: no payment is taken. ${credits} demo credits are added to the Bought wallet in this browser, refundable for 14 days.`}
        confirmLabel="Add"
      />

      <DemoConfirm
        open={refundLot !== null}
        onClose={() => setRefundLot(null)}
        onConfirm={onRefund}
        title="Refund unspent credits?"
        body={
          refundLot
            ? `Demo: ${refundLot.remaining} unspent credits leave the Bought wallet, and ${formatEurCents(
                refundLot.remaining * CREDITS.eurCentsPerCredit,
              )} would go back to the card. No money moves.`
            : ''
        }
        confirmLabel="Refund"
      />
    </section>
  );
}
