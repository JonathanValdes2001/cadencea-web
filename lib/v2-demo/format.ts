/**
 * Display formatting for the v2 demo. Every function is pure and locale-fixed
 * (en-US digits, UTC dates), so the server and the browser render the same text.
 */
import type { KeyValue, Money, PitchClass } from './release-lifecycle/types.ts';
import { CREDITS } from './credits/config.ts';
import { DEMO_NOW } from './clock.ts';

const MINUS = '−';

const twoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function signed(value: number, body: (abs: number) => string): string {
  return value < 0 ? `${MINUS}${body(-value)}` : body(value);
}

/** Euros with two decimals: formatEur(6) → "€6.00". `trimZeros` drops ".00" ("From €30"). */
export function formatEur(euros: number, opts: { trimZeros?: boolean } = {}): string {
  return signed(euros, (abs) => {
    if (opts.trimZeros && Number.isInteger(abs)) return `€${wholeNumber.format(abs)}`;
    return `€${twoDecimals.format(abs)}`;
  });
}

export function formatEurCents(cents: number, opts: { trimZeros?: boolean } = {}): string {
  return formatEur(cents / 100, opts);
}

/** Norwegian kroner, used only by the /stream teaser: formatNok(49) → "NOK 49.00". */
export function formatNok(kroner: number): string {
  return signed(kroner, (abs) => `NOK ${twoDecimals.format(abs)}`);
}

/** A RELEASE-LIFECYCLE `Money` value (minor units). */
export function formatMoney(money: Money, opts: { trimZeros?: boolean } = {}): string {
  const major = money.amountMinor / 100;
  return money.currency === 'NOK' ? formatNok(major) : formatEur(major, opts);
}

export function creditsToEurCents(credits: number): number {
  return credits * CREDITS.eurCentsPerCredit;
}

/** formatCredits(1240) → "1,240 credits"; formatCredits(1) → "1 credit". */
export function formatCredits(credits: number): string {
  const unit = Math.abs(credits) === 1 ? 'credit' : 'credits';
  return signed(credits, (abs) => `${wholeNumber.format(abs)} ${unit}`);
}

/** Every credit price carries its euro price (CREDITS-MODEL §9): "30 credits (€3.00)". */
export function formatCreditPrice(credits: number): string {
  return `${formatCredits(credits)} (${formatEurCents(creditsToEurCents(credits))})`;
}

/* ------------------------------------------------------------------ */
/* Musical keys                                                        */
/* ------------------------------------------------------------------ */

export const PITCH_CLASSES: readonly PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

/** URL encoding (WEB-V2-SPEC §1.2): "F#m" for minor, "F#" for major, "none" for No key. */
export function encodeKey(key: KeyValue): string {
  if (key === null) return 'none';
  return key.mode === 'Minor' ? `${key.root}m` : key.root;
}

/** The inverse of encodeKey. Returns undefined for anything it doesn't recognise. */
export function decodeKey(code: string): KeyValue | undefined {
  if (code === 'none') return null;
  const minor = code.endsWith('m');
  const root = minor ? code.slice(0, -1) : code;
  if (!(PITCH_CLASSES as readonly string[]).includes(root)) return undefined;
  return { root: root as PitchClass, mode: minor ? 'Minor' : 'Major' };
}

/** "F# Minor", "C Major" or "No key". */
export function formatKey(key: KeyValue): string {
  return key === null ? 'No key' : `${key.root} ${key.mode}`;
}

/** DETECT-SPEC thresholds (DECISIONS.md D4): the UI shows the level, the number only in a tooltip. */
export function confidenceLevel(confidence: number): 'High' | 'Medium' | 'Low' {
  if (confidence >= 0.6) return 'High';
  if (confidence >= 0.3) return 'Medium';
  return 'Low';
}

/* ------------------------------------------------------------------ */
/* Durations, sizes and dates                                          */
/* ------------------------------------------------------------------ */

/** formatDuration(225000) → "3:45"; an hour or more → "1:02:05". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Decimal units, one decimal below 10: "1.2 GB", "820 MB", "12 KB". */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const digits = unit > 0 && value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "12 Sep 2026", always in UTC whatever the viewer's time zone. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "September 2026" ("Selling since {month year}"). */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Relative to the demo clock: "today", "yesterday", "3 days ago", "tomorrow",
 * "in 3 days"; two weeks or more away falls back to formatDate.
 */
export function formatRelative(iso: string, now: string = DEMO_NOW): string {
  const startOfDay = (value: string) => {
    const d = new Date(value);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  const days = Math.round((startOfDay(now) - startOfDay(iso)) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days === -1) return 'tomorrow';
  if (days > 1 && days < 14) return `${days} days ago`;
  if (days < -1 && days > -14) return `in ${-days} days`;
  return formatDate(iso);
}

/* ------------------------------------------------------------------ */
/* Copy templates                                                      */
/* ------------------------------------------------------------------ */

/** Fills "{name}" placeholders in a copy string. Unknown placeholders are left as they are. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
