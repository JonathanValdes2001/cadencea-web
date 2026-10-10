/**
 * The public face of Studio releases, for the Market (WEB-V2-SPEC §6.1).
 *
 * Both hooks read the lifecycle store and evaluate `isPublic` at DEMO_NOW.
 * Buyers only ever see a release's current approved revision: pending updates
 * never show (RELEASE-LIFECYCLE §6.7). Server rendering and hydration use the
 * seeds, then stored demo changes apply. Package B only calls these.
 */
import { useMemo } from 'react';
import type {
  BpmString,
  FileRef,
  Id,
  IsoDateTime,
  KeyValue,
  LeaseTier,
  LifecycleState,
  Price,
  ReleaseStatus,
  ReleaseType,
  SplitTerms,
} from './types.ts';
import { DEMO_NOW } from '../clock.ts';
import { publicListings, toPublicView } from './selectors.ts';
import { useLifecycle } from './store.ts';

/** What buyers see of a release's current (approved) revision. */
export interface PublicReleaseView {
  isPublic: boolean;
  status: ReleaseStatus;
  version: number;
  updatedAt: IsoDateTime;
  /** The change note of the current version; null for version 1. */
  whatsNew: string | null;
  title: string;
  description: string;
  coverSeed: string;
  price: Price;
  leaseTiers?: LeaseTier[];
  splitTerms?: SplitTerms;
  /** A pack's contents (its items, plus the audio demo of preset and MIDI packs); absent for songs, beats and themes. */
  files?: FileRef[];
}

/** A public release as a Market grid row, including ones with no seed listing. */
export interface PublicReleaseListing extends PublicReleaseView {
  releaseId: Id;
  slug: string;
  type: ReleaseType;
  sellerHandle: string;
  bpm: BpmString | null;
  key: KeyValue;
  tags: string[];
}

/** The current state of a Market-linked release, or null when it isn't in the store. */
export function useCurrentRelease(releaseId: Id): PublicReleaseView | null {
  const state = useLifecycle();
  return useMemo(() => toPublicView(state, releaseId, DEMO_NOW), [state, releaseId]);
}

/**
 * `useCurrentRelease` for several releases at once, keyed by id. `releaseIds`
 * should be a module-level constant: the result is recomputed when it or the
 * state changes.
 */
export function useCurrentReleases(releaseIds: readonly Id[]): Readonly<Record<Id, PublicReleaseView | null>> {
  const state = useLifecycle();
  return useMemo(
    () => Object.fromEntries(releaseIds.map((id) => [id, toPublicView(state, id, DEMO_NOW)])),
    [state, releaseIds],
  );
}

// One list per state object, so every caller gets the same reference until the state changes.
const listingsByState = new WeakMap<LifecycleState, PublicReleaseListing[]>();

/** Every release that is public at DEMO_NOW, newest first. Stable reference while unchanged. */
export function usePublicReleases(): PublicReleaseListing[] {
  const state = useLifecycle();
  let listings = listingsByState.get(state);
  if (!listings) {
    listings = publicListings(state, DEMO_NOW);
    listingsByState.set(state, listings);
  }
  return listings;
}
