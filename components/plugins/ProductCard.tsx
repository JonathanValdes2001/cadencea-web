import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { priceLabel, type ListedProduct } from '@/lib/plugins/catalog';
import { productPageHref, type PluginProduct } from '@/lib/plugins/products';

/**
 * A store card: the plugin window floating in its slot, then name, one-line
 * description and price. Every slot is the same size, so the grid lines up
 * while each plugin keeps its own shape. The whole card is one link.
 */
export default function ProductCard({ product, listing }: { product: PluginProduct; listing: ListedProduct }) {
  const shot = product.screenshot;
  return (
    <li className="list-none">
      <Link href={productPageHref(product.id)} className="group flex h-full flex-col rounded-md focus-visible:outline-offset-4">
        <div className="relative aspect-[4/3]">
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <Image
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="product-float h-auto max-h-full w-auto max-w-full"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-1 pt-3 text-center">
          <h3 className="text-base font-semibold tracking-tight text-ink group-hover:text-accent-ink">{product.name}</h3>
          <p className="text-sm leading-relaxed text-ink-muted">{product.tagline}</p>
          <p className="mt-auto pt-1 text-base font-bold text-ink">{priceLabel(listing)}</p>
        </div>
      </Link>
    </li>
  );
}
