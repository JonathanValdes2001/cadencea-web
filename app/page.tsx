import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Faq from '@/components/ui/Faq';
import SectionHeader from '@/components/ui/SectionHeader';
import BeforeAfter from '@/components/v2/home/BeforeAfter';
import CompareTable from '@/components/v2/home/CompareTable';
import VaultMock from '@/components/v2/home/VaultMock';
import WhatsNext from '@/components/v2/home/WhatsNext';
import {
  anyDownload,
  availabilityLabel,
  RELEASE_FEED_REVALIDATE_S,
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
    desc: 'Projects remain normal folders on your computer and open in your DAW as before. Cadencea Vault works offline; you choose what to push to the cloud and when.',
  },
];

// The DAWs the shipped Vault recognizes project files for (WEB-V2-SPEC §5.3). Add
// more only once a Vault release reads their project files (.song, .bwproject).
const DAWS = ['Ableton Live', 'FL Studio', 'Logic Pro', 'Pro Tools', 'Cubase', 'Reaper', 'Reason'];

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
    a: 'All of them. Cadencea Vault manages project folders, so it works with Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Reaper, Reason and others.',
  },
  {
    q: 'Will my audio be converted or compressed?',
    a: 'No. Files are stored byte for byte, exactly as you saved them. Cadencea never transcodes or normalizes your audio.',
  },
  {
    q: 'How private are my files?',
    a: 'Files travel over encrypted connections, and you choose which projects to upload and who you share them with. Your local folders remain the master copy; keep a separate backup of important work. See our Privacy Policy for how we handle data.',
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
  // Three B2 manifests, cached for a few minutes and each given up on after
  // the timeout, so a slow platform drops out alone; the outer timeout is a
  // last safety net so B2 can never stall the page.
  const releases: VaultReleases = await withTimeout(
    loadCadenceaVaultReleases(fetch, { revalidate: RELEASE_FEED_REVALIDATE_S, timeoutMs: RELEASE_FEED_TIMEOUT_MS }),
    RELEASE_FEED_TIMEOUT_MS + 500,
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
      {/* Hero: the pitch on the left, the library it describes on the right (stacked on phones). */}
      <section className="border-b border-line py-14 sm:py-20 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              Cadencea Vault · for music producers
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
              Every project. Every DAW. One lossless vault.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
              Cadencea Vault keeps your sessions organized on your own drive and pushes a bit-for-bit copy to the
              cloud when you&rsquo;re ready. Share whole projects with collaborators, not just the bounce.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/cadenceavault#download" size="lg">
                {anyDownload(releases) ? 'Download free' : 'Get Cadencea Vault'}
              </Button>
              <Button href="/pricing" variant="secondary" size="lg">
                See pricing
              </Button>
            </div>
            <ul aria-label="At a glance" className="mt-8 flex flex-wrap gap-x-2 gap-y-1 text-sm text-ink-subtle">
              {/* The dot trails each item, so a wrapped line never starts with one. */}
              {trust.map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  {item}
                  {i < trust.length - 1 && <span aria-hidden="true">·</span>}
                </li>
              ))}
            </ul>
          </div>
          <VaultMock className="mx-auto w-full max-w-xl lg:max-w-none" />
        </Container>
      </section>

      <BeforeAfter />

      {/* The 2.0 story comes early on the preview, which exists to show it. */}
      {preview && <WhatsNext />}

      {/* What it does, and the DAWs it works with */}
      <section className="bg-elevated py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader eyebrow="What it does" title="Built around how producers actually work." />
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="border-t border-line-strong pt-6">
                <h3 className="text-base font-semibold text-ink md:text-lg">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-md border border-line bg-canvas p-6 lg:mt-20 lg:p-8">
            <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">Works with the DAW you already use.</h2>
            <ul aria-label="DAWs" className="mt-5 flex flex-wrap gap-2">
              {DAWS.map((daw) => (
                <li key={daw} className="rounded-sm border border-line px-3 py-1.5 text-sm font-medium text-ink">
                  {daw}
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink-muted">
              And anything else that saves projects to a folder. Cadencea Vault never changes how your DAW opens a
              project.
            </p>
          </div>
        </Container>
      </section>

      <CompareTable />

      {/* Pricing teaser */}
      <section className="bg-elevated py-14 sm:py-20 lg:py-24">
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

      {/* FAQ */}
      <section className="py-14 sm:py-20 lg:py-24">
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
