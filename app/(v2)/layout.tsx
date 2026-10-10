import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import DemoNotice from '@/components/v2/common/DemoNotice';

// Every v2 route (market, publish, studio, credits, stream) exists only on
// preview deployments. On production this layout 404s, even if this branch is
// merged early. Next renders a segment's page in parallel with its layout, so
// every v2 page (and generateMetadata) repeats the same check to keep its own
// content out of the 404 response.
export default function V2Layout({ children }: { children: React.ReactNode }) {
  if (!isPreviewSite()) notFound();
  return (
    <>
      <DemoNotice />
      {children}
    </>
  );
}
