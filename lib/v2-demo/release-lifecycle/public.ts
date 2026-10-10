/**
 * The public face of Studio releases, for the Market (WEB-V2-SPEC §6.1).
 *
 * This is the foundation stub: it returns null and [] so Market rows linked to a
 * release render their seed values. Package C replaces the bodies with reads of
 * the lifecycle store (`isPublic` evaluated at DEMO_NOW, pending revisions never
 * shown) and must keep these signatures; package B only calls them.
 */
import type {
  BpmString,
  Id,
  IsoDateTime,
  KeyValue,
  LeaseTier,
  Price,
  ReleaseStatus,
  ReleaseType,
  SplitTerms,
} from './types.ts';

/** What buyers see of a release's current (approved) revision. */
export interface PublicReleaseView {
  isPublic: boolean;
  status: ReleaseStatus;
  version: number;
  updatedAt: IsoDateTime;
  /** The change note of the current version; null for version 1. */
  whatsNew: string | null;
  title: string;
  coverSeed: string;
  price: Price;
  leaseTiers?: LeaseTier[];
  splitTerms?: SplitTerms;
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
  void releaseId;
  return null;
}

const NO_RELEASES: PublicReleaseListing[] = [];

/** Every release that is public at DEMO_NOW, newest first. Stable reference while unchanged. */
export function usePublicReleases(): PublicReleaseListing[] {
  return NO_RELEASES;
}
