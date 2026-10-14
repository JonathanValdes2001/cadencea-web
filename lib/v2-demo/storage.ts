/**
 * Browser persistence for the v2 demo (WEB-V2-SPEC §2.5).
 *
 * One localStorage key per area. Every read and write is wrapped in try/catch
 * and falls back to in-memory state (private windows, blocked storage). Each
 * stored object carries a version; a mismatch or unreadable value reseeds
 * silently. The server snapshot is always the seed, so server rendering shows
 * seed data and stored changes apply after hydration.
 *
 * Framework-free on purpose: `useDemoStore` (./use-demo-store.ts) binds a store
 * to React with useSyncExternalStore.
 */

export const DEMO_STORAGE_KEYS = {
  /** Studio and Publish: RELEASE-LIFECYCLE's `LifecycleState`. */
  releaseLifecycle: 'cadencea.v2-demo.release-lifecycle.v1',
  /** The credits wallet (starts as CREDITS-MODEL §10). */
  credits: 'cadencea.v2-demo.credits.v1',
  /** Market purchases, downloads and returns. */
  market: 'cadencea.v2-demo.market.v1',
  /** Publish's creator profile and its verification state (PUBLISH-PROCEDURE §1). Replaces `seller-profile.v1`. */
  creatorProfile: 'cadencea.v2-demo.creator-profile.v1',
} as const;

export interface DemoStore<T> {
  getSnapshot(): T;
  getServerSnapshot(): T;
  subscribe(listener: () => void): () => void;
  /** Applies an update; returning the same reference is a no-op. */
  update(updater: (current: T) => T): T;
  /** Back to the seed, and the stored copy is dropped. */
  reset(): void;
}

interface Envelope<T> {
  version: string;
  state: T;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * `seed` must be a module-level constant so the server snapshot keeps one
 * reference. `version` is the spec version the stored shape follows.
 */
export function createDemoStore<T>(opts: { key: string; version: string; seed: T; normalize?: (state: T) => T }): DemoStore<T> {
  const { key, version, seed } = opts;
  let current: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = browserStorage()?.getItem(key);
      if (!raw) return seed;
      const parsed = JSON.parse(raw) as Partial<Envelope<T>> | null;
      if (!parsed || parsed.version !== version || parsed.state === undefined) return seed;
      return opts.normalize ? opts.normalize(parsed.state) : parsed.state;
    } catch {
      return seed;
    }
  };

  const write = (state: T) => {
    try {
      const envelope: Envelope<T> = { version, state };
      browserStorage()?.setItem(key, JSON.stringify(envelope));
    } catch {
      // Storage full or blocked: the in-memory copy keeps working for this visit.
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    current = read();
    emit();
  };

  const getSnapshot = (): T => {
    if (current === undefined) current = browserStorage() ? read() : seed;
    return current;
  };

  return {
    getSnapshot,
    getServerSnapshot() {
      return seed;
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage);
        }
      };
    },
    update(updater) {
      const before = getSnapshot();
      const next = updater(before);
      if (next !== before) {
        current = next;
        write(next);
        emit();
      }
      return next;
    },
    reset() {
      current = seed;
      try {
        browserStorage()?.removeItem(key);
      } catch {
        // Nothing stored to drop.
      }
      emit();
    },
  };
}
