import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import Container from '@/components/ui/Container';
import PersonaBanner from '@/components/v2/common/PersonaBanner';
import BalanceCards from '@/components/v2/credits/BalanceCards';
import CreditsExplainer from '@/components/v2/credits/CreditsExplainer';
import LedgerTable from '@/components/v2/credits/LedgerTable';
import ResetWalletButton from '@/components/v2/credits/ResetWalletButton';
import TopUpPanel from '@/components/v2/credits/TopUpPanel';
import { WALLET_COPY } from '@/lib/v2-demo/credits/copy';

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  return { title: 'Credits (preview)' };
}

/**
 * The demo wallet (WEB-V2-SPEC §4.8). Every number comes from the credits store,
 * which starts as CREDITS-MODEL §10 (Maya Lind on Standard, 289 credits) and
 * keeps this browser's demo changes.
 */
export default function CreditsPage() {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Credits · Demo wallet</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">Your credits</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted md:text-lg">
          Credits aren&rsquo;t on sale yet. This wallet uses sample data so you can see how they&rsquo;ll work.
        </p>
      </header>
      <PersonaBanner className="mt-6" />

      <div className="mt-10">
        <BalanceCards />
        <p className="mt-4 text-sm text-ink-muted">{WALLET_COPY.detectLine}</p>
      </div>

      <div className="mt-14 border-t border-line pt-10 lg:mt-20">
        <TopUpPanel />
      </div>

      <div className="mt-14 border-t border-line pt-10 lg:mt-20">
        <LedgerTable />
      </div>

      <div className="mt-14 border-t border-line pt-10 lg:mt-20">
        <CreditsExplainer />
      </div>

      <footer className="mt-14 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{WALLET_COPY.footer}</p>
        <ResetWalletButton />
      </footer>
    </Container>
  );
}
