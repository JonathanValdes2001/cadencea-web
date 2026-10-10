import React from 'react';
import { Check, Close } from '@/components/ui/Icons';
import { fill } from '@/lib/v2-demo/format';
import { LICENSE_COPY } from '@/lib/v2-demo/market/copy';
import { sellerName } from '@/lib/v2-demo/market/display';
import type { MarketListing } from '@/lib/v2-demo/market/types';
import { RELEASE_TYPE_INFO } from '@/lib/v2-demo/release-lifecycle/types';

function List({ title, items, allowed }: { title: string; items: readonly string[]; allowed: boolean }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
            {allowed ? (
              <Check size={16} className="mt-0.5 shrink-0 text-tone-success" />
            ) : (
              <Close size={16} className="mt-0.5 shrink-0 text-tone-danger" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A plain-language summary of the listing's license family (WEB-V2-SPEC §4.4
 * item 6). Songs are stream only in this build, so they have none.
 */
export default function LicenseSummary({ listing }: { listing: MarketListing }) {
  const family = RELEASE_TYPE_INFO[listing.type].license;
  let body: React.ReactNode;
  switch (family) {
    case 'rf_asset':
      body = (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <List title={LICENSE_COPY.canTitle} items={LICENSE_COPY.rfAsset.can} allowed />
            <List title={LICENSE_COPY.cantTitle} items={LICENSE_COPY.rfAsset.cant} allowed={false} />
          </div>
          <p className="mt-4 text-sm text-ink-muted">{LICENSE_COPY.rfAsset.note}</p>
        </>
      );
      break;
    case 'splits':
      body = <p className="text-sm leading-relaxed text-ink-muted">{LICENSE_COPY.splits}</p>;
      break;
    case 'beat_lease':
      body = (
        <>
          <p className="text-sm leading-relaxed text-ink-muted">
            {fill(LICENSE_COPY.beatLease, { name: sellerName(listing.sellerHandle) })}
          </p>
          {listing.leaseTiers.some((t) => t.tier === 'exclusive') && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-ink">{LICENSE_COPY.exclusiveTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{LICENSE_COPY.exclusive}</p>
            </>
          )}
        </>
      );
      break;
    case 'theme_personal':
      body = <p className="text-sm leading-relaxed text-ink-muted">{LICENSE_COPY.themePersonal}</p>;
      break;
    default:
      return null;
  }

  return (
    <section aria-labelledby="license-summary" className="border-t border-line pt-8">
      <h2 id="license-summary" className="text-lg font-semibold tracking-tight text-ink">
        {LICENSE_COPY.title}
      </h2>
      <div className="mt-4">{body}</div>
      <p className="mt-4 text-xs text-ink-subtle">{LICENSE_COPY.footer}</p>
    </section>
  );
}
