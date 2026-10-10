import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import CoverArt from '@/components/ui/CoverArt';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight, Waveform } from '@/components/ui/Icons';
import { PayoutBar } from '@/components/v2/stream/PayoutBreakdown';

/** Detect: the A Minor suggestion with its three-segment meter (DECISIONS.md D4). */
function DetectVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-5">
      <span className="inline-flex items-center gap-2 self-start rounded-sm border border-brand-400/30 bg-brand-950 px-2.5 py-1 text-xs font-semibold text-brand-200">
        <Waveform size={16} className="h-3.5 w-3.5" />
        A Minor · Detected from the audio
      </span>
      <span className="inline-flex items-center gap-2 text-xs text-dark-muted">
        <span className="inline-flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-3 w-1.5 rounded-sm ${i < 2 ? 'bg-brand-400' : 'bg-white/15'}`} />
          ))}
        </span>
        Medium confidence · also likely C Major
      </span>
    </div>
  );
}

/** Market: three overlapping generated covers. */
function MarketVisual() {
  const covers = [
    { seed: 'whats-next-samples', kind: 'sample_pack' as const, tilt: '-rotate-6 translate-x-3' },
    { seed: 'whats-next-splits', kind: 'splits_pack' as const, tilt: 'z-10 -translate-y-1' },
    { seed: 'whats-next-beat', kind: 'beat' as const, tilt: 'rotate-6 -translate-x-3' },
  ];
  return (
    <div className="flex h-full items-center justify-center">
      {covers.map((c) => (
        <div key={c.seed} className={`w-20 overflow-hidden rounded-md shadow-brand-glow ring-1 ring-white/10 ${c.tilt}`}>
          <CoverArt seed={c.seed} kind={c.kind} decorative rounded="none" />
        </div>
      ))}
    </div>
  );
}

/** Stream: where a NOK 49 subscription goes, as the /stream bar draws it. */
function StreamVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-5">
      <p className="text-xs font-semibold text-dark-text">Where your NOK 49 goes</p>
      <PayoutBar onDark className="h-3" />
      <p className="text-xs text-dark-muted">The artists&rsquo; share follows what you played.</p>
    </div>
  );
}

const ITEMS = [
  {
    title: 'Detect',
    body: 'Key, BPM and tag suggestions for every project, on your computer. Free on every plan.',
    // The anchor exists only on the preview, like this band.
    href: '/cadenceavault#detect',
    cta: 'See Detect',
    visual: <DetectVisual />,
  },
  {
    title: 'Market',
    body: 'Sample packs, Splits, presets and beats from producers, published straight from their vault.',
    href: '/market',
    cta: 'See the Market',
    visual: <MarketVisual />,
  },
  {
    title: 'Cadencea Stream',
    body: 'A streaming concept where listeners pay the artists they actually play.',
    href: '/stream',
    cta: 'See the Stream concept',
    visual: <StreamVisual />,
  },
];

/** The home page's preview-only "What's next" band. The page renders it only when isPreviewSite(). */
export default function WhatsNext({ className = '' }: { className?: string }) {
  return (
    <section className={`on-dark relative isolate overflow-hidden bg-showroom py-14 text-dark-text sm:py-20 lg:py-24 ${className}`}>
      <ShowroomGlow />
      <Container>
        <SectionHeader
          onDark
          eyebrow="Coming in Cadencea 2.0"
          title="Detect, a Market and a stage for human-made music."
        />
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="group flex h-full flex-col overflow-hidden rounded-md border border-white/10 bg-white/5 hover:border-brand-400/40 hover:bg-white/10"
              >
                <div aria-hidden="true" className="h-32 border-b border-white/10 bg-white/[0.03]">
                  {item.visual}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <Badge tone="demo" className="self-start">
                    Preview
                  </Badge>
                  <h3 className="mt-4 text-base font-semibold text-dark-text md:text-lg">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-dark-muted">{item.body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-300">
                    {item.cta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
