import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { chipClass } from '@/components/ui/Chip';
import CoverArt from '@/components/ui/CoverArt';
import PreviewPlayer from '@/components/ui/PreviewPlayer';
import Price from '@/components/ui/Price';
import { RELEASE_TYPE_LABEL } from '@/lib/v2-demo/categories';
import { waveformBars } from '@/lib/v2-demo/cover';
import { CATEGORY_TINT } from '@/lib/v2-demo/market/browse';
import { BROWSE_COPY, CARD_COPY } from '@/lib/v2-demo/market/copy';
import {
  bpmLabel,
  cardMeta,
  fromEurCents,
  keyLabel,
  playerTuning,
  priceTerms,
  rowDetail,
  sellerName,
} from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';

const WAVEFORM_BARS = 36;

/**
 * Columns by width: art, play and title always; price from sm; BPM and key
 * from md; the waveform and contents from lg (WEB-V2-SPEC §3.6: no sideways
 * page scroll at 360px). The header row uses the same template.
 */
const COLUMNS =
  'grid-cols-[3rem_2.75rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_2.75rem_minmax(0,1fr)_11rem] md:grid-cols-[3.5rem_2.75rem_minmax(0,1fr)_4rem_6.5rem_11rem] lg:grid-cols-[3.5rem_2.75rem_minmax(0,1fr)_8rem_4rem_6.5rem_8.5rem_12rem]';

function Waveform({ seed }: { seed: string }) {
  const bars = waveformBars(seed, WAVEFORM_BARS);
  return (
    <svg
      viewBox={`0 0 ${WAVEFORM_BARS * 4} 32`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="h-7 w-full text-line-strong group-hover:text-[var(--tint)]"
    >
      {bars.map((h, i) => (
        <rect key={i} x={i * 4} y={16 - h * 14} width="2.5" height={h * 28} rx="1" fill="currentColor" />
      ))}
    </svg>
  );
}

function RowPrice({ listing }: { listing: MarketListing }) {
  const terms = priceTerms(listing);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Price price={listing.price} fromEurCents={fromEurCents(listing.leaseTiers) ?? undefined} splitTerms={terms} size="sm" />
      {terms && <Badge tone="warning">{CARD_COPY.royaltySplit}</Badge>}
    </div>
  );
}

/**
 * One listing as a row (the Splice sample row): art, preview, title with the
 * seller and tags, a waveform, BPM, key, contents and price. Like MarketCard,
 * the title link stretches over the row and the preview button sits beside it.
 */
function MarketRow({ listing, showType }: { listing: MarketListing; showType: boolean }) {
  const detail = rowDetail(listing);
  const tint = CATEGORY_TINT[listing.category].solid;
  const hasPlayer = listing.type !== 'theme';
  const byline = [showType ? RELEASE_TYPE_LABEL[listing.type] : null, sellerName(listing.sellerHandle)].filter(Boolean).join(' · ');

  return (
    <article
      style={{ '--tint': tint } as React.CSSProperties}
      className={`group relative grid items-center gap-x-3 px-2 py-2.5 hover:bg-elevated has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-accent sm:gap-x-4 sm:px-3 ${COLUMNS}`}
    >
      <CoverArt
        seed={listing.coverSeed}
        kind={listing.type}
        palette={listing.cover.palette}
        motif={listing.cover.motif}
        decorative
        rounded="sm"
      />
      <div className="relative z-10 flex items-center justify-center">
        {hasPlayer && (
          <PreviewPlayer
            compact
            seed={listing.coverSeed}
            {...playerTuning(listing.bpm, listing.key)}
            kind={listing.type}
            title={listing.title}
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-ink md:text-base">
            <Link
              href={listing.href}
              title={listing.title}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {listing.title}
            </Link>
          </h3>
          {listing.demoRelease && <Badge tone="demo">{CARD_COPY.demoRelease}</Badge>}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <p className="max-w-full shrink-0 truncate text-xs text-ink-subtle">{byline}</p>
          {listing.tags.length > 0 && (
            <ul aria-label="Tags" className="hidden min-w-0 gap-1 overflow-hidden lg:flex">
              {listing.tags.slice(0, 3).map((tag) => (
                <li key={tag} className={`${chipClass('tag')} whitespace-nowrap`}>
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Below md the BPM, key and contents columns fold into one line; below sm the price joins them. */}
        <p className="mt-0.5 truncate text-xs text-ink-muted tabular-nums md:hidden">{cardMeta(listing).join(' · ')}</p>
        <div className="mt-1 sm:hidden">
          <RowPrice listing={listing} />
        </div>
      </div>

      <div className="hidden px-1 lg:block">{hasPlayer && <Waveform seed={listing.coverSeed} />}</div>
      <p className="hidden text-sm text-ink tabular-nums md:block">
        <span className="sr-only">{BROWSE_COPY.listColumns.bpm}: </span>
        {bpmLabel(listing.bpm)}
      </p>
      <p className="hidden truncate text-sm text-ink md:block">
        <span className="sr-only">{BROWSE_COPY.listColumns.key}: </span>
        {keyLabel(listing.key)}
      </p>
      <p className="hidden truncate text-sm text-ink-muted tabular-nums lg:block">
        <span className="sr-only">{BROWSE_COPY.listColumns.contents}: </span>
        {detail ?? '—'}
      </p>
      <div className="hidden sm:block">
        <RowPrice listing={listing} />
      </div>
    </article>
  );
}

/** Listings as rows under a column header (WEB-V2-SPEC §4.3 list view). */
export default function MarketList({
  listings,
  showType = false,
  className = '',
}: {
  listings: readonly MarketListing[];
  /** "All results" mixes categories, so each row names its type. */
  showType?: boolean;
  className?: string;
}) {
  const c = BROWSE_COPY.listColumns;
  return (
    <div className={className}>
      <div
        aria-hidden="true"
        className={`hidden items-end gap-x-4 border-b border-line px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-subtle md:grid ${COLUMNS}`}
      >
        <span />
        <span />
        <span>{c.title}</span>
        <span className="hidden lg:block" />
        <span>{c.bpm}</span>
        <span>{c.key}</span>
        <span className="hidden lg:block">{c.contents}</span>
        <span>{c.price}</span>
      </div>
      <ul className="divide-y divide-line border-b border-line">
        {listings.map((listing) => (
          <li key={listing.releaseId ?? listing.slug}>
            <MarketRow listing={listing} showType={showType} />
          </li>
        ))}
      </ul>
    </div>
  );
}
