'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import {
  CART_STORAGE_KEY,
  EMPTY_CART,
  cartReducer,
  parseStoredCart,
  serializeCart,
  type CartItem,
} from '@/lib/plugins/cart-state';

interface CartApi {
  items: CartItem[];
  /** False until the saved cart has been read, so the navbar count doesn't flash 0 → 1. */
  ready: boolean;
  has: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

function readStored(): CartItem[] {
  try {
    return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    // Storage blocked (private mode, site data off): the cart lives for this page only.
    return [];
  }
}

/**
 * The plugin cart, saved in this browser. Tabs stay in step through the
 * `storage` event. Nothing here talks to the network; checkout goes through
 * lib/plugins/checkout.ts.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch({ type: 'hydrate', items: readStored() });
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) dispatch({ type: 'hydrate', items: readStored() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Saves after the first read only: before it, `state` is the empty initial cart.
  useEffect(() => {
    if (!ready) return;
    try {
      const next = serializeCart(state);
      if (window.localStorage.getItem(CART_STORAGE_KEY) !== next) window.localStorage.setItem(CART_STORAGE_KEY, next);
    } catch {
      // Not saved; the cart still works until the page is closed.
    }
  }, [state, ready]);

  const add = useCallback((productId: string) => dispatch({ type: 'add', productId }), []);
  const remove = useCallback((productId: string) => dispatch({ type: 'remove', productId }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const api = useMemo<CartApi>(
    () => ({
      items: state.items,
      ready,
      has: (productId: string) => state.items.some((item) => item.productId === productId),
      add,
      remove,
      clear,
    }),
    [state.items, ready, add, remove, clear],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
