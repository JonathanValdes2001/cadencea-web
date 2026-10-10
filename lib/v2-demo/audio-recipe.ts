/**
 * Note lists for the synthesized previews (WEB-V2-SPEC §3.5). Pure and seeded:
 * the same listing always gets the same few bars. `components/ui/PreviewPlayer`
 * renders a recipe with WebAudio; nothing here touches audio APIs.
 */
import type { PitchClass, ReleaseType } from './release-lifecycle/types.ts';
import { rngFor } from './cover.ts';
import { PITCH_CLASSES } from './format.ts';

export type Voice = 'kick' | 'snare' | 'hat' | 'bass' | 'chord' | 'pad' | 'lead' | 'arp' | 'piano';

export interface RecipeNote {
  /** Start, in seconds. */
  t: number;
  /** Length, in seconds. */
  dur: number;
  type: Voice;
  /** Hz; 0 for unpitched drums. */
  freq: number;
  gain: number;
}

export interface AudioRecipe {
  bpm: number;
  bars: number;
  /** Seconds. */
  duration: number;
  notes: RecipeNote[];
}

export interface RecipeInput {
  seed: string;
  bpm: number | null;
  keyRoot: PitchClass | null;
  keyMode: 'Major' | 'Minor' | null;
  kind: ReleaseType;
  bars?: number;
}

export const DEFAULT_BPM = 100;

/** Six one-bar drum patterns: 16th-note step indices. */
const DRUM_PATTERNS: readonly { kick: number[]; snare: number[]; hat: number[] }[] = [
  { kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  { kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  { kick: [0, 3, 10], snare: [4, 12], hat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14] },
  { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14] },
  { kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15] },
  { kick: [0, 10], snare: [4, 12], hat: [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14] },
];

const BASS_RHYTHMS: readonly number[][] = [[0, 8], [0, 6, 8, 14], [0, 3, 8, 11]];

const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
} as const;

/** Scale degrees (0-based): minor i–VI–III–VII, major I–V–vi–IV. */
const PROGRESSIONS = { Minor: [0, 5, 2, 6], Major: [0, 4, 5, 3] } as const;

/** What each type plays: drums (kick, snare, hat) plus pitched parts. */
type Part = 'drums' | 'bass' | 'chord' | 'pad' | 'lead' | 'arp' | 'piano';

const PARTS_BY_KIND: Readonly<Record<ReleaseType, readonly Part[]>> = {
  sample_pack: ['drums', 'bass'],
  splits_pack: ['chord', 'arp'],
  preset_pack: ['pad', 'lead'],
  midi_pack: ['piano'],
  beat: ['drums', 'bass', 'chord'],
  song: ['pad', 'lead'],
  theme: [],
};

const midiToHz = (midi: number) => Math.round(440 * 2 ** ((midi - 69) / 12) * 100) / 100;
const round = (n: number) => Math.round(n * 10000) / 10000;

export function buildRecipe(input: RecipeInput): AudioRecipe {
  const bpm = input.bpm && input.bpm > 0 ? input.bpm : DEFAULT_BPM;
  const bars = input.bars ?? 4;
  const step = 60 / bpm / 4;
  const bar = step * 16;
  const rnd = rngFor(`audio:${input.seed}`);
  const notes: RecipeNote[] = [];
  const push = (t: number, dur: number, type: Voice, freq: number, gain: number) =>
    notes.push({ t: round(t), dur: round(dur), type, freq, gain: round(gain) });

  const hasKey = input.keyRoot !== null && input.keyMode !== null;
  const kindParts = PARTS_BY_KIND[input.kind];
  // "No key" gets a drums-only recipe; themes have no player at all.
  const parts: readonly Part[] = kindParts.length === 0 ? [] : hasKey ? kindParts : ['drums'];

  if (parts.includes('drums')) {
    const pattern = DRUM_PATTERNS[Math.floor(rnd() * DRUM_PATTERNS.length)];
    for (let b = 0; b < bars; b += 1) {
      const t0 = b * bar;
      pattern.kick.forEach((s) => push(t0 + s * step, step * 2, 'kick', 0, 0.9));
      pattern.snare.forEach((s) => push(t0 + s * step, step * 2, 'snare', 0, 0.5));
      pattern.hat.forEach((s) => push(t0 + s * step, step * 0.6, 'hat', 0, 0.12 + rnd() * 0.08));
    }
  }

  if (hasKey && parts.length > 0) {
    const mode = input.keyMode as 'Major' | 'Minor';
    const scale = SCALES[mode];
    const rootIndex = PITCH_CLASSES.indexOf(input.keyRoot as PitchClass);
    const degreeToMidi = (degree: number, octaveBase: number) =>
      octaveBase + rootIndex + scale[degree % 7] + 12 * Math.floor(degree / 7);
    const triad = (degree: number, octaveBase: number) =>
      [degree, degree + 2, degree + 4].map((d) => midiToHz(degreeToMidi(d, octaveBase)));
    const bassRhythm = BASS_RHYTHMS[Math.floor(rnd() * BASS_RHYTHMS.length)];

    for (let b = 0; b < bars; b += 1) {
      const t0 = b * bar;
      const degree = PROGRESSIONS[mode][b % 4];
      if (parts.includes('bass')) {
        bassRhythm.forEach((s) => push(t0 + s * step, step * 2.5, 'bass', midiToHz(degreeToMidi(degree, 36)), 0.35));
      }
      if (parts.includes('chord')) {
        triad(degree, 60).forEach((f) => push(t0, bar * 0.95, 'chord', f, 0.1));
      }
      if (parts.includes('pad')) {
        triad(degree, 60).forEach((f) => push(t0, bar, 'pad', f, 0.08));
      }
      if (parts.includes('piano')) {
        [0, 8].forEach((s) => triad(degree, 60).forEach((f) => push(t0 + s * step, bar * 0.45, 'piano', f, 0.12)));
      }
      if (parts.includes('arp')) {
        const tones = triad(degree, 72);
        for (let s = 0; s < 16; s += 2) push(t0 + s * step, step * 1.8, 'arp', tones[(s / 2) % 3], 0.1);
      }
      if (parts.includes('lead')) {
        for (let s = 0; s < 16; s += 2) {
          if (rnd() < 0.35) continue;
          const d = degree + Math.floor(rnd() * 5);
          push(t0 + s * step, step * (rnd() < 0.3 ? 3.6 : 1.8), 'lead', midiToHz(degreeToMidi(d, 72)), 0.12);
        }
      }
    }
  }

  notes.sort((a, b) => a.t - b.t);
  return { bpm, bars, duration: round(bars * bar), notes };
}
