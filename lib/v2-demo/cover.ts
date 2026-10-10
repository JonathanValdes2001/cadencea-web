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

export type Motif =
  | 'bars'
  | 'slice'
  | 'halftone'
  | 'arcs'
  | 'split'
  | 'orbits'
  | 'knob'
  | 'grid'
  | 'stripes'
  | 'chevrons'
  | 'vinyl'
  | 'window'
  | 'monogram';
export type CoverKind = ReleaseType | 'avatar';

/**
 * Each type has its own family of motifs, so a rail of one category isn't four
 * recolors of one glyph, and no two types share a motif: sample packs read as
 * audio (bars, a waveform slice, halftone dots), Splits as the logo's arcs or a
 * split disc, presets as orbits or a knob, MIDI as a piano roll, beats as
 * stripes or chevrons, songs as a record and themes as a little app window.
 */
export const MOTIFS_BY_KIND: Readonly<Record<CoverKind, readonly Motif[]>> = {
  sample_pack: ['bars', 'slice', 'halftone'],
  splits_pack: ['arcs', 'split'],
  preset_pack: ['orbits', 'knob'],
  midi_pack: ['grid'],
  beat: ['stripes', 'chevrons'],
  song: ['vinyl'],
  theme: ['window'],
  avatar: ['monogram'],
};

/** Motifs drawn around the centre and then moved, scaled and cropped (the rest keep their layout). */
const FRAMED: ReadonlySet<Motif> = new Set(['bars', 'slice', 'halftone', 'arcs', 'split', 'orbits', 'knob', 'stripes', 'chevrons']);

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
  /** A stroked path (arcs, waveforms, chevrons). */
  | { type: 'arc'; d: string; stroke: Paint; strokeWidth: number; opacity: number }
  /** A filled path (half discs). */
  | { type: 'fill'; d: string; fill: Paint; opacity: number };

