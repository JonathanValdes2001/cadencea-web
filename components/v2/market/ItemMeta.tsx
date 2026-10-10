import React from 'react';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import {
  bpmLabel,
  contentsSummary,
  keyLabel,
  sizeAndFormat,
  songFormatLabel,
  synthVersionLabel,
} from '@/lib/v2-demo/market/display';
import type { MarketFile, MarketListing } from '@/lib/v2-demo/market/types';
import { PUBLIC_COPY } from '@/lib/v2-demo/release-lifecycle/copy';

/**
 * The details grid (WEB-V2-SPEC §4.4 item 3): BPM, key, files, size and format,
 * synth, and "Version {n} · Updated {date}".
 */
export default function ItemMeta({ listing, files }: { listing: MarketListing; files: readonly MarketFile[] }) {
  const rows: [string, string][] = [];
  if (listing.song) rows.push([ITEM_COPY.metaFormat, songFormatLabel(listing.song)]);
  // Themes have no tempo or key; the buy box says which Vault they work with.
  if (listing.type !== 'theme') {
    rows.push([ITEM_COPY.metaBpm, bpmLabel(listing.bpm)], [ITEM_COPY.metaKey, keyLabel(listing.key)]);
  }
  if (listing.files) rows.push([ITEM_COPY.metaFiles, contentsSummary(listing.files)]);
  if (files.length) rows.push([ITEM_COPY.metaSize, sizeAndFormat(files, listing.synth)]);
  if (listing.synth) rows.push([ITEM_COPY.metaSynth, synthVersionLabel(listing.synth, listing.minSynthVersion)]);

  return (
    <div>
      <h2 className="sr-only">{ITEM_COPY.metaTitle}</h2>
      {rows.length > 0 && (
        <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{label}</dt>
              <dd className="mt-1 text-sm text-ink tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-sm text-ink-muted tabular-nums">
        {fill(PUBLIC_COPY.versionUpdated, { n: listing.version, date: formatDate(listing.updatedAt) })}
      </p>
    </div>
  );
}
