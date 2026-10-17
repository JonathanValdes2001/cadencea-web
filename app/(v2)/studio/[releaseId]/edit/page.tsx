import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parkedRoutesOpen } from '@/lib/parked-features.mjs';
import PublishScreen from '@/components/v2/publish/PublishScreen';
import PublishWizard from '@/components/v2/publish/PublishWizard';
import { fill } from '@/lib/v2-demo/format';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { SEED_STATE } from '@/lib/v2-demo/release-lifecycle/seeds';
import type { WizardStepId } from '@/lib/v2-demo/release-lifecycle/types';

type Params = Promise<{ releaseId: string }>;
type SearchParams = Promise<{ step?: string | string[] }>;

const STEPS: readonly WizardStepId[] = ['source', 'details', 'contents', 'cover_preview', 'license_price', 'review_submit'];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (!parkedRoutesOpen()) notFound();
  const release = SEED_STATE.releases[(await params).releaseId];
  const current = release?.currentRevisionId ? SEED_STATE.revisions[release.currentRevisionId] : null;
  return { title: current ? `${fill(WIZARD_COPY.h1Edit, { title: current.payload.title })} (preview)` : 'Edit release (preview)' };
}

// The update wizard (RL §5.6; route owned by WEB-V2-SPEC §1.1) in the same
// Publish window and behind the same creator gate (PUBLISH-PROCEDURE §1, §3).
// "Edit release" continues an open update or draft, and only the first change
// starts a pending revision, so the live version stays up. `?step=` opens a step.
export default async function EditReleasePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!parkedRoutesOpen()) notFound();
  const { releaseId } = await params;
  const { step } = await searchParams;
  const startStep = typeof step === 'string' && (STEPS as readonly string[]).includes(step) ? (step as WizardStepId) : null;
  return (
    <PublishScreen>
      <PublishWizard mode="edit" releaseId={releaseId} step={startStep} />
    </PublishScreen>
  );
}
