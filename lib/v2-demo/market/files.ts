/**
 * Generated pack contents (WEB-V2-SPEC §4.4 "Contents", §6.4 "generated files").
 *
 * A listing describes its files as a few groups; `generateFiles` expands them
 * into names, lengths, tempos, keys and sizes. The output is seeded by the
 * listing's slug, so the server and the browser list the same files.
 */
import type { FileRef, KeyValue, ReleaseType, Synth } from '../release-lifecycle/types.ts';
import { rngFor } from '../cover.ts';
import { decodeKey, encodeKey, fill } from '../format.ts';
import type { FileSpec, MarketFile, MarketFileKind, MarketListing, PackBpm, PackKey } from './types.ts';

/** 24-bit, 44.1 kHz stereo WAV. */
const WAV_BYTES_PER_SECOND = 44_100 * 2 * 3;
const WAV_HEADER_BYTES = 44;
/** Loops without a tempo are timed at this BPM. */
const FALLBACK_BPM = 100;
const DEFAULT_PATTERN = '{prefix}_{name}_{n}';

function extension(kind: MarketFileKind, synth: Synth | null): string {
  if (kind === 'midi') return '.mid';
  if (kind === 'preset') return synth === 'vital' ? '.vital' : '.SerumPreset';
  return '.wav';
}

/**
 * The anchor id of a file: its name without the extension, as a slug, with
 * "BPM" dropped ("Midnight Rhodes 92 BPM.wav" → "midnight-rhodes-92").
 */
export function fileId(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-bpm(?=-|$)/g, '');
}

const wavBytes = (seconds: number) => Math.round(seconds * WAV_BYTES_PER_SECOND) + WAV_HEADER_BYTES;
const toMs = (seconds: number) => Math.round(seconds * 100) * 10;

/** Expands a listing's file groups into its file list, in group order. */
export function generateFiles(
  slug: string,
  spec: FileSpec,
  pack: { bpm: PackBpm; key: PackKey; synth: Synth | null },
): MarketFile[] {
  const packBpm = typeof pack.bpm === 'number' ? pack.bpm : null;
  const packKey: KeyValue = pack.key === 'various' || pack.key === undefined ? null : pack.key;
  const files: MarketFile[] = [];

  spec.groups.forEach((group, g) => {
    for (let i = 0; i < group.count; i += 1) {
      const rng = rngFor(`${slug}/${g}/${i}`);
      const name = group.names[i % group.names.length];
      const n = String(Math.floor(i / group.names.length) + 1).padStart(2, '0');

      let bpm: number | null;
      if (group.bpms) bpm = group.bpms[i % group.bpms.length];
      else bpm = group.kind === 'one_shot' || group.kind === 'preset' ? null : packBpm;

      let key: KeyValue | undefined;
      if (group.kind === 'preset') key = undefined;
      else if (group.keys) key = decodeKey(group.keys[i % group.keys.length]) ?? null;
      else key = group.kind === 'one_shot' ? null : packKey;

      let durationMs: number | null = null;
      let bytes: number;
      switch (group.kind) {
        case 'one_shot': {
          const seconds = 0.12 + rng() * 2.2;
          durationMs = toMs(seconds);
          bytes = wavBytes(seconds);
          break;
        }
        case 'loop':
        case 'midi': {
          const bars = rng() < 0.6 ? 4 : 8;
          const seconds = (bars * 4 * 60) / (bpm ?? FALLBACK_BPM);
          durationMs = toMs(seconds);
          bytes = group.kind === 'loop' ? wavBytes(seconds) : Math.round(260 + bars * (60 + rng() * 380));
          break;
        }
        case 'demo': {
          const seconds = 60 + rng() * 35;
          durationMs = toMs(seconds);
          bytes = wavBytes(seconds);
          break;
        }
        case 'preset':
          bytes = Math.round((pack.synth === 'vital' ? 18_000 : 30_000) + rng() * 120_000);
          break;
      }

      const fileName =
        fill(group.pattern ?? DEFAULT_PATTERN, {
          prefix: spec.prefix,
          name,
          n,
          bpm: bpm ?? '',
          key: key ? encodeKey(key) : '',
        }) + extension(group.kind, pack.synth);
      files.push({ id: fileId(fileName), name: fileName, kind: group.kind, bytes, durationMs, bpm, key });
    }
  });
  return files;
}

/**
 * A Studio revision's pack contents as Market rows (WEB-V2-SPEC §4.4), for a
 * version approved in the Studio demo. Sample packs count audio under 2 s as
 * one-shots, as RELEASE-LIFECYCLE §5.5 does; the only audio in a preset or MIDI
 * pack is its demo. Loops without their own tempo or key take the pack's.
 */
export function filesFromRevision(
  type: ReleaseType,
  refs: readonly FileRef[],
  pack: { bpm: PackBpm; key: PackKey },
): MarketFile[] {
  const packBpm = typeof pack.bpm === 'number' ? pack.bpm : null;
  const packKey: KeyValue = pack.key === 'various' || pack.key === undefined ? null : pack.key;
  return refs.map((ref) => {
    let kind: MarketFileKind;
    if (ref.kind === 'preset' || ref.kind === 'midi') kind = ref.kind;
    else if (type === 'preset_pack' || type === 'midi_pack') kind = 'demo';
    else if (type === 'sample_pack' && (ref.durationMs ?? 0) < 2000) kind = 'one_shot';
    else kind = 'loop';
    const name = ref.path.slice(ref.path.lastIndexOf('/') + 1);
    const ownBpm = ref.bpm ? Number(ref.bpm.value) : NaN;
    return {
      id: fileId(name),
      name,
      kind,
      bytes: ref.bytes,
      durationMs: ref.durationMs ?? null,
      bpm: Number.isFinite(ownBpm) ? ownBpm : kind === 'loop' || kind === 'midi' ? packBpm : null,
      key: kind === 'preset' ? undefined : ref.key ? ref.key.value : kind === 'one_shot' ? null : packKey,
    };
  });
}

/** A listing's files: a newer version's from the Studio demo, otherwise the generated seed contents. */
export function listingFiles(listing: MarketListing): readonly MarketFile[] {
  if (listing.revisionFiles) return listing.revisionFiles;
  return listing.files ? generateFiles(listing.slug, listing.files, listing) : [];
}

/** How many files of the given kinds a spec lists (all kinds when omitted). */
export function countFiles(spec: FileSpec, kinds?: readonly MarketFileKind[]): number {
  return spec.groups
    .filter((group) => !kinds || kinds.includes(group.kind))
    .reduce((sum, group) => sum + group.count, 0);
}
