import { notFound } from 'next/navigation';
import { parkedRoutesOpen } from '@/lib/parked-features.mjs';
import DemoNotice from '@/components/v2/common/DemoNotice';

// Every route in this group (market, publish, studio, credits, stream) is parked
// (docs/v2/README.md "Hidden, not deleted"). parkedRoutesOpen() is true only
// when the v2 preview gate is open AND the PARKED_FEATURES_OPEN switch is on, so
// today every route here answers 404, on previews and on production, even if the
// v2 gate opens at launch. middleware.ts blocks the same paths before they render.
// Next renders a segment's page in parallel with its layout, so every page (and
// generateMetadata) repeats the same check to keep its own content out of the
// 404 response.
export default function V2Layout({ children }: { children: React.ReactNode }) {
  if (!parkedRoutesOpen()) notFound();
  return (
    <>
      <DemoNotice />
      {children}
    </>
  );
}
