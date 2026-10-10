'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/ui/CoverArt';
import { Copy, External } from '@/components/ui/Icons';
import StatusChip from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/Toast';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { publicHrefFor } from '@/lib/v2-demo/release-lifecycle/actions';
import { VERSION_COPY, WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { channelLabel, chipText, versionLine, type ReleaseView } from '@/lib/v2-demo/release-lifecycle/selectors';
import { isPublic } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { coverSeedOf } from './ReleaseRow';

/**
 * The release detail header (RL §6.3): breadcrumb, cover (56 px on mobile, 96 px
 * on desktop), title, type, chips, channel, version line and, for public
 * releases with a public page, "View on Market" or "View on Stream", plus "Copy link".
 */
export default function ReleaseHeader({ view }: { view: ReleaseView }) {
  const { release, chips, current } = view;
  const title = view.shown.payload.title;
  const toast = useToast();
  const isLivePublic = isPublic(release, DEMO_NOW);
  const publicHref = isLivePublic ? publicHrefFor(release) : null;
  const version =
    isLivePublic && current?.version && current.decidedAt && view.open === null
      ? fill(VERSION_COPY.liveSince, { date: formatDate(current.decidedAt), n: current.version })
      : versionLine(view);
  const primary = chipText(view, chips.primary);
  const secondary = chips.secondary ? chipText(view, chips.secondary) : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      toast.show(DETAIL_UI.linkCopied);
    } catch {
      // Clipboard blocked (permissions or an insecure origin): nothing to copy to.
    }
  };

  return (
    <header>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/studio" className="hover:text-ink hover:underline">
              {DETAIL_UI.breadcrumb}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-ink">
            {title}
          </li>
        </ol>
      </nav>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="w-14 shrink-0 md:w-24">
          <CoverArt seed={coverSeedOf(view)} kind={release.type} title={title} rounded="md" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{WIZARD_COPY.tiles[release.type].title}</p>
          <h1 className="mt-1 break-words text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusChip id={chips.primary} label={primary.label} hint={primary.hint} size="md" />
            {chips.secondary && secondary && <StatusChip id={chips.secondary} label={secondary.label} hint={secondary.hint} size="md" />}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            <span className="tabular-nums">{version}</span> · {channelLabel(release)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {publicHref && (
            <Button
              variant="secondary"
              size="sm"
              href={publicHref}
              iconRight={<External size={16} />}
            >
              {release.type === 'song' ? DETAIL_UI.viewOnStream : DETAIL_UI.viewOnMarket}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={copyLink} iconLeft={<Copy size={16} />}>
            {DETAIL_UI.copyLink}
          </Button>
        </div>
      </div>
    </header>
  );
}
