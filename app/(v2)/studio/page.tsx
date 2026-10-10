import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import StudioDashboard from '@/components/v2/studio/StudioDashboard';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Studio (preview)' };
}

// Server shell (WEB-V2-SPEC §4.7): the dashboard is a client component that
// reads the browser's demo store. `demo` turns on the Demo reviewer's
// auto-approve timer, and is computed here, never in client code (§2.1).
export default function StudioPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  return (
    <Suspense>
      <StudioDashboard demo={isPreviewSite()} />
    </Suspense>
  );
}
