'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { CREDITS } from '@/lib/v2-demo/credits/config';
import { PRICING_CREDITS, WALLET_COPY } from '@/lib/v2-demo/credits/copy';
import { useWallet } from '@/lib/v2-demo/credits/store';
import { nextGrantAmount, refundableLots, welcomeLot } from '@/lib/v2-demo/credits/wallet';
import { creditsToEurCents, fill, formatDate, formatEurCents } from '@/lib/v2-demo/format';
import WalletBar from './WalletBar';

const BOUGHT_CAP_LINE = `You can hold up to ${CREDITS.boughtCap.toLocaleString('en-US')} bought credits (${formatEurCents(
  creditsToEurCents(CREDITS.boughtCap),
  { trimZeros: true },
)}).`;

/** "28.90": the number inside "€{total_eur} at Market prices". */
function eurAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CardShell({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col rounded-md border border-line bg-canvas p-6">{children}</section>;
}

/**
 * The /credits balance row (WEB-V2-SPEC §4.8): Total, Included and Bought, with
 * the CREDITS-MODEL §9.3 hints. Stacked on mobile, three columns from md.
 */
export default function BalanceCards() {
  const { wallet, balances } = useWallet();
  const { plan } = wallet;
  const nextGrant = formatDate(plan.next_grant_at);
  const welcome = welcomeLot(wallet);
  const refundable = refundableLots(wallet);
  const planLine = PRICING_CREDITS.planLines[plan.id];
  // Unlimited rollover: the full monthly grant remains available.
  const grant = nextGrantAmount(wallet);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <CardShell>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Total</h2>
        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-credit">
          {fill(WALLET_COPY.balance, { total: balances.total.toLocaleString('en-US') })}
        </p>
        <p className="mt-1 text-sm tabular-nums text-ink-muted">
          {fill(WALLET_COPY.euroLine, { total_eur: eurAmount(balances.totalEurCents) })}
        </p>
        <div className="mt-6">
          <WalletBar included={balances.included} bought={balances.bought} />
        </div>
      </CardShell>

      <CardShell>
        <h2 className="text-base font-semibold tabular-nums text-ink">
          {fill(WALLET_COPY.includedRow, { included: balances.included.toLocaleString('en-US') })}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{WALLET_COPY.includedHint}</p>
        <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
          {plan.monthly_credits === 0 ? (
            <li>{WALLET_COPY.freePlan}</li>
          ) : (
            grant > 0 && <li>{fill(WALLET_COPY.nextGrant, { monthly: grant, date: nextGrant })}</li>
          )}
          {welcome?.expires_at && (
            <li>
              {fill(WALLET_COPY.welcomeHint, { n: welcome.remaining, date: formatDate(welcome.expires_at) })}
            </li>
          )}
        </ul>
        <p className="mt-5 border-t border-line pt-4 text-sm text-ink-muted">
          {plan.name} (demo): {planLine}{' '}
          <Link href="/pricing#credits" className="font-medium text-accent-ink hover:text-accent-hover">
            Compare plans
          </Link>
        </p>
      </CardShell>

      <CardShell>
        <h2 className="text-base font-semibold tabular-nums text-ink">
          {fill(WALLET_COPY.boughtRow, { bought: balances.bought.toLocaleString('en-US') })}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{WALLET_COPY.boughtHint}</p>
        <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
          {refundable.map((lot) => (
            <li key={lot.lot_id}>
              {fill(WALLET_COPY.refundHint, { n: lot.remaining, date: formatDate(lot.refundable_until) })}
            </li>
          ))}
          <li className="text-ink-muted">{BOUGHT_CAP_LINE}</li>
        </ul>
        <Button href="#top-up" variant="secondary" size="sm" className="mt-5 self-start" prefetch={false}>
          Top up
        </Button>
      </CardShell>
    </div>
  );
}
