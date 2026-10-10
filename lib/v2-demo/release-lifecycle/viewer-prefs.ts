/**
 * Per-viewer conveniences for Publish and Studio, kept in this browser only:
 * the first-time seller step (RL §5.1) and the last Studio tab (RL §6.1 "per
 * viewer, in localStorage"). Both use the demo store, so every read and write
 * is in try/catch and the server renders the defaults. Neither is demo data
 * that other areas read; "Reset demo data" clears both.
 */
import type { StudioTab } from './types.ts';
import { createDemoStore } from '../storage.ts';
import { PERSONA } from '../sellers.ts';

export interface SellerProfile {
  handle: string;
  displayName: string;
  /** The first-time seller step was completed in this browser. */
  confirmed: boolean;
}

const DEFAULT_SELLER_PROFILE: SellerProfile = {
  handle: PERSONA.sellerHandle,
  displayName: PERSONA.artistName,
  confirmed: false,
};

export const sellerProfileStore = createDemoStore<SellerProfile>({
  key: 'cadencea.v2-demo.seller-profile.v1',
  version: '1',
  seed: DEFAULT_SELLER_PROFILE,
});

export const studioTabStore = createDemoStore<StudioTab | null>({
  key: 'cadencea.v2-demo.studio-tab.v1',
  version: '1',
  seed: null,
});
