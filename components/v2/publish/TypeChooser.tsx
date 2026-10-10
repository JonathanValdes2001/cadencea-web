import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import CoverArt from '@/components/ui/CoverArt';
import { ArrowRight } from '@/components/ui/Icons';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { RELEASE_TYPE_SLUG, type ReleaseType } from '@/lib/v2-demo/release-lifecycle/types';
import { PUBLISH_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

const ACTIVE: readonly ReleaseType[] = ['song', 'beat', 'preset_pack', 'sample_pack'];
const COMING_LATER: readonly ReleaseType[] = ['splits_pack', 'midi_pack'];

function rail(type: ReleaseType): string {
  if (type === 'song') return PUBLISH_UI.rails.song;
  if (type === 'beat') return PUBLISH_UI.rails.beat;
  return PUBLISH_UI.rails.pack;
}

const tileClass =
  'group flex h-full gap-4 rounded-md border p-5 focus-visible:outline-offset-2';

/**
 * The type chooser on /publish (RL §5.1, §9.8; WEB-V2-SPEC §4.6): four active
 * tiles in a 2×2 grid with their payment rail, Splits and MIDI as "Coming
 * later" tiles that open their rules summary, and Theme disabled.
 */
export default function TypeChooser({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <ul aria-label={PUBLISH_UI.typesLabel} className="grid gap-4 sm:grid-cols-2">
        {ACTIVE.map((type) => {
          const tile = WIZARD_COPY.tiles[type];
          return (
            <li key={type}>
              <Link href={`/publish/${RELEASE_TYPE_SLUG[type]}`} className={`${tileClass} hover-lift border-line hover:border-line-strong`}>
                <div className="w-16 shrink-0">
                  <CoverArt seed={`publish-tile-${type}`} kind={type} decorative rounded="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center justify-between gap-2 text-base font-semibold text-ink md:text-lg">
                    {tile.title}
                    <ArrowRight size={16} className="shrink-0 text-ink-subtle group-hover:text-ink" />
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{tile.body}</p>
                  <p className="mt-3 text-xs font-medium text-ink-subtle">{rail(type)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-ink-subtle">{WIZARD_COPY.comingLaterTitle}</h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-3">
        {COMING_LATER.map((type) => {
          const tile = WIZARD_COPY.tiles[type];
          return (
            <li key={type}>
              <Link href={`/publish/${RELEASE_TYPE_SLUG[type]}`} className={`${tileClass} border-dashed border-line-strong bg-elevated hover:border-ink`}>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {tile.title}
                    <Badge>{PUBLISH_UI.comingLaterNote}</Badge>
                  </p>
                  {tile.body && <p className="mt-1 text-sm text-ink-muted">{tile.body}</p>}
                </div>
              </Link>
            </li>
          );
        })}
        <li>
          <div aria-disabled="true" className={`${tileClass} cursor-not-allowed border-dashed border-line bg-elevated`}>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-subtle">
                {WIZARD_COPY.tiles.theme.title}
                <Badge>{PUBLISH_UI.disabled}</Badge>
              </p>
              <p className="mt-1 text-sm text-ink-subtle">{WIZARD_COPY.tiles.theme.body}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
