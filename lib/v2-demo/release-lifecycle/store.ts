/**
 * The Studio and Publish demo state, persisted per browser (RELEASE-LIFECYCLE
 * §7.2, WEB-V2-SPEC §2.5).
 *
 * One `LifecycleState` under DEMO_STORAGE_KEYS.releaseLifecycle; its spec
 * version is the store version, so a spec bump reseeds silently. Change it only
 * through `dispatch`, which dates every action with the demo clock and runs the
 * pure reducer. Read it in client components with `useLifecycle()`.
 */
import type { ApplyResult, Actor, IsoDateTime, LifecycleAction, LifecycleState } from './types.ts';
import { RELEASE_LIFECYCLE_SPEC_VERSION } from './types.ts';
import { nextDemoTime } from '../clock.ts';
import { createDemoStore, DEMO_STORAGE_KEYS } from '../storage.ts';
import { useDemoStore } from '../use-demo-store.ts';
import { PERSONA } from '../sellers.ts';
import { applyAction, DEMO_APPEAL_REVIEWER_ID, DEMO_REVIEWER_ID } from './machine.ts';
import { SEED_STATE } from './seeds.ts';

export const lifecycleStore = createDemoStore<LifecycleState>({
  key: DEMO_STORAGE_KEYS.releaseLifecycle,
  version: RELEASE_LIFECYCLE_SPEC_VERSION,
  seed: SEED_STATE,
});

export function useLifecycle(): LifecycleState {
  return useDemoStore(lifecycleStore);
}

/** Maya Lind, releasing as Nightjar (DECISIONS.md D1). */
export const SELLER_ACTOR: Actor = { kind: 'seller', userId: PERSONA.userId };
/** The Demo reviewer's actors (§7.3). */
export const DEMO_REVIEWER: Actor = { kind: 'reviewer', reviewerId: DEMO_REVIEWER_ID };
export const DEMO_APPEAL_REVIEWER: Actor = { kind: 'reviewer', reviewerId: DEMO_APPEAL_REVIEWER_ID };
export const DEMO_SYSTEM: Actor = { kind: 'system', process: 'demo_simulator' };

/** The latest time already stored, so new actions sort after it even after a reload. */
function latestTime(state: LifecycleState): IsoDateTime | null {
  let latest = state.events[state.events.length - 1]?.at ?? null;
  for (const revision of Object.values(state.revisions)) {
    if (!latest || revision.updatedAt > latest) latest = revision.updatedAt;
  }
  return latest;
}

/** Runs one action at the next demo time and stores the result when it succeeds. */
export function dispatch(action: LifecycleAction, actor: Actor): ApplyResult {
  const state = lifecycleStore.getSnapshot();
  const result = applyAction(state, action, actor, nextDemoTime(latestTime(state)));
  if (result.ok) lifecycleStore.update(() => result.state);
  return result;
}

/** "Reset demo data": all 16 seeds again (§9.9). */
export function resetLifecycleDemo(): void {
  lifecycleStore.reset();
}
