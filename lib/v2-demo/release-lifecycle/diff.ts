/**
 * The change summary between a release's live revision and its pending update
 * (RELEASE-LIFECYCLE §4.7), with the review depth it earns (§4.8). The wizard's
 * "Changes" panel, the update submit guard (T04, "change summary not empty") and
 * Studio's live-vs-pending view all read this one function.
 */
import type {
  ChangeKind,
  ChangeSummary,
  FieldChange,
  FileChange,
  FileRef,
  LeaseTierId,
  ReleasePayload,
  ReleaseType,
  ReviewDepth,
  SongTrack,
} from './types.ts';
import { LEASE_TIER_IDS } from './types.ts';

const DEPTH_RANK: Readonly<Record<ReviewDepth, number>> = { light: 0, standard: 1, strict: 2 };

/** §4.8: the depth one change kind needs for a type. Kinds a type can't have count as light. */
function depthForKind(type: ReleaseType, kind: ChangeKind): ReviewDepth {
  if (kind === 'metadata' || kind === 'cover' || kind === 'price') return 'light';
  const isSong = type === 'song';
  const isBeat = type === 'beat';
  const isSplits = type === 'splits_pack';
  switch (kind) {
    case 'files':
      return isSong ? 'light' : isSplits ? 'strict' : 'standard';
    case 'audio':
    case 'tracklist':
      return isSong || isBeat ? 'strict' : 'standard';
    case 'license':
    case 'credits_splits':
      return isSong || isBeat || isSplits ? 'strict' : 'standard';
  }
}

function maxDepth(depths: readonly ReviewDepth[]): ReviewDepth {
  return depths.reduce<ReviewDepth>((max, d) => (DEPTH_RANK[d] > DEPTH_RANK[max] ? d : max), 'light');
}

const KIND_ORDER: readonly ChangeKind[] = ['metadata', 'cover', 'price', 'license', 'files', 'credits_splits', 'tracklist', 'audio'];

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

interface FieldSpec {
  field: string;
  kind: ChangeKind;
  get: (p: ReleasePayload) => unknown;
}

const COMMON_FIELDS: readonly FieldSpec[] = [
  { field: 'title', kind: 'metadata', get: (p) => p.title },
  { field: 'description', kind: 'metadata', get: (p) => p.description },
  { field: 'tags', kind: 'metadata', get: (p) => p.tags },
  { field: 'genre', kind: 'metadata', get: (p) => p.genre },
  { field: 'moods', kind: 'metadata', get: (p) => p.moods },
  { field: 'bpm', kind: 'metadata', get: (p) => p.bpm?.value },
  { field: 'key', kind: 'metadata', get: (p) => p.key?.value },
  { field: 'cover', kind: 'cover', get: (p) => p.cover?.file.demoAssetKey ?? p.cover?.file.sha256 },
];

function tierOf(p: ReleasePayload, id: LeaseTierId) {
  return p.kind === 'beat' ? p.tiers.find((t) => t.tier === id) : undefined;
}

const TIER_FIELDS: FieldSpec[] = LEASE_TIER_IDS.flatMap((id): FieldSpec[] => [
  { field: `tiers.${id}.enabled`, kind: 'license', get: (p) => tierOf(p, id)?.enabled ?? false },
  { field: `tiers.${id}.price`, kind: 'price', get: (p) => tierOf(p, id)?.price.amountMinor },
  { field: `tiers.${id}.terms`, kind: 'license', get: (p) => {
    const t = tierOf(p, id);
    return t ? [t.producerPublishingSharePct, t.creditLine, t.contentIdAllowed, t.audioStreamCap] : undefined;
  } },
]);

