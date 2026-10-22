import React from 'react';
import CoverArt from '@/components/ui/CoverArt';
import Price from '@/components/ui/Price';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { RELEASE_TYPE_INFO, type ReleasePayload, type ReleaseType } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { ReviewDepthChip } from '@/components/v2/studio/LiveVsPending';

/** The cheapest enabled lease, for "From €30". */
function fromEurCents(payload: ReleasePayload): number | undefined {
  if (payload.kind !== 'beat') return undefined;
  const prices = payload.tiers.filter((t) => t.enabled).map((t) => t.price.amountMinor);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

/** The first-release wizard's right rail (WEB-V2-SPEC §4.6): cover, title, type, price and review depth. */
export default function WizardSummary({ type, payload, coverSeed }: { type: ReleaseType; payload: ReleasePayload | null; coverSeed: string }) {
  return (
    <section aria-labelledby="wizard-summary" className="rounded-md border border-line p-4">
      <h2 id="wizard-summary" className="text-sm font-semibold uppercase tracking-widest text-ink-subtle">
        {WIZARD_UI.summary}
      </h2>
      <div className="mt-3 w-32">
        <CoverArt seed={payload?.cover?.file.demoAssetKey ?? coverSeed} kind={type} decorative />
      </div>
      <p className="mt-3 break-words font-semibold text-ink">{payload?.title || '—'}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-ink-subtle">{WIZARD_UI.type}</dt>
          <dd className="text-ink">{WIZARD_COPY.tiles[type].title}</dd>
        </div>
        {payload && (
          <div>
            <dt className="text-ink-subtle">{WIZARD_UI.price}</dt>
            <dd>
              <Price price={payload.price} fromEurCents={fromEurCents(payload)} size="sm" />
            </dd>
          </div>
        )}
        <div>
          <dt className="text-ink-subtle">{WIZARD_UI.reviewLabel}</dt>
          <dd className="mt-1">
            <ReviewDepthChip depth={RELEASE_TYPE_INFO[type].firstReviewDepth} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
