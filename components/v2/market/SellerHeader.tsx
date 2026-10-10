import React from 'react';
import Badge from '@/components/ui/Badge';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import { fill, formatMonthYear } from '@/lib/v2-demo/format';
import { SELLER_COPY } from '@/lib/v2-demo/market/copy';
import { genreLabel } from '@/lib/v2-demo/market/display';
import type { Seller } from '@/lib/v2-demo/sellers';
import { SellerReleaseCount } from './SellerCatalog';

/**
 * The seller band on the showroom surface (WEB-V2-SPEC §4.5): no follower,
 * sales or play counts. Cadencea Originals has no location.
 */
export default function SellerHeader({ seller }: { seller: Seller }) {
  return (
    <header className="on-dark relative isolate overflow-hidden bg-showroom py-14 text-dark-text lg:py-20">
      <ShowroomGlow />
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-24 shrink-0">
          <CoverArt seed={seller.handle} kind="avatar" title={seller.displayName} decorative rounded="full" />
        </div>
        <div className="min-w-0 max-w-3xl">
          <Badge tone="brand">{SELLER_COPY.reviewed}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{seller.displayName}</h1>
          <p className="mt-2 text-sm text-dark-muted">
            @{seller.handle}
            {seller.location && <> · {seller.location}</>}
          </p>
          <p className="mt-5 text-base leading-relaxed text-dark-muted">{seller.bio}</p>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark-muted tabular-nums">
            <span>{fill(SELLER_COPY.sellingSince, { date: formatMonthYear(seller.sellingSince) })}</span>
            <span aria-hidden="true">·</span>
            <span>
              <SellerReleaseCount handle={seller.handle} />
            </span>
          </p>
          {seller.genres.length > 0 && (
            <ul aria-label={SELLER_COPY.genresLabel} className="mt-5 flex flex-wrap gap-2">
              {seller.genres.map((genre) => (
                <li key={genre} className="rounded-sm border border-white/20 px-2.5 py-1 text-xs text-dark-text">
                  {genreLabel(genre.toLowerCase())}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </header>
  );
}
