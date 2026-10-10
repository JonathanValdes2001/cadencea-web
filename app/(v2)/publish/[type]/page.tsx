import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import ComingLaterType from '@/components/v2/publish/ComingLaterType';
import PublishWizard from '@/components/v2/publish/PublishWizard';
import { fill } from '@/lib/v2-demo/format';
import { COMING_LATER_COPY, WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { RELEASE_TYPES, RELEASE_TYPE_INFO, RELEASE_TYPE_SLUG, type ReleaseType } from '@/lib/v2-demo/release-lifecycle/types';
import { isWizardType } from '@/lib/v2-demo/release-lifecycle/vault-projects';

type Params = Promise<{ type: string }>;
type SearchParams = Promise<{ project?: string | string[] }>;

/**
 * The four wizard types; Splits and MIDI render their rules summary; Theme and
 * anything else 404 (RL §5.1, WEB-V2-SPEC §1.1).
 */
function resolve(slug: string): { kind: 'wizard'; type: Extract<ReleaseType, 'song' | 'beat' | 'preset_pack' | 'sample_pack'> } | { kind: 'later'; type: 'splits_pack' | 'midi_pack' } | null {
  const type = RELEASE_TYPES.find((t) => RELEASE_TYPE_SLUG[t] === slug);
  if (!type || !RELEASE_TYPE_INFO[type].sellerCanPublish) return null;
  if (isWizardType(type) && RELEASE_TYPE_INFO[type].wizardInThisBuild) return { kind: 'wizard', type };
  if (type === 'splits_pack' || type === 'midi_pack') return { kind: 'later', type };
  return null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  const resolved = resolve((await params).type);
  if (!resolved) notFound();
  const title =
    resolved.kind === 'wizard'
      ? fill(WIZARD_COPY.h1, { type: WIZARD_COPY.typeName[resolved.type] })
      : fill(COMING_LATER_COPY.title, { Type: WIZARD_COPY.tiles[resolved.type].title });
  return { title: `${title} (preview)` };
}

// Server shell: the wizard is a client component that keeps its draft in this
// browser's demo store. `?project=` comes from "Start from a Vault project" on /publish.
export default async function PublishTypePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  const resolved = resolve((await params).type);
  if (!resolved) notFound();
  if (resolved.kind === 'later') return <ComingLaterType type={resolved.type} />;
  const { project } = await searchParams;
  return <PublishWizard mode="new" type={resolved.type} projectId={typeof project === 'string' ? project : null} />;
}
