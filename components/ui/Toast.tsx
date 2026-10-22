'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Close } from './Icons';

interface ToastItem {
  id: number;
  message: string;
}

interface ToastApi {
  /** Shows a message for 5 seconds. Demo actions start it with "Demo:". */
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

const DURATION_MS = 5000;

/**
 * One polite live region for the whole site. Toasts sit bottom-left from lg
 * (the Demo reviewer panel docks bottom-right) and full width at the bottom on
 * small screens.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-2 p-4 lg:inset-x-auto lg:left-6 lg:bottom-6 lg:w-96 lg:p-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="ui-toast pointer-events-auto flex items-start justify-between gap-3 rounded-md bg-dark py-2 pl-4 pr-2 text-sm text-dark-text shadow-dropdown on-dark"
          >
            <p className="py-2.5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-dark-muted hover:bg-white/10 hover:text-dark-text"
            >
              <Close size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
