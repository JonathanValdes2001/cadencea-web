import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import PluginWindow from '@/components/v2/plugins/PluginWindow';

/** /vst-plugins metadata while the store is closed (production before go-live). */
export const comingSoonMetadata = {
  title: 'Plugins',
  description: 'Cadencea plugins are coming. There is nothing to buy yet.',
};

// What production shows at /vst-plugins until the store's go-live switch
// (lib/plugins/store-gate.mjs) is flipped. Deliberately small and plain: no
// product names, prices, release dates or screenshots.
const NOTES = [
  {
    title: 'Made by Cadencea',
    body: 'Plugins from the team that builds Cadencea Vault, for the same producers.',
  },
  {
    title: 'Tied to your Cadencea account',
    body: 'When they launch, your plugins will belong to the account you already use for Vault.',
  },
  {
    title: 'Nothing to buy yet',
    body: 'There is no store, cart or pricing today. When plugins are ready, they will appear on this page.',
  },
];

export default function PluginsComingSoon() {
  return (
    <div className="bg-canvas text-ink">
      <section className="on-dark relative isolate overflow-hidden bg-showroom py-14 text-dark-text sm:py-20 lg:py-24">
        <ShowroomGlow />
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
          <div>
            <Badge tone="dark" size="md" className="border border-white/15">
              Coming soon
            </Badge>
            <SectionHeader
              as="h1"
              onDark
              className="mt-6"
              eyebrow="Plugins"
              title="Cadencea plugins are coming."
              subtitle="We are building audio plugins for music producers. They are not available yet, and we will announce them here when they are."
            />
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/cadenceavault#download" variant="onDark" size="lg">
                Get Cadencea Vault
              </Button>
              <Button href="/contact" variant="onDarkOutline" size="lg">
                Get in touch
              </Button>
            </div>
          </div>
          <PluginWindow className="mx-auto w-full max-w-md lg:max-w-none" />
        </Container>
      </section>

      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <SectionHeader title="What to expect." />
          <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
            {NOTES.map((note) => (
              <li key={note.title} className="border-t border-line-strong pt-6">
                <h2 className="text-base font-semibold text-ink md:text-lg">{note.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{note.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
