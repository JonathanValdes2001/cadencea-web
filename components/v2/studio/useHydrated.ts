'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during server rendering and hydration, true after. Studio pages render
 * the seed state on the server; a release created in this browser only exists
 * after hydration, so pages wait for this before saying "not found".
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
