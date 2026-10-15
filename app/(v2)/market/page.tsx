import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parkedRoutesOpen } from '@/lib/parked-features.mjs';
import { MARKET_HOME_COPY } from '@/lib/v2-demo/market/copy';
import { FILTER_PARAM_KEYS } from '@/lib/v2-demo/market/queries';
import HowItWorks from '@/components/v2/market/HowItWorks';
import MarketBrowser from '@/components/v2/market/MarketBrowser';
import MarketHero from '@/components/v2/market/MarketHero';
import MarketLanding from '@/components/v2/market/MarketLanding';
import SplitsExplainer from '@/components/v2/market/SplitsExplainer';

export async function generateMetadata(): Promise<Metadata> {
  if (!parkedRoutesOpen()) notFound();
  return { title: 'Market (preview)' };
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!parkedRoutesOpen()) notFound();
  const params = await searchParams;

  // A search or filter in the URL (the hero search submits ?q=) shows "All results" (WEB-V2-SPEC §4.2).
  if (FILTER_PARAM_KEYS.some((key) => params[key] !== undefined)) {
    return (
      <Suspense>
        <MarketBrowser
          category={null}
          title={MARKET_HOME_COPY.allResultsTitle}
          lead={MARKET_HOME_COPY.allResultsLead}
        />
      </Suspense>
    );
  }

  return (
    <>
      <MarketHero />
      <MarketLanding />
      <SplitsExplainer />
      <HowItWorks />
    </>
  );
}
