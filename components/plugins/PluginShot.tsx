import React from 'react';
import Image from 'next/image';
import type { PluginScreenshot } from '@/lib/plugins/products';

/**
 * A plugin screenshot in a dark frame. The plugins have dark interfaces, so the
 * frame stays dark on white pages too; `accent` draws the family's color as a
 * thin rule along the top edge (decoration, never text).
 */
export default function PluginShot({
  shot,
  accent,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority = false,
  crop = false,
  className = '',
}: {
  shot: PluginScreenshot;
  accent?: string;
  sizes?: string;
  priority?: boolean;
  /** Fill a 16:10 box (cards) instead of showing the whole picture. */
  crop?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-white/10 bg-showroom-to ring-1 ring-white/5 ${
        crop ? 'aspect-[16/10]' : ''
      } ${className}`}
    >
      {accent && (
        <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-0.5" style={{ backgroundColor: accent }} />
      )}
      {crop ? (
        <Image src={shot.src} alt={shot.alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
      ) : (
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full"
        />
      )}
    </div>
  );
}
