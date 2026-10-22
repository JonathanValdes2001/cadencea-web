import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <Container className="py-24 lg:py-32">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">404</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-6 text-base leading-relaxed text-ink-muted md:text-lg">
          It may have moved, or the link is wrong.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/" size="lg">
            Go home
          </Button>
          <Button href="/cadenceavault" variant="secondary" size="lg">
            Cadencea Vault
          </Button>
        </div>
      </div>
    </Container>
  );
}
