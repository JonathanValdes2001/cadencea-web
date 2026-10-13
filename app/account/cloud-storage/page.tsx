import Link from 'next/link';

export default function CloudStorageOverview() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 text-ink lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Account</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Cloud storage.</h1>
      <p className="mt-6 max-w-xl text-ink-muted">
        Your current storage usage is shown on your Subscription page and in Cadencea Vault.
        Manage projects and connected devices in the desktop app.
      </p>
      <Link href="/account/subscription" className="mt-8 inline-flex rounded-sm bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover">
        View storage and subscription
      </Link>
    </div>
  );
}