export interface CoverSpec {
  palette: PaletteName;
  colors: { bgFrom: string; bgTo: string; ink: string; highlight: string };
  gradient:
    | { kind: 'linear'; x1: number; y1: number; x2: number; y2: number }
    | { kind: 'radial'; cx: number; cy: number; r: number };
  motif: Motif;
  shapes: CoverShape[];
  /**
   * Where the motif sits: scaled and rotated about the centre, then moved, so
   * shapes can bleed off the edge. Null keeps the motif's own layout.
   */
  frame: { scale: number; rotate: number; dx: number; dy: number } | null;
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

/** A half disc facing `deg` (0 = the flat side down). */
function halfDiscPath(cx: number, cy: number, r: number, deg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const ax = round(cx + r * Math.cos(rad(deg + 180)));
  const ay = round(cy + r * Math.sin(rad(deg + 180)));
  const bx = round(cx + r * Math.cos(rad(deg)));
  const by = round(cy + r * Math.sin(rad(deg)));
  return `M${ax} ${ay}A${round(r)} ${round(r)} 0 0 1 ${bx} ${by}Z`;
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
    case 'slice': {
      // A waveform with a selected slice and its two markers, like a sampler's editor.
      const points = 22;
      let d = '';
      for (let i = 0; i <= points; i += 1) {
        const x = round(20 + (i * 360) / points);
        const amp = between(20, 130) * Math.sin((i / points) * Math.PI) + 10;
        d += `${i === 0 ? 'M' : 'L'}${x} ${round(200 + (i % 2 === 0 ? -amp : amp))}`;
      }
      const start = round(between(90, 170));
      const width = round(between(80, 140));
      shapes.push({ type: 'rect', x: start, y: 60, width, height: 280, rx: 2, fill: 'highlight', opacity: 0.14, rotate: 0 });
      shapes.push({ type: 'arc', d, stroke: 'ink', strokeWidth: round(between(4, 7)), opacity: 0.9 });
      shapes.push({ type: 'rect', x: start - 2, y: 50, width: 4, height: 300, rx: 2, fill: 'highlight', opacity: 0.9, rotate: 0 });
      shapes.push({ type: 'rect', x: round(start + width - 2), y: 50, width: 4, height: 300, rx: 2, fill: 'highlight', opacity: 0.9, rotate: 0 });
      break;
    }
    case 'halftone': {
      // A diagonal of dots that shrink toward one corner.
      const n = count(4, 7);
      const step = between(46, 62);
      for (let i = 0; i < n; i += 1) {
        shapes.push({
          type: 'circle', cx: round(70 + i * step), cy: round(330 - i * step), r: round(between(44, 60) * (1 - i / (n + 1))),
          fill: i % 2 === 0 ? 'ink' : 'highlight', stroke: 'none', strokeWidth: 0, opacity: opacity(),
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
    case 'split': {
      // Two halves of one disc, pulled apart: the deal between two makers.
      const r = between(100, 140);
      const gap = between(14, 34);
      const deg = round(between(-35, 35));
      const rad = (deg * Math.PI) / 180;
      const ox = round(Math.sin(rad) * gap);
      const oy = round(-Math.cos(rad) * gap);
      shapes.push({ type: 'fill', d: halfDiscPath(200 + ox, 200 + oy, r, deg), fill: 'highlight', opacity: round(between(0.75, 0.95)) });
      shapes.push({ type: 'fill', d: halfDiscPath(200 - ox, 200 - oy, r, deg + 180), fill: 'ink', opacity: round(between(0.55, 0.85)) });
      shapes.push({ type: 'circle', cx: 200, cy: 200, r: round(r + between(26, 44)), fill: 'none', stroke: 'ink', strokeWidth: 3, opacity: 0.45 });
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
    case 'knob': {
      // A synth knob: a 270° ring, its value arc, a pointer and a few ticks.
      const value = between(40, 250);
      shapes.push({ type: 'arc', d: arcPath(200, 200, 120, 135, 270), stroke: 'ink', strokeWidth: 14, opacity: 0.35 });
      shapes.push({ type: 'arc', d: arcPath(200, 200, 120, 135, value), stroke: 'highlight', strokeWidth: 14, opacity: 0.95 });
      shapes.push({ type: 'circle', cx: 200, cy: 200, r: 78, fill: 'ink', stroke: 'none', strokeWidth: 0, opacity: 0.85 });
      shapes.push({ type: 'rect', x: 196, y: 128, width: 8, height: 54, rx: 4, fill: 'highlight', opacity: 1, rotate: round(value - 135) });
      for (const tick of [0, 135, 270]) {
        shapes.push({ type: 'rect', x: 197, y: 42, width: 6, height: 20, rx: 2, fill: 'ink', opacity: 0.6, rotate: tick - 135 });
      }
      break;
    }
    case 'grid': {
      // A piano roll: one note per lane, lanes start below the card's type badge.
      const lanes = [96, 136, 176, 216, 256, 296, 336];
      for (let i = lanes.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
      }
      const n = count(4, 7);
      for (let i = 0; i < n; i += 1) {
        shapes.push({
          type: 'rect', x: round(between(40, 220)), y: lanes[i], width: round(between(50, 140)), height: 26,
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
    case 'chevrons': {
      const n = count(3, 5);
      const step = between(44, 64);
      const width = between(110, 160);
      const top = 200 - ((n - 1) * step) / 2;
      for (let i = 0; i < n; i += 1) {
        const y = round(top + i * step);
        shapes.push({
          type: 'arc', d: `M${round(200 - width)} ${round(y + 46)}L200 ${y}L${round(200 + width)} ${round(y + 46)}`,
          stroke: i % 2 === 0 ? 'highlight' : 'ink', strokeWidth: round(between(12, 22)), opacity: opacity(),
        });
      }
      break;
    }
    case 'vinyl': {
      // A record: grooves, a sheen and the centre label.
      const cx = round(between(170, 230));
      const cy = round(between(170, 230));
      for (const r of [170, 138, 108]) {
        shapes.push({ type: 'circle', cx, cy, r, fill: 'none', stroke: 'ink', strokeWidth: round(between(2, 5)), opacity: 0.45 });
      }
      shapes.push({ type: 'arc', d: arcPath(cx, cy, 154, between(200, 260), 50), stroke: 'highlight', strokeWidth: 6, opacity: 0.55 });
      shapes.push({ type: 'circle', cx, cy, r: round(between(52, 66)), fill: 'highlight', stroke: 'none', strokeWidth: 0, opacity: 0.9 });
      shapes.push({ type: 'circle', cx, cy, r: 7, fill: 'ink', stroke: 'none', strokeWidth: 0, opacity: 1 });
      break;
    }
    case 'window': {
      // A small app window in the theme's colors: chrome, a sidebar and content blocks.
      const top = round(between(70, 110));
      shapes.push({ type: 'rect', x: 50, y: top, width: 300, height: 230, rx: 14, fill: 'ink', opacity: 0.22, rotate: 0 });
      shapes.push({ type: 'rect', x: 50, y: top, width: 300, height: 30, rx: 14, fill: 'highlight', opacity: 0.35, rotate: 0 });
      shapes.push({ type: 'rect', x: 66, y: top + 46, width: 70, height: 168, rx: 6, fill: 'ink', opacity: 0.55, rotate: 0 });
      shapes.push({ type: 'rect', x: 150, y: top + 46, width: 184, height: 74, rx: 8, fill: 'highlight', opacity: 0.85, rotate: 0 });
      shapes.push({ type: 'rect', x: 150, y: top + 134, width: round(between(70, 110)), height: 80, rx: 8, fill: 'ink', opacity: 0.8, rotate: 0 });
      shapes.push({ type: 'rect', x: 264, y: top + 134, width: 70, height: 80, rx: 8, fill: 'highlight', opacity: 0.5, rotate: 0 });
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
  const family = MOTIFS_BY_KIND[opts.kind];
  const familyPick = family[Math.floor(rnd() * family.length)];
  const motif = opts.motif ?? familyPick;
  const gradient: CoverSpec['gradient'] =
    opts.kind === 'song'
      ? { kind: 'radial', cx: round(0.3 + rnd() * 0.4), cy: 0.35, r: 0.9 }
      : { kind: 'linear', x1: 0, y1: 0, x2: round(0.4 + rnd() * 0.6), y2: 1 };
  const grain = motif !== 'monogram' && rnd() < 0.5;
  const shapes = motifShapes(motif, rnd);
  // Scale 0.8–1.3, a small turn and an offset, so some covers crop their motif at the edge.
  const frame = FRAMED.has(motif)
    ? {
        scale: round(0.8 + rnd() * 0.5),
        rotate: motif === 'stripes' || motif === 'knob' ? 0 : round(-12 + rnd() * 24),
        dx: round(-50 + rnd() * 100),
        dy: round(-40 + rnd() * 80),
      }
    : null;
  return {
    palette,
    colors: { bgFrom, bgTo, ink, highlight },
    gradient,
    motif,
    shapes,
    frame,
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
