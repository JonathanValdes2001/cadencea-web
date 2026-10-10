import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPreviewSite } from '@/lib/site-channel.mjs';
import { getSeller } from '@/lib/v2-demo/sellers';
import Container from '@/components/ui/Container';
import SellerCatalog from '@/components/v2/market/SellerCatalog';
import SellerHeader from '@/components/v2/market/SellerHeader';

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isPreviewSite()) notFound();
  const seller = getSeller((await params).handle);
  if (!seller) notFound();
  return { title: seller.displayName };
}

export default async function SellerPage({ params }: Props) {
  // Repeats the (v2) layout gate (so does generateMetadata): Next renders a page
  // alongside its layout, so without it the page would ride along in production's 404.
  if (!isPreviewSite()) notFound();
  const seller = getSeller((await params).handle);
  if (!seller) notFound();
  return (
    <>
      <SellerHeader seller={seller} />
      <Container className="py-10 lg:py-14">
        <SellerCatalog handle={seller.handle} />
      </Container>
    </>
  );
}
