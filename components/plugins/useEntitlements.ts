'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getEntitlements, type License } from '@/lib/plugins/access-client';

export type EntitlementsState =
  | { status: 'signed-out' | 'loading'; licenses: License[]; error: null }
  | { status: 'ready'; licenses: License[]; error: null }
  | { status: 'error'; licenses: License[]; error: unknown };

/**
 * The signed-in account's plugin licenses. Signed out (or while auth loads) it
 * reports no licenses; when the licensing API can't be reached it reports
 * `error` and the caller decides how much of the page still works.
 */
export function useEntitlements(): EntitlementsState & { reload: () => void } {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<EntitlementsState>({ status: 'loading', licenses: [], error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading) {
      setState({ status: 'loading', licenses: [], error: null });
      return;
    }
    if (!userId) {
      setState({ status: 'signed-out', licenses: [], error: null });
      return;
    }
    const controller = new AbortController();
    setState((previous) => ({ status: 'loading', licenses: previous.licenses, error: null }));
    getEntitlements(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', licenses: data.licenses, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', licenses: [], error });
      });
    return () => controller.abort();
  }, [authLoading, userId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
