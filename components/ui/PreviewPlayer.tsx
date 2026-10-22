'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { PitchClass, ReleaseType } from '@/lib/v2-demo/release-lifecycle/types';
import { buildRecipe, type AudioRecipe, type RecipeNote } from '@/lib/v2-demo/audio-recipe';
import { waveformBars } from '@/lib/v2-demo/cover';
import { formatDuration, formatKey } from '@/lib/v2-demo/format';
import { Pause, Play } from './Icons';
import Tooltip from './Tooltip';

/*
 * Synthesized previews (WEB-V2-SPEC §3.5). A recipe is rendered once per seed
 * with OfflineAudioContext into an AudioBuffer and played on one shared
 * AudioContext, created on the first click as autoplay rules require. No audio
 * file is loaded, so the CSP stays as it is.
 */

const SAMPLE_RATE = 22050;
const WAVEFORM_BARS = 48;
const UNSUPPORTED = "Preview isn't available in this browser.";

const buffers = new Map<string, Promise<AudioBuffer>>();
let sharedContext: AudioContext | null = null;
/** The one preview allowed to play; starting another stops it. */
let playing: { owner: string; stop: () => void } | null = null;

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window && 'OfflineAudioContext' in window;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envelope(ctx: BaseAudioContext, peak: number, t: number, attack: number, release: number, hold: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  gain.gain.setValueAtTime(Math.max(peak, 0.0002), t + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return gain;
}

function scheduleNote(ctx: OfflineAudioContext, out: AudioNode, noise: AudioBuffer, note: RecipeNote) {
  const { t, dur, gain: peak, freq } = note;
  const tone = (type: OscillatorType, detune = 0) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    return osc;
  };
  const filter = (type: BiquadFilterType, hz: number) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    return f;
  };
  const play = (source: AudioScheduledSourceNode, chain: AudioNode[], end: number) => {
    let node: AudioNode = source;
    for (const next of chain) {
      node.connect(next);
      node = next;
    }
    node.connect(out);
    source.start(t);
    source.stop(end);
  };

  switch (note.type) {
    case 'kick': {
      const osc = tone('sine');
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      play(osc, [envelope(ctx, peak, t, 0.002, 0.28, 0)], t + 0.32);
      break;
    }
    case 'snare':
    case 'hat': {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const snare = note.type === 'snare';
      play(src, [filter('highpass', snare ? 1500 : 7000), envelope(ctx, peak, t, 0.002, snare ? 0.16 : 0.05, 0)], t + 0.25);
      break;
    }
    case 'bass':
      play(tone('sawtooth'), [filter('lowpass', 400), envelope(ctx, peak, t, 0.01, 0.08, dur * 0.8)], t + dur + 0.1);
      break;
    case 'chord':
    case 'pad': {
      const pad = note.type === 'pad';
      for (const cents of [-7, 0, 7]) {
        play(
          tone('triangle', cents),
          [filter('lowpass', pad ? 1800 : 3200), envelope(ctx, peak / 3, t, pad ? 0.3 : 0.02, 0.2, dur * 0.7)],
          t + dur + 0.25,
        );
      }
      break;
    }
    case 'lead':
      play(tone('square'), [filter('lowpass', 2400), envelope(ctx, peak * 0.6, t, 0.01, 0.12, dur * 0.6)], t + dur + 0.15);
      break;
    case 'arp':
      play(tone('triangle'), [envelope(ctx, peak, t, 0.005, 0.12, dur * 0.3)], t + dur + 0.15);
      break;
    case 'piano':
      play(tone('triangle'), [envelope(ctx, peak, t, 0.004, dur, 0)], t + dur + 0.05);
      break;
  }
}

function renderBuffer(key: string, recipe: AudioRecipe): Promise<AudioBuffer> {
  const cached = buffers.get(key);
  if (cached) return cached;
  const ctx = new OfflineAudioContext(2, Math.ceil((recipe.duration + 0.4) * SAMPLE_RATE), SAMPLE_RATE);
  const master = ctx.createGain();
  master.gain.value = 0.5;
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor);
  compressor.connect(ctx.destination);
  const noise = noiseBuffer(ctx);
  recipe.notes.forEach((note) => scheduleNote(ctx, master, noise, note));
  const rendering = ctx.startRendering();
  buffers.set(key, rendering);
  rendering.catch(() => buffers.delete(key));
  return rendering;
}

