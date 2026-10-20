import React from 'react';
import Link from 'next/link';
import { priceLabel, type ListedProduct } from '@/lib/plugins/catalog';
import { productPageHref, type PluginProduct } from '@/lib/plugins/products';
import PluginShot from './PluginShot';

/**
 * A store card: screenshot, maker line, name, one-line description, price.
 * The whole card is one link to the product page.
 */
export default function ProductCard({ product, listing }: { product: PluginProduct; listing: ListedProduct }) {
  const free = listing.isFree || listing.priceMinor === 0;
  return (
    <li className="list-none">
      <Link
        href={productPageHref(product.id)}
        className="hover-lift group block h-full overflow-hidden rounded-md border border-line bg-canvas hover:border-line-strong"
      >
        <PluginShot shot={product.screenshot} accent={product.accent} crop className="rounded-none border-0 ring-0" sizes="(min-width: 768px) 50vw, 100vw" />
        <div className="flex flex-col gap-2 p-5">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: product.accent }} />
            Cadencea · {product.family}
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-ink group-hover:text-accent-ink">{product.name}</h3>
          <p className="text-sm leading-relaxed text-ink-muted">{product.tagline}</p>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-base font-bold text-ink">{priceLabel(listing)}</span>
            <span className="text-right text-xs text-ink-muted">
              {free ? 'Free with a Cadencea account' : 'VAT included where it applies'}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
