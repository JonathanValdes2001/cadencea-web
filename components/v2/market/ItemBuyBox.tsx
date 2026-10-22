'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { CheckboxField } from '@/components/ui/Field';
import Price from '@/components/ui/Price';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { CHECKOUT_COPY } from '@/lib/v2-demo/credits/copy';
import { ownedEntry } from '@/lib/v2-demo/credits/library-seed';
import { buyWithCredits, useMarketLibrary, useWallet } from '@/lib/v2-demo/credits/store';
import { previewSpend } from '@/lib/v2-demo/credits/wallet';
import { PALETTES } from '@/lib/v2-demo/cover';
import { creditsToEurCents, fill } from '@/lib/v2-demo/format';
import { ITEM_COPY, RESULT_COPY } from '@/lib/v2-demo/market/copy';
import {
  creditPrice,
  eurDigits,
  isFirstParty,
  priceTerms,
  purchaseItemFor,
  packPurchaseQuote,
} from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { SPLITS_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import BeatLicensePicker from './BeatLicensePicker';
import { isOwnListing, OwnListingNote, TopUpHint } from './BuyNotes';
import OwnedPanel from './OwnedPanel';
import SplitTermsPanel from './SplitTermsPanel';

/** Sample, preset, MIDI and Splits packs and themes: paid with credits (WEB-V2-SPEC §4.4). */
function CreditBuyBox({ listing }: { listing: MarketListing }) {
  const toast = useToast();
  const { wallet } = useWallet();
  const library = useMarketLibrary();
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const owned = ownedEntry(library, listing.slug);
  const quote = packPurchaseQuote(listing, library);
  const credits = quote.credits;
  const firstParty = isFirstParty(listing.sellerHandle);
  const plan = previewSpend(wallet, credits, { firstParty });
  const splits = listing.splitTerms;
  const eur = eurDigits(creditsToEurCents(credits));
  const palette = listing.type === 'theme' ? PALETTES[listing.cover.palette ?? 'violet'] : null;

  const buy = () => {
    setConfirming(false);
    const result = buyWithCredits({
      slug: listing.slug,
      title: listing.title,
      releaseId: listing.releaseId,
      version: listing.version,
      credits: creditPrice(listing.price) ?? 0,
      packFiles: quote.files,
      item: purchaseItemFor(listing),
      splitTerms: splits ?? undefined,
    });
    toast.show(
      result.ok
        ? fill(ITEM_COPY.boughtToast, { title: listing.title })
        : (RESULT_COPY[result.error] ?? RESULT_COPY.fallback),
    );
  };

  return (
    <div className="space-y-4">
      <Price price={listing.price.kind === 'credits' ? { kind: 'credits', credits } : listing.price} size="lg" splitTerms={priceTerms(listing)} />
      {!owned && quote.ownedCount > 0 && (
        <p className="text-sm text-ink-muted">
          You own {quote.ownedCount} {quote.ownedCount === 1 ? 'file' : 'files'}. {quote.priorCredits} credits from earlier purchases count toward this pack.
        </p>
      )}
      {palette && (
        <div>
          <ul aria-hidden="true" className="flex gap-2">
            {palette.map((color) => (
              <li
                key={color}
                title={color}
                style={{ backgroundColor: color }}
                className="h-8 w-8 rounded-sm border border-line"
              />
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink">{ITEM_COPY.themeVault}</p>
          <p className="mt-1 text-sm text-ink-muted">{ITEM_COPY.themeNote}</p>
        </div>
      )}
      {splits && <SplitTermsPanel listing={listing} />}

      {owned ? (
        <OwnedPanel listing={listing} entry={owned} />
      ) : (
        <>
          {splits && (
            <CheckboxField
              id="market-splits-ack"
              label={SPLITS_COPY.buyerAck}
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.currentTarget.checked)}
            />
          )}
          {plan.shortfall > 0 ? (
            <div>
              <Button href="/credits#top-up" fullWidth size="lg">
                {ITEM_COPY.topUp}
              </Button>
              <TopUpHint shortfall={plan.shortfall} />
            </div>
          ) : (
            <div>
              <Button fullWidth size="lg" disabled={Boolean(splits) && !acknowledged} onClick={() => setConfirming(true)}>
                {quote.ownedCount > 0 ? `Complete pack for ${credits} credits (€${eur})` : credits === 0 ? ITEM_COPY.getPack : fill(CHECKOUT_COPY.buyFor, { credits, eur })}
              </Button>
              {credits > 0 && (
                <p className="mt-2 text-sm text-ink-muted tabular-nums">
                  {fill(CHECKOUT_COPY.usesSplit, { i: plan.included, b: plan.bought, eur })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <DemoConfirm
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={buy}
        title={fill(credits === 0 ? ITEM_COPY.getTitle : ITEM_COPY.buyTitle, { title: listing.title })}
        body={
          credits === 0
            ? ITEM_COPY.getBody
            : fill(ITEM_COPY.buyBody, { credits, i: plan.included, b: plan.bought })
        }
        confirmLabel={credits === 0 ? ITEM_COPY.getConfirm : ITEM_COPY.buyConfirm}
      >
        {isOwnListing(listing) && <OwnListingNote />}
      </DemoConfirm>
    </div>
  );
}

/** The buy box (WEB-V2-SPEC §4.4 item 5), by how the listing is paid for. The Market sells no songs (D19). */
export default function ItemBuyBox({ listing }: { listing: MarketListing }) {
  if (listing.type === 'beat') return <BeatLicensePicker listing={listing} />;
  return <CreditBuyBox listing={listing} />;
}
