/**
 * The Studio buyers panel's demo earnings (RL §6.3, CREDITS-MODEL §6.2, §7).
 * Pure, so the machine tests check it against the seeds.
 */
import { cardSellerEarnsEurCents, sellerEarnsEurCents } from '../credits/config.ts';
import type { Release, ReleasePayload, Revision } from './types.ts';

/** Seller earnings for one sale of a version (CREDITS-MODEL §6.2, §7), in euro cents. */
export function earningsPerSale(payload: ReleasePayload): number {
  if (payload.kind === 'beat') {
    // Leases are priced per tier; the demo counts every lease at the first enabled tier.
    const tier = payload.tiers.find((t) => t.enabled && t.tier !== 'exclusive');
    return tier ? cardSellerEarnsEurCents(tier.price.amountMinor) : 0;
  }
  const price = payload.price;
  if (price.kind === 'credits') return sellerEarnsEurCents(price.credits);
  if (price.kind === 'card') return cardSellerEarnsEurCents(price.amount.amountMinor);
  return 0;
}

/** The exclusive sale that took a beat off sale for good (T26), in euro cents. */
function exclusiveEarnings(payload: ReleasePayload | null): number {
  if (payload?.kind !== 'beat') return 0;
  const tier = payload.tiers.find((t) => t.tier === 'exclusive' && t.enabled);
  return tier ? cardSellerEarnsEurCents(tier.price.amountMinor) : 0;
}

/**
 * What the release has earned: each version's buyers at that version's price,
 * because a price change applies only to purchases after its approval (RL L6).
 * Sales that no version accounts for are counted at the live version's price.
 */
export function demoEarnings(release: Release, revisions: readonly Revision[]): number {
  const stats = release.demoStats;
  if (!stats?.sales) return 0;
  const approved = revisions.filter((r) => r.version !== null);
  const current = approved.find((r) => r.id === release.currentRevisionId) ?? approved[approved.length - 1] ?? null;
  let cents = 0;
  let counted = 0;
  for (const [version, count] of Object.entries(stats.ownersByVersion ?? {})) {
    const revision = approved.find((r) => r.version === Number(version));
    if (!revision) continue;
    cents += count * earningsPerSale(revision.payload);
    counted += count;
  }
  if (current && stats.sales > counted) cents += (stats.sales - counted) * earningsPerSale(current.payload);
  if (release.unpublished?.cause === 'exclusive_sold') cents += exclusiveEarnings(current?.payload ?? null);
  return cents;
}
