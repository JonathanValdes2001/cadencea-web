import React from 'react';
import CoverArt from '@/components/ui/CoverArt';
import { Play, Search, Waveform } from '@/components/ui/Icons';
import type { CoverKind, PaletteName } from '@/lib/v2-demo/cover';
import { waveformBars } from '@/lib/v2-demo/cover';

type SyncChip = 'Synced' | 'Modified' | 'Local only';

const CHIP_CLASS: Record<SyncChip, string> = {
  Synced: 'bg-tone-success-bg text-tone-success',
  Modified: 'bg-tone-warning-bg text-tone-warning',
  'Local only': 'bg-tone-neutral-bg text-tone-neutral',
};

// Fictional projects (WEB-V2-SPEC §5.3 and §6.6 names; none is a Market or Studio listing).
// `art` only picks the generated artwork's style, so the covers don't all look alike.
const PROJECTS: { title: string; meta: string; chip: SyncChip; palette: PaletteName; art: CoverKind; detect?: boolean }[] = [
  { title: 'Night Ferry', meta: '128 BPM · A Minor', chip: 'Synced', palette: 'violet', art: 'song' },
  { title: 'Copper Rain', meta: '118 BPM · Key not set', chip: 'Local only', palette: 'ember', art: 'sample_pack', detect: true },
  { title: 'Frost Lines', meta: '140 BPM · F# Minor', chip: 'Modified', palette: 'ice', art: 'beat' },
  { title: 'Harbor Sketch', meta: '96 BPM · D Major', chip: 'Synced', palette: 'tide', art: 'splits_pack' },
  { title: 'Glass Weather', meta: '174 BPM · G Minor', chip: 'Synced', palette: 'rose', art: 'preset_pack' },
  { title: 'Lowland Tape', meta: '84 BPM · E Minor', chip: 'Modified', palette: 'moss', art: 'midi_pack' },
];

const SIDEBAR = ['Projects', 'Shared with me', 'Tags', 'Bin'];

/** Bars `from`..`to` of a waveform as one SVG path of thin rectangles. */
function barsPath(bars: readonly number[], from: number, to: number): string {
  let d = '';
  for (let i = from; i < to; i += 1) {
    const h = Math.max(1.5, bars[i] * 22);
    d += `M${i * 4} ${(12 - h / 2).toFixed(1)}h2.4v${h.toFixed(1)}h-2.4z`;
  }
  return d;
}

