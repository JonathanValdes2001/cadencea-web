/**
 * Fake but stable file data for the Studio seeds and the demo Vault projects
 * (RELEASE-LIFECYCLE §5.3, §7.4). Hashes and sizes are derived from the path
 * and a seed, so the same file always has the same SHA-256 on the server and in
 * the browser, and a "replaced" file is simply the same path with a new seed.
 */
import type { CoverArt, FileKind, FileRef } from './types.ts';
import { hash } from '../cover.ts';

/** 64 lowercase hex characters, like a SHA-256, derived from `seed`. */
export function fakeSha256(seed: string): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += hash(`${seed}#${i}`).toString(16).padStart(8, '0');
  return out;
}

/** 24-bit, 48 kHz stereo WAV: 288,000 bytes per second, plus a small header. */
const WAV_BYTES_PER_SECOND = 288_000;

export function audioFile(path: string, durationMs: number, version = 'a'): FileRef {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  const ratio = ext === 'flac' ? 0.6 : 1;
  return {
    path,
    sha256: fakeSha256(`${path}|${version}`),
    bytes: Math.round((durationMs / 1000) * WAV_BYTES_PER_SECOND * ratio) + 44,
    kind: 'audio',
    durationMs,
  };
}

export function plainFile(path: string, kind: FileKind, bytes: number, version = 'a'): FileRef {
  return { path, sha256: fakeSha256(`${path}|${version}`), bytes, kind };
}

/** A generated cover (WEB-V2-SPEC §3.4): `demoAssetKey` is the CoverArt seed; it counts as 3000 × 3000. */
export function demoCover(demoAssetKey: string, path = 'cover.png'): CoverArt {
  return {
    file: { ...plainFile(path, 'image', 2_400_000, demoAssetKey), demoAssetKey },
    widthPx: 3000,
    heightPx: 3000,
  };
}

/** Deterministic durations: one-shots under 2 s, loops 4–16 s. */
export function seededDuration(seed: string, kind: 'one_shot' | 'loop'): number {
  const h = hash(seed);
  return kind === 'one_shot' ? 300 + (h % 1500) : 4000 + (h % 12) * 1000;
}

/** Numbered audio files: `{folder}/{prefix} {nn}.wav`. */
export function numberedAudio(
  folder: string,
  prefix: string,
  count: number,
  kind: 'one_shot' | 'loop',
  start = 1,
): FileRef[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(start + i).padStart(2, '0');
    const path = `${folder}/${prefix} ${n}.wav`;
    return audioFile(path, seededDuration(path, kind));
  });
}

export function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** Under 2 s counts as a one-shot (RELEASE-LIFECYCLE §5.5, sample pack). */
export function countOneShots(files: readonly FileRef[]): number {
  return files.filter((f) => (f.durationMs ?? 0) < 2000).length;
}
