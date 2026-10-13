import Link from 'next/link';

export default function PluginsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24 text-ink lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">VST plugins</h1>
      <p className="mt-6 max-w-xl text-ink-muted">We do not currently offer VST plugins for sale.</p>
      <Link href="/software" className="mt-8 inline-flex font-semibold text-accent hover:text-accent-hover">Explore our software</Link>
    </div>
  );
}
