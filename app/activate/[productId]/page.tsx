import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container, { ShowroomGlow } from '@/components/ui/Container';
import ActivateSteps from '@/components/plugins/ActivateSteps';
import PluginShot from '@/components/plugins/PluginShot';
import DownloadButton from '@/components/vault/DownloadButton';
import { loadCadenceaVaultReleases } from '@/lib/cadencea-vault-releases.mjs';
import { isValidProductId, normalizeChannel } from '@/lib/plugins/catalog';
import { pluginById, withListing } from '@/lib/plugins/products';
import { pluginStoreOpen } from '@/lib/plugins/store-gate.mjs';
import { loadStoreListing } from '@/lib/plugins/store-products';

/*
 * /activate/<productId>[?channel=beta]: the page a plugin opens when Cadencea
 * Vault isn't installed. The URL is compiled into the plugins
 * (https://cadencea.app/activate/<id>, plus ?channel=beta in beta builds), so
 * it never moves and works on every deployment, store open or not. Unknown or
 * malformed ids are a 404. Never indexed.
 */

type Params = Promise<{ productId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FEED_TIMEOUT_MS = 3000;

function productFor(productId: string) {
  // Next hands the segment over decoded; the id rule rejects anything else.
  if (!isValidProductId(productId)) notFound();
  const product = pluginById(productId);
  if (!product) notFound();
  return product;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = productFor((await params).productId);
  return {
    title: `Activate ${product.name}`,
    description: `Activate ${product.name} with Cadencea Vault.`,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

export default async function ActivatePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const product = productFor((await params).productId);
  const channel = normalizeChannel((await searchParams).channel);
  const returnTo = `/activate/${product.id}${channel === 'beta' ? '?channel=beta' : ''}`;
  const appName = channel === 'beta' ? 'CadenceaVault Beta' : 'Cadencea Vault';

  const [{ products, apiReachable }, releases] = await Promise.all([
    loadStoreListing(),
    loadCadenceaVaultReleases(fetch, { timeoutMs: FEED_TIMEOUT_MS, beta: channel === 'beta' }),
  ]);
  const listing = withListing(products, product.id);
  if (!listing) notFound();

  const anyDownload = Boolean(releases.windows || releases.macArm64 || releases.macX64);
  const downloads = (
    <div className="on-dark rounded-md bg-showroom p-5 text-dark-text">
      {anyDownload ? (
        <div className="flex flex-wrap gap-3">
          <DownloadButton platform="Windows" variant="primary" href={releases.windows?.downloadUrl} />
          <DownloadButton platform="Mac (Apple Silicon)" variant="onDark" href={releases.macArm64?.downloadUrl} />
          <DownloadButton platform="Mac (Intel)" variant="onDark" href={releases.macX64?.downloadUrl} />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-dark-muted">
          {appName} downloads are temporarily unavailable. Please check back soon, or contact{' '}
          <a href="mailto:support@cadencea.app" className="font-medium text-brand-300 hover:text-brand-200">
            support@cadencea.app
          </a>
          .
        </p>
      )}
      <p className="mt-4 text-xs text-dark-muted">Windows 10 or later · macOS 12 or later (Apple Silicon and Intel)</p>
    </div>
  );

  return (
    <div className="bg-canvas text-ink">
      <section className="on-dark relative isolate overflow-hidden bg-showroom py-12 text-dark-text sm:py-16">
        <ShowroomGlow />
        <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: product.accent }} />
              Activate · {channel === 'beta' ? 'Beta' : product.family}
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Activate {product.name}.</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-dark-muted md:text-lg">
              {product.name} is activated and installed by {appName}, the free Cadencea app for Windows and macOS. It
              takes three steps.
            </p>
          </div>
          <PluginShot shot={product.screenshot} accent={product.accent} priority sizes="(min-width: 1024px) 40vw, 100vw" />
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <ActivateSteps
            productId={product.id}
            productName={product.name}
            listing={listing}
            apiReachable={apiReachable}
            storeOpen={pluginStoreOpen()}
            channel={channel}
            returnTo={returnTo}
            downloads={downloads}
          />
        </div>
      </section>
    </div>
  );
}
