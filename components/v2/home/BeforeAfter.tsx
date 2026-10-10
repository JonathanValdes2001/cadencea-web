import React from 'react';
import Container from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import SectionHeader from '@/components/ui/SectionHeader';

const BEFORE_FILES = [
  'FINAL_v7_real.als',
  'Beat 3 (conflicted copy).flp',
  'bounce_NEW_new.wav',
  'vox comp (2).wav',
  'Untitled 14.logicx',
];

type SyncChip = 'Synced' | 'Modified' | 'Local only';

const CHIP_CLASS: Record<SyncChip, string> = {
  Synced: 'bg-tone-success-bg text-tone-success',
  Modified: 'bg-tone-warning-bg text-tone-warning',
  'Local only': 'bg-tone-neutral-bg text-tone-neutral',
};

// Fictional projects (none is a Studio seed title).
const AFTER_PROJECTS: { title: string; meta: string; chip: SyncChip; palette: 'violet' | 'ice' | 'ember' }[] = [
  { title: 'Night Ferry', meta: '128 BPM · A Minor', chip: 'Synced', palette: 'violet' },
  { title: 'Frost Lines', meta: '140 BPM · F# Minor', chip: 'Modified', palette: 'ice' },
  { title: 'Copper Rain', meta: '118 BPM · No key', chip: 'Local only', palette: 'ember' },
];

/** Home "Before and after": a messy project folder next to the same work in the vault. */
export default function BeforeAfter() {
  return (
    <section className="border-b border-line py-20 lg:py-28">
      <Container>
        <SectionHeader
          eyebrow="Why Cadencea Vault"
          title="From FINAL_v7_real.als to a library you trust."
          subtitle="Project folders drift across drives, cloud folders make conflicted copies, and nobody knows which bounce is current. Cadencea Vault reads the folders you already have and shows every project with its BPM, key, tags, artwork and sync state."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-md border border-line bg-elevated p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Before</h3>
            <ul className="mt-4 space-y-2.5 font-mono text-sm text-ink-muted">
              {BEFORE_FILES.map((file) => (
                <li key={file} className="truncate" title={file}>
                  {file}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">After</h3>
            <ul className="mt-4 divide-y divide-line">
              {AFTER_PROJECTS.map((project) => (
                <li key={project.title} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-11 shrink-0">
                    <CoverArt
                      seed={`home-${project.title}`}
                      kind="song"
                      palette={project.palette}
                      decorative
                      rounded="sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{project.title}</p>
                    <p className="text-xs tabular-nums text-ink-muted">{project.meta}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold ${CHIP_CLASS[project.chip]}`}
                  >
                    {project.chip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
