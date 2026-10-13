/**
 * Per-viewer conveniences for Studio, kept in this browser only: the last
 * Studio tab (RL §6.1 "per viewer, in localStorage"). It uses the demo store,
 * so every read and write is in try/catch and the server renders the default.
 * "Reset demo data" clears it. The old first-time seller step is now the
 * creator profile (creator.ts, PUBLISH-PROCEDURE §1).
 */
import type { StudioTab } from './types.ts';
import { createDemoStore } from '../storage.ts';

export const studioTabStore = createDemoStore<StudioTab | null>({
  key: 'cadencea.v2-demo.studio-tab.v1',
  version: '1',
  seed: null,
});