/** DETECT-SPEC's three-segment meter, the level in words (DECISIONS.md D4). */
function Meter({ filled }: { filled: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-2 w-1 rounded-sm ${i < filled ? 'bg-brand-400' : 'bg-white/15'}`} />
      ))}
    </span>
  );
}

function ProjectCard({ project, index }: { project: (typeof PROJECTS)[number]; index: number }) {
  // One row of two on a phone, two rows of two, then two rows of three when there's room.
  const hiddenWhenNarrow = index >= 4 ? 'hidden @md:flex' : index >= 2 ? 'hidden @sm:flex' : 'flex';
  const raised = project.detect
    ? 'relative z-10 border-brand-400/50 bg-brand-950/70 shadow-brand-glow ring-1 ring-brand-400/30 @md:-translate-y-2 @md:scale-[1.04]'
    : 'border-white/10 bg-white/[0.04]';
  return (
    <li className={`${hiddenWhenNarrow} flex-col overflow-hidden rounded-md border ${raised}`}>
      {/* The square artwork, center-cropped to 16:10 so two rows fit beside the hero copy. */}
      <div className="aspect-[16/10] overflow-hidden">
        <CoverArt
          seed={`vault-mock-${project.title}`}
          kind={project.art}
          palette={project.palette}
          decorative
          rounded="none"
          className="-translate-y-[18.75%]"
        />
      </div>
      <div className="min-w-0 p-2.5">
        <p className="truncate text-[13px] font-semibold text-dark-text">{project.title}</p>
        <p className="mt-0.5 truncate text-[11px] tabular-nums text-dark-muted">{project.meta}</p>
        {project.detect ? (
          <div className="mt-2 rounded-sm border border-brand-400/30 bg-brand-950/80 p-1.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-brand-200">
              <Waveform size={16} className="h-3 w-3 shrink-0" />
              Detect suggests
            </p>
            <p className="mt-1 flex items-center justify-between gap-1.5 text-[11px] font-semibold tabular-nums text-dark-text">
              <span className="truncate">A Minor</span>
              <Meter filled={2} />
            </p>
            <p className="truncate text-[10px] text-dark-muted">Detected from the audio</p>
          </div>
        ) : (
          <span className={`mt-2 inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${CHIP_CLASS[project.chip]}`}>
            {project.chip}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * A stylized Cadencea Vault library window, built in HTML and inline SVG so it
 * fetches nothing and passes the CSP (WEB-V2-SPEC §0.5): the home hero, the
 * /cadenceavault flagship and the /software card use it until clean
 * screenshots from a demo vault exist (§9.1). Every project is fictional. It is
 * a picture: aria-hidden, with a text description for screen readers.
 */
export default function VaultMock({
  className = '',
  description = 'Illustration of the Cadencea Vault library: project cards with artwork, BPM, key and sync status, a Detect suggestion of A Minor for a project without a key, and a player bar.',
}: {
  className?: string;
  description?: string;
}) {
  const bars = waveformBars('vault-mock-player', 64);
  const played = Math.round(bars.length * 0.38);
  return (
    <figure className={`@container ${className}`}>
      <figcaption className="sr-only">{description}</figcaption>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-lg border border-white/10 bg-showroom-to text-dark-text shadow-brand-glow ring-1 ring-white/5"
      >
        {/* Window chrome */}
        <div className="flex h-9 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </span>
          <span className="truncate text-[11px] font-medium text-dark-muted">Cadencea Vault · My vault</span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-36 shrink-0 border-r border-white/10 p-3 @xl:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted">Library</p>
            <ul className="mt-2 space-y-0.5">
              {SIDEBAR.map((item, i) => (
                <li
                  key={item}
                  className={`rounded-sm px-2 py-1.5 text-[12px] ${i === 0 ? 'bg-brand-400/15 font-semibold text-brand-200' : 'text-dark-muted'}`}
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-dark-muted">Storage</p>
            <div className="mt-2 h-1.5 rounded-sm bg-white/10">
              <div className="h-full w-2/5 rounded-sm bg-brand-400" />
            </div>
            <p className="mt-1.5 text-[10px] tabular-nums text-dark-muted">21 GB of 50 GB</p>
          </div>

          {/* Library */}
          <div className="min-w-0 flex-1 p-3 @md:p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.04] px-2 text-[11px] text-dark-muted">
                <Search size={16} className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Search projects, tags, keys</span>
              </span>
              <span className="hidden h-7 shrink-0 items-center rounded-sm bg-accent px-2.5 text-[11px] font-semibold text-white @sm:inline-flex">
                Push 2 changes
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2.5 @md:grid-cols-3 @md:gap-3">
              {PROJECTS.map((project, i) => (
                <ProjectCard key={project.title} project={project} index={i} />
              ))}
            </ul>
          </div>
        </div>

        {/* Player bar */}
        <div className="flex h-11 items-center gap-3 border-t border-white/10 bg-white/[0.03] px-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <Play size={16} className="h-3.5 w-3.5" />
          </span>
          <span className="hidden w-24 shrink-0 truncate text-[11px] font-medium text-dark-text @sm:block">Night Ferry</span>
          {/* Two paths rather than 64 elements keep the mock light in the page payload. */}
          <svg viewBox={`0 0 ${bars.length * 4} 24`} preserveAspectRatio="none" className="h-6 min-w-0 flex-1">
            <path d={barsPath(bars, 0, played)} className="fill-brand-400" />
            <path d={barsPath(bars, played, bars.length)} className="fill-white/25" />
          </svg>
          <span className="shrink-0 text-[11px] tabular-nums text-dark-muted">1:24 / 3:41</span>
        </div>
      </div>
    </figure>
  );
}
