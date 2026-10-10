import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight } from '@/components/ui/Icons';

const ITEMS = [
  {
    title: 'Detect',
    body: 'Key, BPM and tag suggestions for every project, on your computer. Free on every plan.',
    // The anchor exists only on the preview, like this band.
    href: '/cadenceavault#detect',
  },
  {
    title: 'Market',
    body: 'Sample packs, Splits, presets and beats from producers, published straight from their vault.',
    href: '/market',
  },
  {
    title: 'Cadencea Stream',
    body: 'A streaming concept where listeners pay the artists they actually play.',
    href: '/stream',
  },
];

/** The home page's preview-only "What's next" band. The page renders it only when isPreviewSite(). */
export default function WhatsNext() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-showroom py-20 text-dark-text lg:py-28">
      <ShowroomGlow />
      <Container>
        <SectionHeader
          onDark
          eyebrow="Coming in Cadencea 2.0"
          title="Detect, a Market and a stage for human-made music."
        />
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-md border border-white/10 bg-white/5 p-6 hover:border-brand-400/40 hover:bg-white/10"
              >
                <Badge tone="demo" className="self-start">
                  Preview
                </Badge>
                <h3 className="mt-4 text-base font-semibold text-dark-text md:text-lg">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-dark-muted">{item.body}</p>
                <ArrowRight
                  size={20}
                  className="mt-6 text-brand-300 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
