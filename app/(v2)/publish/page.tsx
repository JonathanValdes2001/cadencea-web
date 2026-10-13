import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import PublishScreen from '@/components/v2/publish/PublishScreen';
import PublishWizard from '@/components/v2/publish/PublishWizard';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Publish (preview)' };
}

// PUBLISH-PROCEDURE §1–§3: the Publish window, starting at Type, or "Become a
// creator" until the creator profile is verified; the project shortcuts below.
export default function PublishPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  return (
    <PublishScreen shortcuts>
      <PublishWizard mode="new" type={null} projectId={null} />
    </PublishScreen>
  );
}
