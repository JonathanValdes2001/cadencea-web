'use client';

import { useEffect, useState } from 'react';

/**
 * Loads a module's own chunk after mount, only when `enabled` (the v2 preview).
 * Production pages therefore never download it, and the server and the first
 * client render are identical (null), so nothing can mismatch on hydration.
 *
 * Why not next/dynamic or React.lazy: a server-rendered next/dynamic chunk
 * gets a <link rel="preload"> without the CSP nonce, which the nonce-based CSP
 * blocks, and both add a Suspense boundary. A plain import() loads through the
 * bundler's runtime, which 'strict-dynamic' trusts. Use it in pages, not in
 * the root layout: any lazily loaded chunk in the Navbar made the page's useId
 * hydration flaky under next dev (2 in 36 loads), so the Navbar imports its
 * credits chip statically.
 */
export function useLazyModule<M>(load: () => Promise<M>, enabled: boolean): M | null {
  const [mod, setMod] = useState<M | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load()
      .then((loaded) => {
        if (alive) setMod(() => loaded);
      })
      .catch(() => {
        // A chunk that fails to load leaves the preview extra out; the page still works.
      });
    return () => {
      alive = false;
    };
    // `load` is an inline import() wrapper; only `enabled` decides whether to load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return mod;
}