export default function PreviewPlayer({
  seed,
  bpm,
  keyRoot,
  keyMode,
  kind,
  bars = 4,
  title,
  compact = false,
  className = '',
}: {
  seed: string;
  bpm: number | string | null;
  keyRoot: PitchClass | null;
  keyMode: 'Major' | 'Minor' | null;
  kind: ReleaseType;
  bars?: number;
  title: string;
  compact?: boolean;
  className?: string;
}) {
  const owner = useId();
  const tipId = useId();
  const pathname = usePathname();
  const bpmNumber = bpm === null || bpm === '' ? null : Number(bpm);
  const recipe = useMemo(
    () => buildRecipe({ seed, bpm: bpmNumber, keyRoot, keyMode, kind, bars }),
    [seed, bpmNumber, keyRoot, keyMode, kind, bars],
  );
  const bufferKey = `${seed}|${recipe.bpm}|${keyRoot}|${keyMode}|${kind}|${bars}`;

  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const source = useRef<AudioBufferSourceNode | null>(null);
  const startedAt = useRef(0);
  const offset = useRef(0);
  const frame = useRef(0);
  const progressRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setSupported(isSupported()), []);

  const paint = useCallback(
    (seconds: number) => {
      const fraction = recipe.duration > 0 ? Math.min(1, seconds / recipe.duration) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${fraction})`;
      if (elapsedRef.current) elapsedRef.current.textContent = formatDuration(seconds * 1000);
    },
    [recipe.duration],
  );

  const halt = useCallback(
    (keepOffset: boolean) => {
      cancelAnimationFrame(frame.current);
      if (source.current && sharedContext) {
        if (keepOffset) offset.current = sharedContext.currentTime - startedAt.current;
        source.current.onended = null;
        try {
          source.current.stop();
        } catch {
          // Already ended on its own.
        }
        source.current = null;
      }
      if (!keepOffset) {
        offset.current = 0;
        paint(0);
      }
      if (playing?.owner === owner) playing = null;
    },
    [owner, paint],
  );

  const pause = useCallback(() => {
    halt(true);
    setState('paused');
  }, [halt]);

  const play = useCallback(async () => {
    if (!isSupported()) return setSupported(false);
    playing?.stop();
    setState('loading');
    try {
      sharedContext ??= new AudioContext();
      if (sharedContext.state === 'suspended') await sharedContext.resume();
      const buffer = await renderBuffer(bufferKey, recipe);
      const ctx = sharedContext;
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(ctx.destination);
      const from = offset.current >= recipe.duration ? 0 : offset.current;
      node.start(0, from);
      startedAt.current = ctx.currentTime - from;
      source.current = node;
      node.onended = () => {
        halt(false);
        setState('idle');
      };
      playing = { owner, stop: pause };
      setState('playing');
      const tick = () => {
        paint(ctx.currentTime - startedAt.current);
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setSupported(false);
      setState('idle');
    }
  }, [bufferKey, halt, owner, paint, pause, recipe]);

  // Stop on unmount and on route change.
  useEffect(
    () => () => {
      halt(false);
      setState('idle');
    },
    [halt, pathname],
  );

  if (kind === 'theme') return null;

  const isPlaying = state === 'playing';
  const label = `${isPlaying ? 'Pause' : 'Play'} preview of ${title}`;
  const button = (
    <button
      type="button"
      onClick={supported ? (isPlaying ? pause : play) : undefined}
      aria-label={label}
      aria-pressed={isPlaying}
      aria-busy={state === 'loading' || undefined}
      aria-disabled={supported ? undefined : true}
      aria-describedby={supported ? undefined : tipId}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
        compact ? 'bg-canvas text-ink shadow-dropdown hover:bg-brand-50' : 'bg-accent text-white hover:bg-accent-hover'
      } ${supported ? '' : 'cursor-not-allowed opacity-50'}`}
    >
      {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
    </button>
  );
  const control = supported ? (
    button
  ) : (
    <Tooltip id={tipId} content={UNSUPPORTED}>
      {button}
    </Tooltip>
  );

  if (compact) return <div className={className}>{control}</div>;

  const heights = waveformBars(seed, WAVEFORM_BARS);
  const captionParts = [
    'Synthesized preview',
    bpmNumber ? `${bpmNumber} BPM` : null,
    formatKey(keyRoot && keyMode ? { root: keyRoot, mode: keyMode } : null),
  ].filter(Boolean);

  return (
    <div className={`rounded-md border border-line bg-canvas p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {control}
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${WAVEFORM_BARS * 4} 32`} preserveAspectRatio="none" aria-hidden="true" className="h-8 w-full text-line-strong">
            {heights.map((h, i) => (
              <rect key={i} x={i * 4} y={16 - h * 15} width="2.5" height={h * 30} rx="1" fill="currentColor" />
            ))}
          </svg>
          <span aria-hidden="true" className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-inset">
            <span
              ref={progressRef}
              style={{ transform: 'scaleX(0)' }}
              className="block h-full w-full origin-left bg-accent"
            />
          </span>
        </div>
        <p className="shrink-0 text-xs tabular-nums text-ink-subtle">
          <span ref={elapsedRef}>0:00</span> / {formatDuration(recipe.duration * 1000)}
        </p>
      </div>
      <p className="mt-3 text-xs text-ink-subtle">{captionParts.join(' · ')}</p>
    </div>
  );
}
