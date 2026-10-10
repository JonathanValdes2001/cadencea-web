import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import ReleaseDetail from '@/components/v2/studio/ReleaseDetail';
import { SEED_STATE } from '@/lib/v2-demo/release-lifecycle/seeds';

type Params = Promise<{ releaseId: string }>;

/** The seed's title for the tab; releases made in the browser get the generic title. */
function seedTitle(releaseId: string): string | null {
  const release = SEED_STATE.releases[releaseId];
  if (!release) return null;
  const revisionId = release.openRevisionId ?? release.currentRevisionId ?? release.revisionIds[release.revisionIds.length - 1];
  return SEED_STATE.revisions[revisionId]?.payload.title ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  const title = seedTitle((await params).releaseId);
  return { title: title ? `${title} · Studio (preview)` : 'Studio (preview)' };
}

// Server shell (WEB-V2-SPEC §4.7): the body reads the browser's demo store, so a
// release made in this preview resolves after hydration. `demo` shows the Demo
// reviewer and is computed here, never in client code (§2.1, RL §7.1).
export default async function StudioReleasePage({ params }: { params: Params }) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  const { releaseId } = await params;
  return <ReleaseDetail releaseId={releaseId} demo={isPreviewSite()} />;
}
