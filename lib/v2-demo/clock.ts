/**
 * The demo clock (WEB-V2-SPEC §2.5, RELEASE-LIFECYCLE §7.2).
 *
 * Every eligibility check and relative date in the v2 demo reads DEMO_NOW,
 * never the machine's clock, so the seeded windows (refunds, returns, appeals,
 * Harbor Lights' release date) behave the same whenever the demo is opened,
 * and server and client render identical dates.
 */

export const DEMO_NOW = '2026-10-10T12:00:00Z';

const DEMO_NOW_MS = Date.parse(DEMO_NOW);
const DAY_MS = 24 * 60 * 60 * 1000;

let actionCounter = 0;

/** ISO 8601 UTC without milliseconds, the format every demo timestamp uses. */
export function toIso(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * The time for a new demo event or lot: DEMO_NOW plus one second per action,
 * so events keep their order. Pass the latest stored timestamp so actions made
 * after a reload still sort after the ones saved before it.
 */
export function nextDemoTime(latest?: string | null): string {
  actionCounter += 1;
  let ms = DEMO_NOW_MS + actionCounter * 1000;
  const latestMs = latest ? Date.parse(latest) : NaN;
  if (!Number.isNaN(latestMs) && ms <= latestMs) {
    actionCounter = Math.floor((latestMs - DEMO_NOW_MS) / 1000) + 1;
    ms = DEMO_NOW_MS + actionCounter * 1000;
  }
  return toIso(ms);
}

export function addDays(iso: string, days: number): string {
  return toIso(Date.parse(iso) + days * DAY_MS);
}

/** Whole days from `from` to `to`, rounded down (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** True when `iso` is at or before `now`. */
export function isAtOrBefore(iso: string, now: string = DEMO_NOW): boolean {
  return Date.parse(iso) <= Date.parse(now);
}
