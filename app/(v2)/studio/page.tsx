import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Studio (preview)' };
}

// Foundation stub. Package C replaces this page (docs/V2-WORK-PACKAGES.md).
export default function StudioPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  return (
    <Container className="py-10 lg:py-14">
      <EmptyState headingLevel="h1" title="Studio" body="Being built in this preview." />
    </Container>
  );
}
