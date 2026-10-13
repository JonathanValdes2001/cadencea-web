import Link from 'next/link';
import Button from '@/components/ui/Button';

/**
 * Cloud Storage Overview — ACCOUNT page, not a vault/project manager.
 * Usage lives in the Vault app and on the Subscription page; this page points
 * there instead of showing numbers it can't verify.
 */
export default function CloudStorageOverview() {
  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Cloud storage.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-muted">
            To manage vault projects, open the Cadencea Vault desktop app.
          </p>
        </header>

        {/* Usage */}
        <section className="mb-8 rounded-md border border-line bg-canvas p-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">See your storage</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Your cloud storage usage is shown in Cadencea Vault and on your Subscription page.
          </p>
          <Button href="/account/subscription" className="mt-6">
            Go to Subscription
          </Button>
        </section>

        {/* Info banner */}
        <section className="rounded-md border border-line bg-elevated px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Managing your projects
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Project management (creating, editing, and organizing vaults) is
            done exclusively in the Cadencea Vault desktop application.
          </p>
          <Link
            href="/cadenceavault"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Download Cadencea Vault
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
