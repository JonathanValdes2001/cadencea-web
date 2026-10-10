import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Faq from '@/components/ui/Faq';
import SectionHeader from '@/components/ui/SectionHeader';
import BeforeAfter from '@/components/v2/home/BeforeAfter';
import CompareTable from '@/components/v2/home/CompareTable';
import WhatsNext from '@/components/v2/home/WhatsNext';
import {
  availabilityLabel,
  RELEASE_FEED_TIMEOUT_MS,
  withTimeout,
  type VaultReleases,
} from '@/components/v2/home/availability';
import { loadCadenceaVaultReleases } from '@/lib/cadencea-vault-releases.mjs';
import { isPreviewSite } from '@/lib/site-channel.mjs';

const features = [
  {
    title: 'Lossless, bit for bit',
    desc: 'Audio and project files are stored exactly as you saved them. Cadencea never transcodes, normalizes or compresses your audio.',
  },
  {
    title: 'Sync you can read',
    desc: "Every file is compared by content hash, so each project shows whether it's synced, modified, local-only or cloud-only. You push when you're ready.",
  },
  {
    title: 'Share the whole session',
    desc: 'Invite collaborators to a project with roles. They open the project file, stems and artwork, not a bounce. Collaborators join with a free account.',
  },
  {
    title: 'Your drive stays the master',
    desc: 'Projects remain normal folders on your computer and open in your DAW as before. Cadencea Vault works offline; the cloud copy is a backup you control.',
  },
];

const faqs = [
  {
    q: 'What is Cadencea Vault?',
    a: 'A desktop app for music producers. It organizes your project folders, shows their BPM, key and tags, and backs them up losslessly to the cloud when you push. It runs on Windows and macOS.',
  },
  {
    q: 'Is it free?',
    a: 'The app and your local library are free. The Free plan includes 5 GB of cloud storage, and paid plans start at €4.99 a month for 50 GB.',
  },
  {
    q: 'Which DAWs does it work with?',
    a: 'All of them. Cadencea Vault manages project folders, so it works with Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reaper, Bitwig Studio and others.',
  },
  {
    q: 'Will my audio be converted or compressed?',
    a: 'No. Files are stored byte for byte, exactly as you saved them. Cadencea never transcodes or normalizes your audio.',
  },
  {
    q: 'How private are my files?',
    a: 'Files travel over encrypted connections, and only you and the collaborators you invite can open your projects. Your local folders remain the master copy.',
  },
  {
    q: 'Do collaborators need to pay?',
    a: 'No. Anyone you invite can join with a free account.',
  },
  {
    q: 'What happens if I downgrade or cancel?',
    a: "Nothing is deleted. If you're over your new plan's storage, new uploads pause until you're back under the limit. Paid plans can be cancelled anytime and stay active until the end of the billing period.",
  },
  {
    q: 'Which systems are supported?',
    a: 'Windows 10 or later (64-bit), and macOS 12 Monterey or later on Apple Silicon or Intel. Linux is planned.',
  },
];

export default async function Home() {
  const preview = isPreviewSite();
  // The feed is three B2 requests per visit; past the timeout the page renders
  // as if nothing were available rather than waiting on B2.
  const releases: VaultReleases = await withTimeout(
    loadCadenceaVaultReleases(),
    RELEASE_FEED_TIMEOUT_MS,
    {},
  );
  const trust = [
    availabilityLabel(releases, { preview }),
    'No transcoding, ever',
    'Your folders stay where they are',
    'Free app',
  ];

  return (
    <div className="bg-canvas text-ink">
      {/* Hero */}
      <section className="border-b border-line py-20 lg:py-28">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Cadencea Vault · for music producers
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Every project. Every DAW. One lossless vault.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">
              Cadencea Vault keeps your sessions organized on your own drive and pushes a bit-for-bit copy to the
              cloud when you&rsquo;re ready. Share whole projects with collaborators, not just the bounce.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/cadenceavault#download" size="lg">
                Download free
              </Button>
              <Button href="/pricing" variant="secondary" size="lg">
                See pricing
              </Button>
            </div>
            <ul aria-label="At a glance" className="mt-8 flex flex-wrap gap-x-2 gap-y-1 text-sm text-ink-subtle">
              {trust.map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <BeforeAfter />

      {/* What it does */}
      <section className="border-b border-line py-20 lg:py-28">
        <Container>
          <SectionHeader eyebrow="What it does" title="Built around how producers actually work." />
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="border-t border-line pt-6">
                <h3 className="text-base font-semibold text-ink md:text-lg">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Works with your DAW */}
      <section className="border-b border-line py-20 lg:py-28">
        <Container>
          <SectionHeader
            title="Works with the DAW you already use."
            subtitle="Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reaper, Bitwig Studio, and anything else that saves projects to a folder. Cadencea Vault never changes how your DAW opens a project."
          />
        </Container>
      </section>

      <CompareTable />

      {/* Pricing teaser */}
      <section className="border-b border-line bg-elevated py-20 lg:py-28">
        <Container className="text-center">
          <SectionHeader
            align="center"
            title="Free app. Pay only for cloud space."
            subtitle="The app and your local library are free. Cloud plans start at €4.99 a month for 50 GB."
          />
          <Button href="/pricing" size="lg" className="mt-8">
            Compare plans
          </Button>
        </Container>
      </section>

      {preview && <WhatsNext />}

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="mx-auto max-w-4xl">
            <SectionHeader title="Questions, answered." />
            <Faq items={faqs} className="mt-10" />
          </div>
        </Container>
      </section>
    </div>
  );
}
