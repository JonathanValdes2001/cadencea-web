'use client';

import React, { createContext, useContext } from 'react';

/**
 * Whether the plugin store is open on this deployment (the launch switch), handed from a
 * server layout to client pages, since the switch can only be read on the server.
 */
const StoreOpenContext = createContext(false);

export function StoreOpenProvider({ open, children }: { open: boolean; children: React.ReactNode }) {
  return <StoreOpenContext.Provider value={open}>{children}</StoreOpenContext.Provider>;
}

export function useStoreOpen(): boolean {
  return useContext(StoreOpenContext);
}
