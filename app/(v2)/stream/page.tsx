import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import HumanMadeStandard from '@/components/v2/common/HumanMadeStandard';
import PayoutBreakdown from '@/components/v2/stream/PayoutBreakdown';
import StreamPhones from '@/components/v2/stream/StreamPhones';
import StreamPrinciples from '@/components/v2/stream/StreamPrinciples';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Cadencea Stream (concept)' };
}

/**
 * The Stream demo's address (WEB-V2-SPEC §4.9): a server env var set only in the
 * Vercel Preview scope or .env.local. Only https, or a local http address with a
 * port for running the demo next to this site; anything else disables the button.
 */
function streamDemoUrl(): string | null {
  const raw = process.env.STREAM_DEMO_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:') return url.toString();
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && local && url.port) return url.toString();
  } catch {
    // Not a URL: treated as unset.
  }
  return null;
}

/** The Cadencea Stream teaser: a concept, with a link to the Expo web demo. */
export default function StreamPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  const demoUrl = streamDemoUrl();

  return (
    <>
      {/* Hero */}
      <section className="on-dark relative isolate overflow-hidden bg-showroom text-dark-text">
        <ShowroomGlow />
        <Container className="py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-300">
              Cadencea Stream · Concept preview
              <Badge tone="demo">Working name</Badge>
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Music made by people. Paid for by the people who listen.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-dark-muted md:text-xl">
              A streaming service where a person reviews every release, and the artists&rsquo; share of each
              listener&rsquo;s money goes only to the artists they actually played.
            </p>
            {/* Without a demo address, "How payouts work" leads; a disabled primary button looks broken. */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {demoUrl && (
                <Button href={demoUrl} variant="onDark" size="lg" prefetch={false}>
                  Open the demo
                </Button>
              )}
              <Button href="#payouts" variant={demoUrl ? 'onDarkOutline' : 'onDark'} size="lg" prefetch={false}>
                How payouts work
              </Button>
              {!demoUrl && (
                <span className="inline-flex h-8 items-center rounded-sm border border-white/15 px-3 text-sm text-dark-muted">
                  Demo coming soon
                </span>
              )}
            </div>
          </div>
          <div className="mt-16 lg:mt-20">
            <StreamPhones />
          </div>
        </Container>
      </section>

      <StreamPrinciples />

      <PayoutBreakdown />

      {/* The Human-Made Standard */}
      <section id="human-made" className="scroll-mt-24 border-b border-line py-20 lg:py-28">
        <Container>
          <div className="max-w-4xl">
            <HumanMadeStandard />
            <p className="mt-6 text-base leading-relaxed text-ink-muted">
              No tool can detect AI with certainty, so detectors only decide what gets a closer listen. A person
              makes every decision, with reasons and a free appeal. Project files are used only for review and never
              to train AI.
            </p>
          </div>
        </Container>
      </section>

      {/* Support artists directly */}
      <section className="border-b border-line py-20 lg:py-28">
        <Container>
          <SectionHeader
            title="Support artists directly"
            subtitle="Tip an artist or support them monthly, from NOK 35 (about €3). Fan support is paid by card, never with credits, and artists keep 90% after card fees (and VAT, if it applies)."
          />
        </Container>
      </section>

      {/* Honest status */}
      <section className="bg-elevated py-20 lg:py-28">
        <Container>
          <SectionHeader
            title="Not launching yet."
            subtitle="Cadencea Stream is a concept. We'll build it after Cadencea Vault 2.0 and the Market, starting in Norway. Artists, releases, numbers and payouts in the demo are fictional."
          />
          <Button href="/cadenceavault" size="lg" className="mt-8">
            Get Cadencea Vault
          </Button>
        </Container>
      </section>
    </>
  );
}
