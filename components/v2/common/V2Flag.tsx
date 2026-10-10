'use client';

import React, { createContext, useContext } from 'react';

/*
 * Carries the server-computed "is this the v2 preview?" flag to client
 * components (WEB-V2-SPEC §2.2). The flag is computed once, on the server, in
 * RootLayout; client code must never compute it itself, because VERCEL_ENV isn't
 * available in the browser. The default is false, so anything rendered
 * outside the provider behaves like production.
 */
const V2FlagContext = createContext(false);

export function V2FlagProvider({ showV2, children }: { showV2: boolean; children: React.ReactNode }) {
  return <V2FlagContext.Provider value={showV2}>{children}</V2FlagContext.Provider>;
}

export function useShowV2(): boolean {
  return useContext(V2FlagContext);
}
