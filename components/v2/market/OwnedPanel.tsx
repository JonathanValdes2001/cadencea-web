'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { CheckboxField } from '@/components/ui/Field';
import { Check, Download } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { CHECKOUT_COPY } from '@/lib/v2-demo/credits/copy';
import type { LibraryEntry } from '@/lib/v2-demo/credits/library-seed';
import { markDownloaded, returnPurchase, useWallet } from '@/lib/v2-demo/credits/store';
import { returnError } from '@/lib/v2-demo/credits/wallet';
import { fill } from '@/lib/v2-demo/format';
import { ITEM_COPY, RESULT_COPY } from '@/lib/v2-demo/market/copy';
import { leaseLabel } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { PUBLIC_COPY } from '@/lib/v2-demo/release-lifecycle/copy';

/**
 * What an owner sees in the buy box (WEB-V2-SPEC §4.4, RELEASE-LIFECYCLE §6.7):
 * the version they own, the newer live version that comes with it, downloads
 * behind the §22 checkbox until the first one, and "Return it (demo)" while a
 * credit purchase hasn't been downloaded.
 */
export default function OwnedPanel({ listing, entry }: { listing: MarketListing; entry: LibraryEntry }) {
  const toast = useToast();
  const { wallet } = useWallet();
  const [consent, setConsent] = useState(false);
  const [downloadVersion, setDownloadVersion] = useState<number | null>(null);
  const [returning, setReturning] = useState(false);

  const owned = entry.version;
  const live = Math.max(listing.version, owned);
  // The first download ends the right to cancel, so it needs the active checkbox; a 0-credit pack has none to lose.
  const needsConsent = !entry.downloaded && entry.pricePaid.kind !== 'free';
  const blocked = needsConsent && !consent;

  const purchase = entry.purchaseLedgerId ? wallet.ledger.find((e) => e.id === entry.purchaseLedgerId) : undefined;
  const canReturn =
    entry.pricePaid.kind === 'credits' &&
    purchase !== undefined &&
    returnError(wallet, purchase.id, { downloaded: entry.downloaded }) === null;

  const download = () => {
    const version = downloadVersion ?? live;
    setDownloadVersion(null);
    if (!entry.downloaded) markDownloaded(entry.key);
    toast.show(fill(ITEM_COPY.downloadedToast, { k: version, title: listing.title }));
  };

  const confirmReturn = () => {
    setReturning(false);
    const result = returnPurchase(entry.key);
    toast.show(
      result.ok
        ? fill(ITEM_COPY.returnedToast, { title: listing.title })
        : (RESULT_COPY[result.error] ?? RESULT_COPY.fallback),
    );
  };

  return (
    <div>
      <p className="flex items-center gap-2 text-base font-semibold text-ink">
        <Check size={20} className="text-tone-success" />
        {fill(PUBLIC_COPY.youOwn, { k: owned })}
      </p>
      {entry.leaseTier && (
        <p className="mt-1 text-sm text-ink-muted">{fill(ITEM_COPY.ownedTier, { tier: leaseLabel(entry.leaseTier) })}</p>
      )}
      {live > owned && <p className="mt-1 text-sm text-ink-muted">{fill(PUBLIC_COPY.versionIncluded, { n: live })}</p>}

      {needsConsent && (
        <CheckboxField
          id="market-download-consent"
          label={CHECKOUT_COPY.downloadConsent}
          checked={consent}
          onChange={(e) => setConsent(e.currentTarget.checked)}
          className="mt-4"
        />
      )}
      <Button
        fullWidth
        className="mt-4"
        iconLeft={<Download size={16} />}
        disabled={blocked}
        onClick={() => setDownloadVersion(live)}
      >
        {fill(PUBLIC_COPY.downloadVersion, { k: live })}
      </Button>
      {live > owned && (
        <button
          type="button"
          disabled={blocked}
          onClick={() => setDownloadVersion(owned)}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {fill(PUBLIC_COPY.downloadVersion, { k: owned })}
        </button>
      )}

      {canReturn && (
        <div className="mt-4 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setReturning(true)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:text-accent-hover"
          >
            {ITEM_COPY.returnButton}
          </button>
          <p className="text-xs text-ink-subtle">{ITEM_COPY.returnNote}</p>
        </div>
      )}

      <DemoConfirm
        open={downloadVersion !== null}
        onClose={() => setDownloadVersion(null)}
        onConfirm={download}
        title={fill(ITEM_COPY.downloadTitle, { k: downloadVersion ?? live, title: listing.title })}
        body={entry.downloaded ? ITEM_COPY.downloadBodyAgain : ITEM_COPY.downloadBodyFirst}
        confirmLabel={ITEM_COPY.downloadConfirm}
      />
      {purchase && (
        <DemoConfirm
          open={returning}
          onClose={() => setReturning(false)}
          onConfirm={confirmReturn}
          title={fill(ITEM_COPY.returnTitle, { title: listing.title })}
          body={fill(ITEM_COPY.returnBody, {
            credits: -purchase.credits,
            i: -(purchase.split?.included ?? 0),
            b: -(purchase.split?.bought ?? 0),
          })}
          confirmLabel={ITEM_COPY.returnConfirm}
        />
      )}
    </div>
  );
}
