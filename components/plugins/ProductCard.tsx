import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { priceLabel, type ListedProduct } from '@/lib/plugins/catalog';
import { productPageHref, type PluginProduct } from '@/lib/plugins/products';

/**
 * A store card: the plugin window floating on a stage, then maker line, name,
 * one-line description and price. Every stage is the same size, so the grid
 * lines up while each plugin keeps its own shape. The whole card is one link.
 */
export default function ProductCard({ product, listing }: { product: PluginProduct; listing: ListedProduct }) {
  const free = listing.isFree || listing.priceMinor === 0;
  const shot = product.screenshot;
  return (
    <li className="list-none">
      <Link href={productPageHref(product.id)} className="group block h-full rounded-md focus-visible:outline-offset-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-elevated">
          <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
            <Image
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              sizes="(min-width: 768px) 45vw, 90vw"
              className="product-float h-auto max-h-full w-auto max-w-full"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 px-1 pt-5">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: product.accent }} />
            Cadencea · {product.family}
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-ink group-hover:text-accent-ink">{product.name}</h3>
          <p className="text-sm leading-relaxed text-ink-muted">{product.tagline}</p>
          <p className="mt-1 flex items-baseline justify-between gap-3">
            <span className="text-base font-bold text-ink">{priceLabel(listing)}</span>
            <span className="text-right text-xs text-ink-muted">
              {free ? 'Free with a Cadencea account' : 'VAT included where it applies'}
            </span>
          </p>
        </div>
      </Link>
    </li>
  );
}
