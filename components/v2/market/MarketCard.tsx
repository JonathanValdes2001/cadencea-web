import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import CoverArt from '@/components/ui/CoverArt';
import PreviewPlayer from '@/components/ui/PreviewPlayer';
import Price from '@/components/ui/Price';
import { RELEASE_TYPE_LABEL } from '@/lib/v2-demo/categories';
import { CARD_COPY } from '@/lib/v2-demo/market/copy';
import { cardMeta, fromEurCents, playerTuning, priceTerms, sellerName } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';

/**
 * A Market listing in a grid (WEB-V2-SPEC §4.2). The title link stretches over
 * the whole card; the preview button sits beside it, never inside it, and shows
 * on hover, on keyboard focus and always on touch screens. Below 200px of card
 * width the tags drop and the price moves under the title.
 */
export default function MarketCard({
  listing,
  featured = false,
  headingLevel = 'h3',
}: {
  listing: MarketListing;
  /** The large editorial card: bigger title and a line of description. */
  featured?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  const terms = priceTerms(listing);
  const from = fromEurCents(listing.leaseTiers);

  return (
    <article className="@container group relative flex h-full flex-col overflow-hidden rounded-md border border-line bg-canvas hover-lift hover:border-line-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent">
      <div className="relative">
        <CoverArt
          seed={listing.coverSeed}
          kind={listing.type}
          palette={listing.cover.palette}
          motif={listing.cover.motif}
          title={listing.title}
          decorative
          rounded="none"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-3">
          <Badge tone="dark">{RELEASE_TYPE_LABEL[listing.type]}</Badge>
          {listing.demoRelease && <Badge tone="demo">{CARD_COPY.demoRelease}</Badge>}
        </div>
        {listing.type !== 'theme' && (
          <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            <PreviewPlayer
              compact
              seed={listing.coverSeed}
              {...playerTuning(listing.bpm, listing.key)}
              kind={listing.type}
              title={listing.title}
            />
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-1.5 ${featured ? 'p-5' : 'p-4'}`}>
        <p className="order-1 truncate text-xs text-ink-subtle">{sellerName(listing.sellerHandle)}</p>
        <Heading
          className={`order-2 line-clamp-2 font-semibold tracking-tight text-ink ${
            featured ? 'text-lg md:text-xl' : 'text-base'
          }`}
        >
          <Link
            href={listing.href}
            title={listing.title}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {listing.title}
          </Link>
        </Heading>
        {featured && listing.description && (
          <p className="order-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">{listing.description}</p>
        )}
        <p className="order-5 text-xs text-ink-muted tabular-nums @min-[200px]:order-4">{cardMeta(listing).join(' · ')}</p>
        {listing.tags.length > 0 && (
          <ul aria-label="Tags" className="order-6 hidden flex-wrap gap-1.5 @min-[200px]:order-5 @min-[200px]:flex">
            {listing.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="rounded-sm bg-elevated px-2 py-0.5 text-xs text-ink-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="order-4 flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 @min-[200px]:order-6 @min-[200px]:mt-auto @min-[200px]:pt-3">
          <Price price={listing.price} fromEurCents={from ?? undefined} splitTerms={terms} size="sm" />
          {terms && <Badge tone="warning">{CARD_COPY.royaltySplit}</Badge>}
        </div>
      </div>
    </article>
  );
}