const TYPE_FIELDS: Readonly<Record<ReleaseType, readonly FieldSpec[]>> = {
  song: [
    { field: 'format', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.format : undefined) },
    { field: 'releaseDate', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.releaseDate : undefined) },
    { field: 'territories', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.territories : undefined) },
    { field: 'pLine', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.pLine : undefined) },
    { field: 'cLine', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.cLine : undefined) },
    { field: 'allowFanSupport', kind: 'metadata', get: (p) => (p.kind === 'song' ? p.allowFanSupport : undefined) },
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'song' ? p.price : undefined) },
    { field: 'credits', kind: 'credits_splits', get: (p) => (p.kind === 'song' ? p.tracks.map((t) => t.credits) : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  beat: [
    { field: 'previewStartMs', kind: 'metadata', get: (p) => (p.kind === 'beat' ? p.previewStartMs : undefined) },
    { field: 'previewHasProducerTag', kind: 'metadata', get: (p) => (p.kind === 'beat' ? p.previewHasProducerTag : undefined) },
    { field: 'mainMix', kind: 'audio', get: (p) => (p.kind === 'beat' ? p.mainMix.sha256 : undefined) },
    ...TIER_FIELDS,
    { field: 'coProducers', kind: 'credits_splits', get: (p) => (p.kind === 'beat' ? p.coProducers : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  preset_pack: [
    { field: 'synth', kind: 'metadata', get: (p) => (p.kind === 'preset_pack' ? p.synth : undefined) },
    { field: 'minSynthVersion', kind: 'metadata', get: (p) => (p.kind === 'preset_pack' ? p.minSynthVersion : undefined) },
    { field: 'vitalTier', kind: 'metadata', get: (p) => (p.kind === 'preset_pack' ? p.vitalTier : undefined) },
    { field: 'categories', kind: 'metadata', get: (p) => (p.kind === 'preset_pack' ? p.categories : undefined) },
    { field: 'embedsAudio', kind: 'metadata', get: (p) => (p.kind === 'preset_pack' ? [p.embedsAudio, p.embeddedAudioNote] : undefined) },
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'preset_pack' ? p.price : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  sample_pack: [
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'sample_pack' ? p.price : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  splits_pack: [
    { field: 'terms', kind: 'license', get: (p) => (p.kind === 'splits_pack' ? p.terms : undefined) },
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'splits_pack' ? p.price : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  midi_pack: [
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'midi_pack' ? p.price : undefined) },
    { field: 'licensedMaterial', kind: 'metadata', get: (p) => (p.kind === 'theme' ? undefined : p.licensedMaterial) },
  ],
  theme: [
    { field: 'appearance', kind: 'metadata', get: (p) => (p.kind === 'theme' ? p.appearance : undefined) },
    { field: 'price', kind: 'price', get: (p) => (p.kind === 'theme' ? p.price : undefined) },
  ],
};

/** The fields Studio compares for a type, in display order. */
export function comparedFields(type: ReleaseType): readonly FieldSpec[] {
  return [...COMMON_FIELDS, ...TYPE_FIELDS[type]];
}

/**
 * The files a buyer or listener gets. `group` says which change kind a file
 * change counts as: song tracks and a beat's main mix are audio, compared by
 * track instead.
 */
export function deliverables(p: ReleasePayload): { file: FileRef; group: 'files' | 'audio' }[] {
  const files = (list: readonly (FileRef | null)[]) =>
    list.filter((f): f is FileRef => f !== null).map((file) => ({ file, group: 'files' as const }));
  switch (p.kind) {
    case 'song':
      return p.tracks.map((t) => ({ file: t.audio, group: 'audio' as const }));
    case 'beat':
      return [{ file: p.mainMix, group: 'audio' as const }, ...files(p.stems)];
    case 'preset_pack':
      return files([...p.presets, p.demo, ...p.perPresetDemos]);
    case 'sample_pack':
      return files([...p.samples, p.demo]);
    case 'splits_pack':
      return files([...p.loops, p.demo]);
    case 'midi_pack':
      return files([...p.midiFiles, p.demo]);
    case 'theme':
      return files(p.screenshots);
  }
}

/** Added, removed, replaced (same path, new hash) and renamed (same hash, new path) files. */
function diffFiles(before: readonly FileRef[], after: readonly FileRef[]): { changes: FileChange[]; unchanged: number } {
  const beforeByPath = new Map(before.map((f) => [f.path, f]));
  const afterByPath = new Map(after.map((f) => [f.path, f]));
  const changes: FileChange[] = [];
  let unchanged = 0;

  const goneByHash = new Map<string, FileRef>();
  for (const file of before) if (!afterByPath.has(file.path)) goneByHash.set(file.sha256, file);

  for (const file of after) {
    const old = beforeByPath.get(file.path);
    if (old) {
      if (old.sha256 === file.sha256) unchanged += 1;
      else changes.push({ change: 'replaced', path: file.path, beforeSha256: old.sha256, afterSha256: file.sha256, bytesDelta: file.bytes - old.bytes });
      continue;
    }
    const renamedFrom = goneByHash.get(file.sha256);
    if (renamedFrom) {
      goneByHash.delete(file.sha256);
      changes.push({
        change: 'renamed',
        path: file.path,
        previousPath: renamedFrom.path,
        beforeSha256: renamedFrom.sha256,
        afterSha256: file.sha256,
        bytesDelta: file.bytes - renamedFrom.bytes,
      });
    } else {
      changes.push({ change: 'added', path: file.path, afterSha256: file.sha256, bytesDelta: file.bytes });
    }
  }
  for (const file of goneByHash.values()) {
    changes.push({ change: 'removed', path: file.path, beforeSha256: file.sha256, bytesDelta: -file.bytes });
  }
  return { changes, unchanged };
}

function trackChanges(before: readonly SongTrack[], after: readonly SongTrack[], out: FieldChange[], kinds: Set<ChangeKind>) {
  const beforeIds = before.map((t) => t.id);
  const afterIds = after.map((t) => t.id);
  if (!same(beforeIds, afterIds)) {
    kinds.add('tracklist');
    out.push({ field: 'tracks', kind: 'tracklist', before: before.map((t) => t.title), after: after.map((t) => t.title) });
  }
  for (const track of after) {
    const old = before.find((t) => t.id === track.id);
    if (!old) continue;
    if (old.audio.sha256 !== track.audio.sha256) {
      kinds.add('audio');
      out.push({ field: `tracks.${track.id}.audio`, kind: 'audio', before: old.audio.sha256, after: track.audio.sha256 });
    }
    const meta: [string, unknown, unknown][] = [
      ['title', old.title, track.title],
      ['explicit', old.explicit, track.explicit],
      ['language', old.language, track.language],
      ['isrc', old.isrc, track.isrc],
      ['previewStartMs', old.previewStartMs, track.previewStartMs],
    ];
    for (const [name, a, b] of meta) {
      if (!same(a, b)) {
        kinds.add('metadata');
        out.push({ field: `tracks.${track.id}.${name}`, kind: 'metadata', before: a, after: b });
      }
    }
  }
}

/** The change summary of an update (`after`) against the live revision (`before`). */
export function diffRevision(before: ReleasePayload, after: ReleasePayload): ChangeSummary {
  const kinds = new Set<ChangeKind>();
  const fields: FieldChange[] = [];
  for (const spec of comparedFields(after.kind)) {
    const a = spec.get(before);
    const b = spec.get(after);
    if (!same(a, b)) {
      kinds.add(spec.kind);
      fields.push({ field: spec.field, kind: spec.kind, before: a, after: b });
    }
  }
  if (before.kind === 'song' && after.kind === 'song') trackChanges(before.tracks, after.tracks, fields, kinds);

  const beforeFiles = deliverables(before);
  const afterFiles = deliverables(after);
  const { changes, unchanged } = diffFiles(beforeFiles.map((d) => d.file), afterFiles.map((d) => d.file));
  const audioPaths = new Set([...beforeFiles, ...afterFiles].filter((d) => d.group === 'audio').map((d) => d.file.path));
  if (changes.some((c) => !audioPaths.has(c.path) && !(c.previousPath && audioPaths.has(c.previousPath)))) kinds.add('files');

  const ordered = KIND_ORDER.filter((k) => kinds.has(k));
  return {
    kinds: ordered,
    fields,
    files: changes,
    unchangedFileCount: unchanged,
    reviewDepth: maxDepth(ordered.map((k) => depthForKind(after.kind, k))),
  };
}

export function emptyChangeSummary(): ChangeSummary {
  return { kinds: [], fields: [], files: [], unchangedFileCount: 0, reviewDepth: 'light' };
}

export type WordDiffPart = { type: 'same' | 'added' | 'removed'; text: string };

/** A word-level diff (longest common subsequence) for the description in Studio's live-vs-pending view. */
export function diffWords(before: string, after: string): WordDiffPart[] {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const parts: WordDiffPart[] = [];
  const push = (type: WordDiffPart['type'], word: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += ` ${word}`;
    else parts.push({ type, text: word });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('removed', a[i]);
      i += 1;
    } else {
      push('added', b[j]);
      j += 1;
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return parts;
}
