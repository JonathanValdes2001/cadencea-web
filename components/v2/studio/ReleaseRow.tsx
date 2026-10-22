'use client';

import React from 'react';
import Link from 'next/link';
import CoverArt from '@/components/ui/CoverArt';
import StatusChip from '@/components/ui/StatusChip';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { releaseActions } from '@/lib/v2-demo/release-lifecycle/actions';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { channelLabel, chipText, lastActivity, versionLine, type ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import type { LifecycleState } from '@/lib/v2-demo/release-lifecycle/types';
import { STUDIO_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { ActionButton, ReleaseActionMenu } from './ReleaseActions';

/** The md+ column template, shared with the header row in StudioDashboard. */
export const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_12.5rem] md:items-center md:gap-4';

export function coverSeedOf(view: ReleaseView): string {
  return view.shown.payload.cover?.file.demoAssetKey ?? view.release.id;
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-sm text-ink-muted">
      <span className="text-ink-subtle md:sr-only">{label}: </span>
      {children}
    </p>
  );
}

/** One Studio row (RL §6.2): a table row from md, a stacked card below. */
export default function ReleaseRow({ view, state }: { view: ReleaseView; state: LifecycleState }) {
  const { release, chips } = view;
  const title = view.shown.payload.title;
  const [primary, ...more] = releaseActions(state, view, DEMO_NOW);
  const primaryText = chipText(view, chips.primary);
  const secondaryText = chips.secondary ? chipText(view, chips.secondary) : null;

  return (
    <li className={`flex flex-col gap-3 border-b border-line px-4 py-4 last:border-b-0 ${ROW_GRID}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-14 shrink-0">
          <CoverArt seed={coverSeedOf(view)} kind={release.type} decorative rounded="sm" />
        </div>
        <div className="min-w-0">
          <Link href={`/studio/${release.id}`} title={title} className="block truncate font-semibold text-ink hover:underline">
            {title}
          </Link>
          <p className="mt-0.5 text-xs text-ink-subtle">{WIZARD_COPY.tiles[release.type].title}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusChip id={chips.primary} label={primaryText.label} hint={primaryText.hint} />
        {chips.secondary && secondaryText && <StatusChip id={chips.secondary} label={secondaryText.label} hint={secondaryText.hint} />}
      </div>
      <Meta label={STUDIO_UI.columns.version}>
        <span className="tabular-nums">{versionLine(view)}</span>
      </Meta>
      <Meta label={STUDIO_UI.columns.channel}>{channelLabel(release)}</Meta>
      <Meta label={STUDIO_UI.columns.activity}>{lastActivity(state, release).text}</Meta>
      <div className="flex items-center gap-2 md:justify-end">
        {primary && <ActionButton view={view} item={primary} variant="secondary" />}
        {more.length > 0 ? (
          <ReleaseActionMenu view={view} items={more} label={fill(STUDIO_UI.rowMenu, { title })} />
        ) : (
          // Keeps the primary buttons of the table lined up when a row has no menu.
          <span aria-hidden="true" className="hidden w-11 shrink-0 md:block" />
        )}
      </div>
    </li>
  );
}
