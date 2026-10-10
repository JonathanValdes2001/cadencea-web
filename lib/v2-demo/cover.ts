/**
 * Deterministic cover art (WEB-V2-SPEC §3.4). A seed always produces the same
 * picture on the server and in the browser, so covers need no image files and
 * hydration never mismatches. `components/ui/CoverArt.tsx` renders the spec
 * returned by `generateCover` as inline SVG.
 */
import type { ReleaseType } from './release-lifecycle/types.ts';

/** [bgFrom, bgTo, ink, highlight] */
export const PALETTES = {
  violet: ['#1A1033', '#7C3AED', '#C4B5FD', '#F5F3FF'],
  ember: ['#1C0F0A', '#C2410C', '#FDBA74', '#FFF7ED'],
  tide: ['#071A2B', '#0E7490', '#67E8F9', '#ECFEFF'],
  moss: ['#0B1A10', '#3F6212', '#BEF264', '#F7FEE7'],
  rose: ['#1F0A14', '#BE185D', '#F9A8D4', '#FDF2F8'],
  slate: ['#0F1115', '#334155', '#CBD5E1', '#F8FAFC'],
  gold: ['#1A1405', '#A16207', '#FDE68A', '#FEFCE8'],
  ice: ['#0B1020', '#4F46E5', '#A5B4FC', '#EEF2FF'],
} as const;
export type PaletteName = keyof typeof PALETTES;
const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

export type Motif = 'bars' | 'arcs' | 'orbits' | 'grid' | 'stripes' | 'monogram';
export type CoverKind = ReleaseType | 'avatar';

const MOTIF_BY_KIND: Readonly<Record<CoverKind, Motif>> = {
  sample_pack: 'bars',
  splits_pack: 'arcs',
  preset_pack: 'orbits',
  midi_pack: 'grid',
  beat: 'stripes',
  song: 'orbits',
  theme: 'arcs',
  avatar: 'monogram',
};

/** FNV-1a, 32-bit. */
export function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A small seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(seed: string): () => number {
  return mulberry32(hash(seed));
}

type Paint = 'ink' | 'highlight';

export type CoverShape =
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number; fill: Paint; opacity: number; rotate: number }
  | { type: 'circle'; cx: number; cy: number; r: number; fill: Paint | 'none'; stroke: Paint | 'none'; strokeWidth: number; opacity: number }
  | { type: 'arc'; d: string; stroke: Paint; strokeWidth: number; opacity: number };

