'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Tabs, { tabIds } from '@/components/ui/Tabs';
import { useMarketLibrary, useWallet } from '@/lib/v2-demo/credits/store';
import type { LedgerEntry } from '@/lib/v2-demo/credits/types';
import { formatDate, formatEurCents } from '@/lib/v2-demo/format';
import { LEDGER_TABS, inLedgerTab, signedCredits, walletLabel, type LedgerTab } from './ledger-view';

const ID_PREFIX = 'ledger';

function signedEur(cents: number): string {
  return cents > 0 ? `+${formatEurCents(cents)}` : formatEurCents(cents);
}

function What({ entry, href }: { entry: LedgerEntry; href: string | null }) {
  return href ? (
    <Link href={href} className="font-medium text-accent-ink hover:text-accent-hover hover:underline">
      {entry.memo}
    </Link>
  ) : (
    <span className="font-medium text-ink">{entry.memo}</span>
  );
}

function Change({ entry }: { entry: LedgerEntry }) {
  return (
    <>
      <span className={`block font-semibold tabular-nums ${entry.credits > 0 ? 'text-price' : 'text-ink'}`}>
        {signedCredits(entry.credits)}
      </span>
      <span className="block text-xs tabular-nums text-ink-muted">{signedEur(entry.eur_cents)}</span>
    </>
  );
}

/** Both buckets, labelled and keyed to the Total card's bar colors (WalletBar). */
function BalanceAfter({ entry }: { entry: LedgerEntry }) {
  const { included, bought } = entry.balance_after;
  return (
    <span className="inline-flex flex-wrap justify-end gap-x-3 gap-y-0.5 tabular-nums">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-brand-700" />
        {included} included
      </span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-brand-400" />
        {bought} bought
      </span>
    </span>
  );
}

/**
 * The /credits history (WEB-V2-SPEC §4.8): every CREDITS-MODEL §10 ledger entry,
 * newest first, filtered by tab. A table from md, cards below. Purchases link to
 * their Market item (a single file to its anchor in the pack).
 */
export default function LedgerTable() {
  const { wallet } = useWallet();
  const library = useMarketLibrary();
  const [tab, setTab] = useState<LedgerTab>('all');
  const { tabId, panelId } = tabIds(ID_PREFIX, tab);

  const itemHref = useMemo(() => {
    const hrefs = new Map<string, string>();
    for (const entry of library.entries) {
      if (!entry.purchaseLedgerId) continue;
      hrefs.set(entry.purchaseLedgerId, `/market/${entry.slug}${entry.fileId ? `#file-${entry.fileId}` : ''}`);
    }
    return (entry: LedgerEntry) => (entry.type === 'purchase' ? hrefs.get(entry.id) ?? null : null);
  }, [library]);

  const rows = useMemo(
    () => wallet.ledger.filter((entry) => inLedgerTab(entry, tab)).reverse(),
    [wallet.ledger, tab],
  );

  return (
    <section id="history" aria-labelledby="history-heading" className="scroll-mt-24">
      <h2 id="history-heading" className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
        History
      </h2>
      <Tabs
        className="mt-6"
        items={LEDGER_TABS}
        value={tab}
        onChange={(id) => setTab(id as LedgerTab)}
        label="Filter the history"
        idPrefix={ID_PREFIX}
      />

      <div role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={0} className="mt-4">
        <table className="hidden w-full border-collapse text-left text-sm md:table">
          <thead>
            <tr className="border-b border-line-strong text-xs uppercase tracking-widest text-ink-subtle">
              <th scope="col" className="py-3 pr-4 font-semibold">Date</th>
              <th scope="col" className="py-3 pr-4 font-semibold">What</th>
              <th scope="col" className="py-3 pr-4 font-semibold">Wallet</th>
              <th scope="col" className="py-3 pr-4 text-right font-semibold">Change</th>
              <th scope="col" className="py-3 text-right font-semibold">Balance after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((entry) => {
              const walletCell = walletLabel(entry);
              return (
                <tr key={entry.id} className="align-top">
                  <td className="whitespace-nowrap py-3 pr-4 tabular-nums text-ink-muted">{formatDate(entry.at)}</td>
                  <td className="py-3 pr-4">
                    <What entry={entry} href={itemHref(entry)} />
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">
                    {walletCell.label}
                    {walletCell.detail && <span className="block text-xs tabular-nums">{walletCell.detail}</span>}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Change entry={entry} />
                  </td>
                  <td className="py-3 text-right text-ink-muted">
                    <BalanceAfter entry={entry} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <ul className="divide-y divide-line border-y border-line md:hidden">
          {rows.map((entry) => {
            const walletCell = walletLabel(entry);
            return (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <What entry={entry} href={itemHref(entry)} />
                  <p className="mt-1 text-xs text-ink-muted">
                    {formatDate(entry.at)} · {walletCell.label}
                    {walletCell.detail && ` (${walletCell.detail})`}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Balance after <BalanceAfter entry={entry} />
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Change entry={entry} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
