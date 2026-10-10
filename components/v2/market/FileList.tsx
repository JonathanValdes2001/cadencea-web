'use client';

import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Check } from '@/components/ui/Icons';
import PreviewPlayer from '@/components/ui/PreviewPlayer';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import { ownedEntry } from '@/lib/v2-demo/credits/library-seed';
import { buyWithCredits, useMarketLibrary, useWallet } from '@/lib/v2-demo/credits/store';
import { previewSpend } from '@/lib/v2-demo/credits/wallet';
import { fill, formatCreditPrice, formatDuration, formatKey } from '@/lib/v2-demo/format';
import { ITEM_COPY, RESULT_COPY } from '@/lib/v2-demo/market/copy';
import { isFirstParty, playerTuning, purchaseItemFor, singleFileCredits } from '@/lib/v2-demo/market/display';
import type { MarketFile, MarketListing } from '@/lib/v2-demo/market/types';
import { isOwnListing, OwnListingNote } from './BuyNotes';

const FIRST_ROWS = 12;
const ANCHOR_PREFIX = '#file-';

function fileMeta(file: MarketFile): string {
  return [
    file.durationMs !== null ? formatDuration(file.durationMs) : null,
    file.bpm !== null ? `${file.bpm} BPM` : null,
    file.key !== undefined ? formatKey(file.key) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * A pack's contents (WEB-V2-SPEC §4.4): name, length, BPM and key, a preview
 * per file and, for sample, preset and MIDI packs, single-file purchases at the
 * fixed CREDITS-MODEL §6.1 price. Each row has an anchor (`#file-{id}`); a link
 * to a row past the first 12 opens the full list.
 */
export default function FileList({ listing, files }: { listing: MarketListing; files: readonly MarketFile[] }) {
  const toast = useToast();
  const { wallet } = useWallet();
  const library = useMarketLibrary();
  const [showAll, setShowAll] = useState(false);
  const [buying, setBuying] = useState<MarketFile | null>(null);

  const followedHash = useRef(false);

  useEffect(() => {
    if (followedHash.current || !window.location.hash.startsWith(ANCHOR_PREFIX)) return;
    followedHash.current = true;
    const id = decodeURIComponent(window.location.hash.slice(ANCHOR_PREFIX.length));
    if (files.findIndex((f) => f.id === id) >= FIRST_ROWS) setShowAll(true);
    // The row may only exist after this render, so scroll once it has painted.
    requestAnimationFrame(() => document.getElementById(`file-${id}`)?.scrollIntoView({ block: 'center' }));
  }, [files]);

  if (!files.length) return null;

  const packOwned = ownedEntry(library, listing.slug) !== null;
  const sellsFiles = !packOwned && files.some((f) => singleFileCredits(listing.type, f) !== null);
  const firstParty = isFirstParty(listing.sellerHandle);
  const visible = showAll ? files : files.slice(0, FIRST_ROWS);
  const buyingCredits = buying ? (singleFileCredits(listing.type, buying) ?? 0) : 0;
  const plan = previewSpend(wallet, buyingCredits, { firstParty });

  const buy = () => {
    if (!buying) return;
    const file = buying;
    setBuying(null);
    const result = buyWithCredits({
      slug: listing.slug,
      fileId: file.id,
      title: file.name,
      releaseId: listing.releaseId,
      version: listing.version,
      credits: buyingCredits,
      item: purchaseItemFor(listing, file),
    });
    toast.show(
      result.ok
        ? fill(ITEM_COPY.boughtToast, { title: file.name })
        : (RESULT_COPY[result.error] ?? RESULT_COPY.fallback),
    );
  };

  return (
    <section aria-labelledby="pack-contents" className="mt-10">
      <h2 id="pack-contents" className="text-lg font-semibold tracking-tight text-ink">
        {ITEM_COPY.contents}
      </h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {visible.map((file) => {
          const credits = singleFileCredits(listing.type, file);
          const fileOwned = ownedEntry(library, listing.slug, file.id) !== null;
          const short = credits !== null && previewSpend(wallet, credits, { firstParty }).shortfall > 0;
          return (
            <li
              key={file.id}
              id={`file-${file.id}`}
              className="flex scroll-mt-32 flex-wrap items-center gap-x-3 gap-y-2 py-3 target:bg-brand-50"
            >
              <PreviewPlayer
                compact
                seed={`${listing.slug}/${file.id}`}
                {...playerTuning(file.bpm, file.key)}
                kind={listing.type}
                bars={2}
                title={file.name}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-ink-subtle tabular-nums">{fileMeta(file)}</p>
              </div>
              {sellsFiles && credits !== null && (
                <div className="w-full pl-10 sm:w-auto sm:pl-0">
                  {fileOwned ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                      <Check size={16} className="text-tone-success" />
                      {ITEM_COPY.fileOwned}
                    </span>
                  ) : short ? (
                    <Button href="/credits#top-up" variant="ghost" size="sm">
                      {ITEM_COPY.topUp}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBuying(file)}
                      aria-label={`${fill(ITEM_COPY.buyFile, { price: formatCreditPrice(credits) })}: ${file.name}`}
                    >
                      {fill(ITEM_COPY.buyFile, { price: formatCreditPrice(credits) })}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!showAll && files.length > FIRST_ROWS && (
        <Button variant="secondary" className="mt-4" onClick={() => setShowAll(true)}>
          {fill(ITEM_COPY.showAllFiles, { n: files.length })}
        </Button>
      )}

      {sellsFiles && (
        <DemoConfirm
          open={buying !== null}
          onClose={() => setBuying(null)}
          onConfirm={buy}
          title={fill(ITEM_COPY.buyFileTitle, { title: buying?.name ?? '' })}
          body={fill(buyingCredits === 1 ? ITEM_COPY.buyBodyOne : ITEM_COPY.buyBody, {
            credits: buyingCredits,
            i: plan.included,
            b: plan.bought,
          })}
          confirmLabel={ITEM_COPY.buyConfirm}
        >
          {isOwnListing(listing) && <OwnListingNote />}
        </DemoConfirm>
      )}
    </section>
  );
}
