'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import PreviewPlayer from '@/components/ui/PreviewPlayer';
import { CATEGORY_BY_KEY, RELEASE_TYPE_LABEL } from '@/lib/v2-demo/categories';
import { fill } from '@/lib/v2-demo/format';
import { ITEM_COPY, MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { playerTuning, sellerName } from '@/lib/v2-demo/market/display';
import { listingFiles } from '@/lib/v2-demo/market/files';
import { itemsBySeller, similarItems } from '@/lib/v2-demo/market/queries';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { PUBLIC_COPY, SPLITS_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import Breadcrumb from './Breadcrumb';
import FileList from './FileList';
import HumanMadePanel from './HumanMadePanel';
import ItemBuyBox from './ItemBuyBox';
import ItemMeta from './ItemMeta';
import LicenseSummary from './LicenseSummary';
import MobileBuyBar from './MobileBuyBar';
import Rail from './Rail';
import ReportDialog from './ReportDialog';
import WhatsNew from './WhatsNew';
import { useMarketListings } from './useMarketListings';

const BUY_BOX_ID = 'buy';

/** "Sample packs" → "sample packs" mid-sentence; "MIDI packs" keeps its capitals. */
const inSentence = (label: string) => (/^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1));

/** A linked release that isn't public: suspended, unpublished or not released yet (WEB-V2-SPEC §4.4). */
function OffSale({ listing }: { listing: MarketListing }) {
  const category = CATEGORY_BY_KEY[listing.category];
  return (
    <Container className="py-16 lg:py-24">
      <Breadcrumb
        trail={[
          { label: ITEM_COPY.market, href: '/market' },
          { label: category.label, href: `/market/${category.key}` },
          { label: listing.title },
        ]}
      />
      <div className="mt-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{listing.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{PUBLIC_COPY.marketUnavailable}</p>
        <Button href={`/market/${category.key}`} variant="secondary" className="mt-8">
          {fill(ITEM_COPY.offSaleBack, { category: inSentence(category.label) })}
        </Button>
      </div>
    </Container>
  );
}

/**
 * The item page body (WEB-V2-SPEC §4.4). The server renders the seed state;
 * after hydration the lifecycle store's approved revision and Maya's wallet and
 * library take over, so a Studio approval or a purchase shows up here at once.
 */
export default function ItemView({ slug }: { slug: string }) {
  const listings = useMarketListings();
  const listing = listings.find((l) => l.slug === slug) ?? null;
  const files = useMemo(() => (listing ? listingFiles(listing) : []), [listing]);
  if (!listing) return null;
  if (!listing.isPublic) return <OffSale listing={listing} />;

  const category = CATEGORY_BY_KEY[listing.category];
  const seller = sellerName(listing.sellerHandle);
  const fromSeller = itemsBySeller(listing.sellerHandle, listings).filter((l) => l.slug !== listing.slug);
  const similar = similarItems(listing, listings);
  // The Human-Made Standard covers music and sounds; Cadencea's own Vault themes aren't reviewed against it.
  const humanMade = listing.type !== 'theme';

  return (
    <>
      <Container className="pb-28 pt-10 lg:pb-14 lg:pt-14">
        <Breadcrumb
          trail={[
            { label: ITEM_COPY.market, href: '/market' },
            { label: category.label, href: `/market/${category.key}` },
            { label: listing.title },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-0">
          {/* Without a contents list, the cover and player stay in view beside the long right column. */}
          <div
            className={`lg:col-span-5 lg:row-start-1 ${files.length ? '' : 'lg:sticky lg:top-24 lg:row-span-2 lg:self-start'}`}
          >
            <CoverArt
              seed={listing.coverSeed}
              kind={listing.type}
              palette={listing.cover.palette}
              motif={listing.cover.motif}
              title={listing.title}
            />
            {listing.type !== 'theme' && (
              <>
                <PreviewPlayer
                  className="mt-4"
                  seed={listing.coverSeed}
                  {...playerTuning(listing.bpm, listing.key)}
                  kind={listing.type}
                  title={listing.title}
                />
                <p className="mt-2 text-xs text-ink-subtle">{ITEM_COPY.previewFootnote}</p>
              </>
            )}
          </div>

          <div className="space-y-8 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{RELEASE_TYPE_LABEL[listing.type]}</Badge>
                {humanMade && <Badge tone="brand">{PUBLIC_COPY.humanMade}</Badge>}
                {listing.splitTerms && <Badge tone="warning">{SPLITS_COPY.badge}</Badge>}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{listing.title}</h1>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 shrink-0">
                  <CoverArt seed={listing.sellerHandle} kind="avatar" title={seller} decorative rounded="full" />
                </div>
                <p className="text-sm">
                  <span className="sr-only">{ITEM_COPY.sellerLabel}: </span>
                  <Link
                    href={`/market/u/${listing.sellerHandle}`}
                    className="font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    {seller}
                  </Link>
                  <span className="ml-2 text-ink-subtle">@{listing.sellerHandle}</span>
                </p>
              </div>
              {listing.description && (
                <p className="mt-6 text-base leading-relaxed text-ink-muted">{listing.description}</p>
              )}
            </div>

            <ItemMeta listing={listing} files={files} />

            {listing.tags.length > 0 && (
              <ul aria-label={ITEM_COPY.tagsLabel} className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/market/${category.key}?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex min-h-9 items-center rounded-sm border border-line px-3 text-sm text-ink-muted hover:border-line-strong hover:text-ink pointer-coarse:min-h-11"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Card padding="md">
              <section id={BUY_BOX_ID} tabIndex={-1} aria-labelledby="buy-box-title" className="scroll-mt-32">
                <h2 id="buy-box-title" className="sr-only">
                  {listing.type === 'song' ? ITEM_COPY.listenBoxLabel : ITEM_COPY.buyBoxLabel}
                </h2>
                <ItemBuyBox listing={listing} />
              </section>
            </Card>

            <LicenseSummary listing={listing} />
            {humanMade && <HumanMadePanel />}
            <WhatsNew listing={listing} />
            <ReportDialog title={listing.title} />
          </div>

          {files.length > 0 && (
            <div className="lg:col-span-5 lg:row-start-2">
              <FileList listing={listing} files={files} />
            </div>
          )}
        </div>

        <div className="mt-20 space-y-16">
          <Rail
            title={fill(ITEM_COPY.moreFrom, { seller })}
            listings={fromSeller}
            seeAll={{
              href: `/market/u/${listing.sellerHandle}`,
              label: fill(MARKET_HOME_COPY.seeAll, { n: fromSeller.length + 1 }),
            }}
          />
          <Rail title={ITEM_COPY.similar} listings={similar} />
        </div>
      </Container>
      <MobileBuyBar listing={listing} targetId={BUY_BOX_ID} />
    </>
  );
}
