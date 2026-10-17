import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parkedRoutesOpen } from '@/lib/parked-features.mjs';
import { CATEGORY_BY_KEY, isCategoryKey } from '@/lib/v2-demo/categories';
import { getItem } from '@/lib/v2-demo/market/items';
import { seedListing } from '@/lib/v2-demo/market/resolve';
import ItemView from '@/components/v2/market/ItemView';
import MarketBrowser from '@/components/v2/market/MarketBrowser';

type Props = { params: Promise<{ slug: string }> };

// One dynamic segment serves both kinds of page (WEB-V2-SPEC §1.1): a category
// key first, then an item slug, then a 404. No item slug equals a category key.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!parkedRoutesOpen()) notFound();
  const { slug } = await params;
  if (isCategoryKey(slug)) return { title: `${CATEGORY_BY_KEY[slug].label} · Market (preview)` };
  const listing = seedListing(slug);
  if (!listing) notFound();
  return { title: listing.title, description: listing.description || undefined };
}

export default async function MarketSlugPage({ params }: Props) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!parkedRoutesOpen()) notFound();
  const { slug } = await params;

  if (isCategoryKey(slug)) {
    const category = CATEGORY_BY_KEY[slug];
    return (
      <Suspense>
        <MarketBrowser category={category.key} title={category.label} />
      </Suspense>
    );
  }

  if (!getItem(slug)) notFound();
  return <ItemView slug={slug} />;
}
