import { useSyncExternalStore } from 'react';
import type { DemoStore } from './storage.ts';

/**
 * Reads a demo store in a client component. Server rendering and hydration use
 * the seed, then the stored state (if any) replaces it, so hydration never
 * mismatches.
 */
export function useDemoStore<T>(store: DemoStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
