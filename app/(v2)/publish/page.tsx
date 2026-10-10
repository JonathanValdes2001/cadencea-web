import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import PersonaBanner from '@/components/v2/common/PersonaBanner';
import ProjectShortcuts from '@/components/v2/publish/ProjectShortcuts';
import RequirementsPanel from '@/components/v2/publish/RequirementsPanel';
import SellerSetup from '@/components/v2/publish/SellerSetup';
import TypeChooser from '@/components/v2/publish/TypeChooser';
import { PUBLISH_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Publish (preview)' };
}

// The type chooser (RL §5.1, WEB-V2-SPEC §4.6): four wizard types, Splits and
// MIDI as "Coming later", Theme disabled, the draft requirements and the demo
// Vault projects. The first-time seller step shows once per browser.
export default function PublishPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  return (
    <Container className="py-10 lg:py-14">
      <SectionHeader as="h1" eyebrow={PUBLISH_UI.eyebrow} title={PUBLISH_UI.title} subtitle={PUBLISH_UI.lead} />
      <PersonaBanner className="mt-8" />
      <SellerSetup className="mt-6" />
      <TypeChooser className="mt-10" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <RequirementsPanel />
        <ProjectShortcuts />
      </div>
    </Container>
  );
}