export interface CoverSpec {
  palette: PaletteName;
  colors: { bgFrom: string; bgTo: string; ink: string; highlight: string };
  gradient:
    | { kind: 'linear'; x1: number; y1: number; x2: number; y2: number }
    | { kind: 'radial'; cx: number; cy: number; r: number };
  motif: Motif;
  shapes: CoverShape[];
  grain: boolean;
  /** Initials for the monogram motif. */
  monogram: string | null;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** "Kiln Theory" → "KT", "Lowfen" → "LO", "Mire & Mica" → "MM". */
export function initials(name: string): string {
  const words = name.split(/[^A-Za-z0-9À-ɏ]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x0 = round(cx + r * Math.cos(rad(startDeg)));
  const y0 = round(cy + r * Math.sin(rad(startDeg)));
  const x1 = round(cx + r * Math.cos(rad(startDeg + sweepDeg)));
  const y1 = round(cy + r * Math.sin(rad(startDeg + sweepDeg)));
  return `M${x0} ${y0}A${round(r)} ${round(r)} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

function motifShapes(motif: Motif, rnd: () => number): CoverShape[] {
  const between = (min: number, max: number) => min + rnd() * (max - min);
  const count = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const paint = (): Paint => (rnd() < 0.6 ? 'ink' : 'highlight');
  const opacity = () => round(between(0.45, 0.95));
  const shapes: CoverShape[] = [];

  switch (motif) {
    case 'bars': {
      const n = count(3, 7);
      const slot = 280 / n;
      for (let i = 0; i < n; i += 1) {
        const height = between(50, 260);
        shapes.push({
          type: 'rect', x: round(60 + i * slot + slot * 0.2), y: round(200 - height / 2 + between(-20, 20)),
          width: round(slot * 0.6), height: round(height), rx: 4, fill: paint(), opacity: opacity(), rotate: 0,
        });
      }
      break;
    }
    case 'arcs': {
      const cx = between(150, 250);
      const cy = between(170, 270);
      const start = between(150, 250);
      const n = count(3, 5);
      for (let i = 0; i < n; i += 1) {
        shapes.push({
          type: 'arc', d: arcPath(cx, cy, 60 + i * between(32, 46), start + i * between(-12, 12), between(130, 230)),
          stroke: i % 2 === 0 ? 'highlight' : 'ink', strokeWidth: round(between(10, 20)), opacity: opacity(),
        });
      }
      break;
    }
    case 'orbits': {
      const n = count(3, 6);
      for (let i = 0; i < n; i += 1) {
        const filled = i === n - 1;
        shapes.push({
          type: 'circle', cx: round(between(120, 280)), cy: round(between(120, 280)),
          r: round(filled ? between(14, 30) : between(40, 170)), fill: filled ? 'highlight' : 'none',
          stroke: filled ? 'none' : paint(), strokeWidth: round(between(2, 9)), opacity: opacity(),
        });
      }
      break;
    }
    case 'grid': {
      const n = count(4, 7);
      for (let i = 0; i < n; i += 1) {
        const lane = count(1, 8);
        shapes.push({
          type: 'rect', x: round(between(40, 260)), y: lane * 40, width: round(between(40, 120)), height: 26,
          rx: 3, fill: paint(), opacity: opacity(), rotate: 0,
        });
      }
      break;
    }
    case 'stripes': {
      const n = count(3, 7);
      const angle = round(between(-60, -30));
      for (let i = 0; i < n; i += 1) {
        shapes.push({
          type: 'rect', x: round(-40 + i * (480 / n) + between(-15, 15)), y: -100, width: round(between(18, 60)),
          height: 600, rx: 0, fill: paint(), opacity: opacity(), rotate: angle,
        });
      }
      break;
    }
    case 'monogram': {
      shapes.push({
        type: 'circle', cx: 200, cy: 200, r: 150, fill: 'none', stroke: 'highlight',
        strokeWidth: 6, opacity: 0.35,
      });
      break;
    }
  }
  return shapes;
}

export function generateCover(opts: {
  seed: string;
  kind: CoverKind;
  palette?: PaletteName;
  motif?: Motif;
  /** Used for the monogram's initials. */
  title?: string;
}): CoverSpec {
  const rnd = rngFor(`${opts.kind}:${opts.seed}`);
  const pick = PALETTE_NAMES[Math.floor(rnd() * PALETTE_NAMES.length)];
  const palette = opts.palette ?? pick;
  const [bgFrom, bgTo, ink, highlight] = PALETTES[palette];
  const motif = opts.motif ?? MOTIF_BY_KIND[opts.kind];
  const gradient: CoverSpec['gradient'] =
    opts.kind === 'song'
      ? { kind: 'radial', cx: round(0.3 + rnd() * 0.4), cy: 0.35, r: 0.9 }
      : { kind: 'linear', x1: 0, y1: 0, x2: round(0.4 + rnd() * 0.6), y2: 1 };
  const grain = motif !== 'monogram' && rnd() < 0.5;
  return {
    palette,
    colors: { bgFrom, bgTo, ink, highlight },
    gradient,
    motif,
    shapes: motifShapes(motif, rnd),
    grain,
    monogram: motif === 'monogram' ? initials(opts.title ?? opts.seed) : null,
  };
}

/** Seeded waveform heights in (0, 1] for the full PreviewPlayer. */
export function waveformBars(seed: string, count: number): number[] {
  const rnd = rngFor(`waveform:${seed}`);
  const bars: number[] = [];
  let previous = 0.5;
  for (let i = 0; i < count; i += 1) {
    previous = Math.min(1, Math.max(0.12, previous * 0.55 + rnd() * 0.6));
    bars.push(Math.round(previous * 100) / 100);
  }
  return bars;
}
