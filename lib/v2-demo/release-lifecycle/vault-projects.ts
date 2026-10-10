/**
 * Demo Vault projects for the wizard's source step (WEB-V2-SPEC §6.6) and the
 * prefill rules of RELEASE-LIFECYCLE §5.3.
 *
 * Shapes follow the Vault's project row: BPM and key carry DETECT-SPEC's
 * provenance (`analysis` with a confidence until the seller confirms them), keys
 * are sharp-root `{root, mode}` or null ("No key"), never a default C Major.
 * Every project and person here is fictional. None reuses a Studio seed title.
 */
import type {
  BeatPayload,
  BpmString,
  CreditEntry,
  DawKind,
  FileRef,
  IsoDateTime,
  KeyValue,
  LeaseTier,
  LeaseTierId,
  PresetCategory,
  PresetPackPayload,
  ProvenanceEvidence,
  Provenanced,
  ReleasePayload,
  ReleaseType,
  SamplePackPayload,
  SongPayload,
  Synth,
} from './types.ts';
import { LEASE_TIER_IDS } from './types.ts';
import { CREDITS } from '../credits/config.ts';
import {
  audioFile,
  countOneShots,
  demoCover,
  extensionOf,
  fileName,
  numberedAudio,
  plainFile,
  seededDuration,
} from './demo-files.ts';
import { PRESET_CATEGORIES } from './options.ts';

export type WizardType = 'song' | 'beat' | 'preset_pack' | 'sample_pack';

export const DEMO_VAULT_ID = 'demo-vault-nightjar';

export interface VaultProject {
  /** URL-safe id for `/publish/{type}?project={id}`. */
  id: string;
  /** Project name, NFC. With the vault id it is the project's identity (VaultSourceRef). */
  name: string;
  daw: DawKind;
  description: string;
  tags: string[];
  /** Detect's tag suggestions: shown as chips to add, never applied automatically (§5.3). */
  tagSuggestions: string[];
  bpm?: Provenanced<BpmString>;
  /** Detect's half- and double-time alternates for the BPM. */
  bpmAlternates: string[];
  key?: Provenanced<KeyValue>;
  coverSeed: string;
  playerFile: string;
  dawFile: string;
  artists: string[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** The whole project tree: deliverables, the DAW session, bounces, the cover and sync files. */
  files: FileRef[];
  /** The wizard type the founder script uses this project for. */
  suggestedType: WizardType;
}

const user = <T,>(value: T): Provenanced<T> => ({ value, source: 'user', confirmed: true });
const detected = <T,>(value: T, confidence: number): Provenanced<T> => ({ value, source: 'analysis', confidence, confirmed: false });

function stems(folder: string, project: string, names: readonly string[], durationMs: number): FileRef[] {
  return names.map((n) => audioFile(`${folder}/${project} ${n}.wav`, durationMs));
}

function presetFiles(folder: string, prefix: string, count: number, ext: string): FileRef[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return plainFile(`${folder}/${prefix} ${n}.${ext}`, 'preset', 18_000 + ((i * 7919) % 40_000));
  });
}

const SYNC_FILES = [plainFile('.trackvault.json', 'other', 1_820)];

/** The five pickable projects (WEB-V2-SPEC §6.6). */
export const VAULT_PROJECTS: readonly VaultProject[] = [
  {
    id: 'saltmarsh-kit',
    name: 'Saltmarsh Kit',
    daw: 'reaper',
    description:
      'Drums and percussion recorded on the salt marsh outside Tromsø: driftwood hits, shell shakers and a kick made from a fish crate, edited in Reaper.',
    tags: ['drums', 'percussion', 'field recording', 'organic'],
    tagSuggestions: ['bright', 'energetic'],
    bpm: user('124'),
    bpmAlternates: ['62'],
    key: user<KeyValue>(null),
    coverSeed: 'vault-saltmarsh-kit',
    playerFile: 'Saltmarsh Kit demo.wav',
    dawFile: 'Saltmarsh Kit.rpp',
    artists: ['Maya Lind'],
    createdAt: '2026-08-14T18:20:00Z',
    updatedAt: '2026-10-02T21:05:00Z',
    files: [
      ...numberedAudio('One-shots', 'Saltmarsh Kick', 8, 'one_shot'),
      ...numberedAudio('One-shots', 'Saltmarsh Snare', 8, 'one_shot'),
      ...numberedAudio('One-shots', 'Saltmarsh Hat', 8, 'one_shot'),
      ...numberedAudio('One-shots', 'Saltmarsh Perc', 12, 'one_shot'),
      audioFile('Saltmarsh Kit demo.wav', 46_000),
      audioFile('Bounces/Saltmarsh full take.wav', 212_000),
      plainFile('Saltmarsh Kit.rpp', 'daw', 412_000),
      plainFile('Backups/Saltmarsh Kit-2026-09-30.rpp-bak', 'other', 398_000),
      plainFile('cover.png', 'image', 2_310_000),
      ...SYNC_FILES,
    ],
    suggestedType: 'sample_pack',
  },
  {
    id: 'frost-lines',
    name: 'Frost Lines',
    daw: 'fl_studio',
    description: 'A cold, sparse drill beat: sliding 808s, glassy bells and a pad bounced from an old Juno.',
    tags: ['drill', 'dark', '808'],
    tagSuggestions: ['dark', 'energetic'],
    bpm: detected('140', 0.91),
    bpmAlternates: ['70'],
    key: detected<KeyValue>({ root: 'F#', mode: 'Minor' }, 0.93),
    coverSeed: 'vault-frost-lines',
    playerFile: 'Frost Lines.wav',
    dawFile: 'Frost Lines.flp',
    artists: ['Maya Lind'],
    createdAt: '2026-09-02T22:40:00Z',
    updatedAt: '2026-10-06T23:10:00Z',
    files: [
      audioFile('Frost Lines.wav', 166_000),
      ...stems('Stems', 'Frost Lines', ['Kick', '808', 'Snare', 'Hats', 'Pad', 'Lead', 'Bells', 'FX'], 166_000),
      audioFile('Samples/Ice crack.wav', seededDuration('ice', 'one_shot')),
      plainFile('Frost Lines.flp', 'daw', 1_240_000),
      plainFile('Backup/Frost Lines (autosave).flp', 'other', 1_236_000),
      plainFile('cover.png', 'image', 2_640_000),
      ...SYNC_FILES,
    ],
    suggestedType: 'beat',
  },
  {
    id: 'copper-rain',
    name: 'Copper Rain',
    daw: 'logic',
    description: 'Rain on a tin roof, a detuned Rhodes and soft tape drums, cut into loops while the track came together.',
    tags: ['lo-fi', 'rain', 'keys'],
    tagSuggestions: ['chill'],
    bpm: user('118'),
    bpmAlternates: ['59'],
    coverSeed: 'vault-copper-rain',
    playerFile: 'Copper Rain.wav',
    dawFile: 'Copper Rain.logicx',
    artists: ['Maya Lind'],
    createdAt: '2026-07-21T19:00:00Z',
    updatedAt: '2026-09-29T20:45:00Z',
    files: [
      audioFile('Copper Rain.wav', 212_000),
      ...numberedAudio('Loops', 'Copper Rain Loop', 16, 'loop'),
      ...stems('Stems', 'Copper Rain', ['Drums', 'Rhodes', 'Bass', 'Rain', 'Pad', 'Vinyl'], 212_000),
      plainFile('Copper Rain.logicx', 'daw', 48_200_000),
      plainFile('cover.png', 'image', 2_120_000),
      ...SYNC_FILES,
    ],
    suggestedType: 'beat',
  },
  {
    id: 'fog-bank',
    name: 'Fog Bank',
    daw: 'ableton',
    description: 'Eighteen slow, breathing Vital presets for ambient pads, soft keys and textures, with an audio demo of the pack.',
    tags: ['ambient', 'pads', 'vital'],
    tagSuggestions: ['chill', 'bright'],
    bpm: user('76'),
    bpmAlternates: ['152'],
    key: detected<KeyValue>({ root: 'D', mode: 'Major' }, 0.71),
    coverSeed: 'vault-fog-bank',
    playerFile: 'Fog Bank demo.wav',
    dawFile: 'Fog Bank.als',
    artists: ['Maya Lind'],
    createdAt: '2026-08-30T17:15:00Z',
    updatedAt: '2026-10-05T19:30:00Z',
    files: [
      ...presetFiles('Presets/Pads', 'Fog Bank Pad', 8, 'vital'),
      ...presetFiles('Presets/Keys', 'Fog Bank Keys', 5, 'vital'),
      ...presetFiles('Presets/Textures', 'Fog Bank Texture', 5, 'vital'),
      audioFile('Fog Bank demo.wav', 84_000),
      audioFile('Demos/Fog Bank Pad 01.wav', 32_000),
      audioFile('Demos/Fog Bank Keys 01.wav', 30_000),
      audioFile('Demos/Fog Bank Texture 01.wav', 34_000),
      plainFile('Fog Bank.als', 'daw', 286_000),
      plainFile('cover.png', 'image', 2_480_000),
      ...SYNC_FILES,
    ],
    suggestedType: 'preset_pack',
  },
  {
    id: 'northern-wake',
    name: 'Northern Wake',
    daw: 'ableton',
    description: 'A slow single about the boat home in the polar night, with a mastered WAV and the full set of stems.',
    tags: ['downtempo', 'electronic', 'vocal'],
    tagSuggestions: ['chill'],
    bpm: user('92'),
    bpmAlternates: ['46', '184'],
    key: detected<KeyValue>({ root: 'A', mode: 'Minor' }, 0.88),
    coverSeed: 'vault-northern-wake',
    playerFile: 'Northern Wake (master).wav',
    dawFile: 'Northern Wake.als',
    artists: ['Maya Lind'],
    createdAt: '2026-06-18T20:10:00Z',
    updatedAt: '2026-10-04T22:00:00Z',
    files: [
      audioFile('Northern Wake (master).wav', 245_000),
      ...stems(
        'Stems',
        'Northern Wake',
        ['Kick', 'Snare', 'Hats', 'Bass', 'Rhodes', 'Pad', 'Lead vocal', 'Backing vocals', 'Guitar', 'Strings', 'Arp', 'FX', 'Room', 'Choir'],
        245_000,
      ),
      plainFile('Northern Wake.als', 'daw', 344_000),
      plainFile('Lyrics.txt', 'other', 1_400),
      plainFile('cover.png', 'image', 2_890_000),
      ...SYNC_FILES,
    ],
    suggestedType: 'song',
  },
];

/**
 * Projects behind two Studio seeds whose fixes need the project's files: Fog
 * Choir Pads (R4) gets its missing demo from here and Untitled Loop Kit (R5)
 * its last six loops. They don't appear in the source step's picker.
 */
const SEED_PROJECTS: readonly VaultProject[] = [
  {
    id: 'fog-choir-pads',
    name: 'Fog Choir Pads',
    daw: 'ableton',
    description: 'Choir-like Serum 2 pads built from my own voice, resampled and layered.',
    tags: ['pads', 'choir', 'serum'],
    tagSuggestions: ['dark'],
    bpm: user('70'),
    bpmAlternates: [],
    key: user<KeyValue>({ root: 'E', mode: 'Minor' }),
    coverSeed: 'demo-r04-cover-v1',
    playerFile: 'Fog Choir Pads demo.wav',
    dawFile: 'Fog Choir Pads.als',
    artists: ['Maya Lind'],
    createdAt: '2026-09-10T18:00:00Z',
    updatedAt: '2026-09-27T20:00:00Z',
    files: [
      ...presetFiles('Presets', 'Fog Choir', 24, 'SerumPreset'),
      audioFile('Fog Choir Pads demo.wav', 96_000),
      plainFile('Fog Choir Pads.als', 'daw', 302_000),
      plainFile('cover.png', 'image', 2_200_000, 'demo-r04-cover-v1'),
      ...SYNC_FILES,
    ],
    suggestedType: 'preset_pack',
  },
  {
    id: 'untitled-loop-kit',
    name: 'Untitled Loop Kit',
    daw: 'ableton',
    description: 'Twenty loops from late sessions: dusty drums, bass and keys, all played and recorded in Tromsø.',
    tags: ['loops', 'downtempo', 'keys'],
    tagSuggestions: ['chill'],
    bpm: user('120'),
    bpmAlternates: ['60'],
    key: detected<KeyValue>({ root: 'A', mode: 'Minor' }, 0.64),
    coverSeed: 'demo-r05-cover-v1',
    playerFile: 'Untitled Loop Kit demo.wav',
    dawFile: 'Untitled Loop Kit.als',
    artists: ['Maya Lind'],
    createdAt: '2026-09-18T19:00:00Z',
    updatedAt: '2026-10-09T09:30:00Z',
    files: [
      ...numberedAudio('Loops', 'ULK Loop', 20, 'loop'),
      audioFile('Untitled Loop Kit demo.wav', 52_000),
      plainFile('Untitled Loop Kit.als', 'daw', 268_000),
      plainFile('cover.png', 'image', 2_050_000, 'demo-r05-cover-v1'),
      ...SYNC_FILES,
    ],
    suggestedType: 'sample_pack',
  },
];

export function findProject(idOrName: string): VaultProject | null {
  return [...VAULT_PROJECTS, ...SEED_PROJECTS].find((p) => p.id === idOrName || p.name === idOrName) ?? null;
}

/* ------------------------------------------------------------------ */
/* Selection rules (§5.3)                                              */
/* ------------------------------------------------------------------ */

const LOSSLESS = ['wav', 'aif', 'aiff', 'flac'];
const AUDIO = [...LOSSLESS, 'mp3', 'ogg', 'm4a'];
const DAW_EXTENSIONS: Readonly<Record<string, DawKind>> = {
  als: 'ableton', flp: 'fl_studio', logicx: 'logic', logic: 'logic', ptx: 'pro_tools', cpr: 'cubase', rpp: 'reaper',
  reason: 'reason', song: 'studio_one', bwproject: 'bitwig', npr: 'sonar', cwp: 'cakewalk', band: 'garageband',
};
const NON_DELIVERABLE_FOLDER = /(^|\/)(stems?|bounces?|exports?|masters?|mix(es)?)\//i;
const ALWAYS_EXCLUDED = /(^|\/)(\.trackvault\.json|local\.json|online\.json|files\.json|\.DS_Store|Icon\r|Thumbs\.db)$|(^|\/)\.waveforms\/|(^|\/)(backups?|autosaves?)\//i;

export function isAudio(file: FileRef): boolean {
  return AUDIO.includes(extensionOf(file.path));
}

export function isLosslessAudio(file: FileRef): boolean {
  return LOSSLESS.includes(extensionOf(file.path));
}

function dawKindOf(path: string): DawKind | null {
  return DAW_EXTENSIONS[extensionOf(path)] ?? null;
}

function deliverable(file: FileRef): boolean {
  return !ALWAYS_EXCLUDED.test(file.path) && dawKindOf(file.path) === null && extensionOf(file.path) !== 'rpp-bak';
}

/** Sample pack: lossless audio outside stems/bounce/export/master/mix folders, not the player file. */
function defaultSamples(project: VaultProject): FileRef[] {
  return project.files.filter(
    (f) => deliverable(f) && isLosslessAudio(f) && !NON_DELIVERABLE_FOLDER.test(f.path) && f.path !== project.playerFile,
  );
}

/** Audio files a seller may pick for a pack (the default selection plus anything else lossless). */
export function audioCandidates(project: VaultProject): FileRef[] {
  return project.files.filter((f) => deliverable(f) && isAudio(f));
}

export function stemFiles(project: VaultProject): FileRef[] {
  return project.files.filter((f) => /(^|\/)stems\//i.test(f.path) && isAudio(f));
}

export function presetCandidates(project: VaultProject): FileRef[] {
  return project.files.filter((f) => f.kind === 'preset');
}

function synthOf(files: readonly FileRef[]): Synth {
  const serum = files.filter((f) => extensionOf(f.path) === 'serumpreset').length;
  const vital = files.filter((f) => extensionOf(f.path) === 'vital').length;
  return serum > vital ? 'serum2' : 'vital';
}

/** Exclusive delivers the whole project, the DAW session included (§3.3), minus sync and OS files. */
function wholeProject(project: VaultProject): FileRef[] {
  return project.files.filter((f) => !ALWAYS_EXCLUDED.test(f.path) && extensionOf(f.path) !== 'rpp-bak');
}

/** Categories from preset folder names (§5.5): "Presets/Pads/…" → pad. */
function presetCategoriesFrom(files: readonly FileRef[]): PresetCategory[] {
  const folders = files.map((f) => f.path.split('/').slice(0, -1).join(' ').toLowerCase());
  return PRESET_CATEGORIES.filter((category) => folders.some((folder) => folder.includes(category)));
}

/** Preview start: 30% in, moved earlier if needed so the 30-second clip fits (§5.5). */
export function defaultPreviewStart(durationMs: number | undefined): number {
  if (!durationMs) return 0;
  return Math.max(0, Math.min(Math.round(durationMs * 0.3), durationMs - 30_000));
}

function tier(id: LeaseTierId, enabled: boolean, files: FileRef[], displayName: string): LeaseTier {
  const config = CREDITS.beatTiers[id];
  return {
    tier: id,
    enabled,
    price: { amountMinor: config.defaultEur * 100, currency: 'EUR' },
    files,
    audioStreamCap: config.streams,
    producerPublishingSharePct: 50,
    creditLine: `prod. by ${displayName}`,
    contentIdAllowed: id === 'exclusive',
  };
}

/** Files each lease tier delivers (§3.3): WAV the main mix, Stems and Unlimited add stems, Exclusive the whole project. */
export function tierFiles(id: LeaseTierId, mainMix: FileRef, stemList: readonly FileRef[], project: VaultProject | null): FileRef[] {
  if (id === 'wav') return [mainMix];
  if (id === 'exclusive') return project ? wholeProject(project) : [mainMix, ...stemList];
  return [mainMix, ...stemList];
}

export interface SellerIdentity {
  /** "Nightjar": credit lines and ℗ lines. */
  displayName: string;
  /** "Maya Lind": the songwriter credit. */
  personName: string;
  userId: string;
}

function selfCredit(seller: SellerIdentity): CreditEntry {
  return {
    name: seller.personName,
    cadenceaUserId: seller.userId,
    roles: ['writer', 'producer', 'performer'],
    masterSharePct: 100,
    compositionSharePct: 100,
    cmo: null,
    ipi: null,
    confirmation: 'self',
  };
}

/**
 * The wizard's starting payload for a project and type (§5.3). Detected values
 * keep their provenance; nothing detected counts as confirmed.
 */
export function prefillPayload(project: VaultProject, type: WizardType, seller: SellerIdentity, now: IsoDateTime): ReleasePayload {
  const year = now.slice(0, 4);
  const player = project.files.find((f) => f.path === project.playerFile) ?? null;
  const common = {
    title: project.name,
    description: project.description,
    tags: project.tags.slice(0, 10),
    genre: null,
    moods: [],
    cover: demoCover(project.coverSeed),
    ...(project.bpm ? { bpm: { ...project.bpm } } : {}),
    ...(project.key ? { key: { ...project.key } } : {}),
  };
  const packPrice = { kind: 'credits' as const, credits: CREDITS.priceList.pack.min };

  switch (type) {
    case 'sample_pack': {
      const samples = defaultSamples(project);
      const oneShots = countOneShots(samples);
      const payload: SamplePackPayload = {
        ...common,
        kind: 'sample_pack',
        samples,
        contents: { oneShots, loops: samples.length - oneShots },
        demo: player,
        licensedMaterial: [],
        price: packPrice,
      };
      return payload;
    }
    case 'preset_pack': {
      const presets = presetCandidates(project);
      const synth = synthOf(presets);
      const names = new Set(presets.map((p) => fileName(p.path).replace(/\.[^.]+$/, '').toLowerCase()));
      const perPresetDemos = project.files.filter(
        (f) => isAudio(f) && f.path !== project.playerFile && names.has(fileName(f.path).replace(/\.[^.]+$/, '').toLowerCase()),
      );
      const payload: PresetPackPayload = {
        ...common,
        kind: 'preset_pack',
        synth,
        minSynthVersion: synth === 'serum2' ? '2.0' : '',
        vitalTier: null,
        presets,
        categories: presetCategoriesFrom(presets),
        demo: player,
        perPresetDemos,
        embedsAudio: null,
        embeddedAudioNote: null,
        licensedMaterial: [],
        price: packPrice,
      };
      return payload;
    }
    case 'beat': {
      const mainMix = player ?? audioCandidates(project)[0];
      const stemList = stemFiles(project);
      const payload: BeatPayload = {
        ...common,
        kind: 'beat',
        mainMix,
        previewStartMs: defaultPreviewStart(mainMix.durationMs),
        previewHasProducerTag: false,
        stems: stemList,
        tiers: LEASE_TIER_IDS.map((id) =>
          tier(id, id === 'wav' || id === 'stems', tierFiles(id, mainMix, stemList, project), seller.displayName),
        ),
        coProducers: [],
        licensedMaterial: [],
        price: { kind: 'per_tier' },
      };
      return payload;
    }
    case 'song': {
      const audio = player ?? audioCandidates(project)[0];
      const payload: SongPayload = {
        ...common,
        kind: 'song',
        format: 'single',
        releaseDate: null,
        territories: ['NO'],
        tracks: [
          {
            id: 'trk-1',
            position: 1,
            title: fileName(audio.path).replace(/\.[^.]+$/, '').replace(/\s*\((master|final|mix)\)$/i, ''),
            audio,
            isrc: null,
            explicit: false,
            language: '',
            ...(project.bpm ? { bpm: { ...project.bpm } } : {}),
            ...(project.key ? { key: { ...project.key } } : {}),
            previewStartMs: defaultPreviewStart(audio.durationMs),
            credits: [selfCredit(seller)],
          },
        ],
        licensedMaterial: [],
        pLine: `℗ ${year} ${seller.displayName}`,
        cLine: `© ${year} ${seller.displayName}`,
        price: { kind: 'stream_only' },
        allowFanSupport: true,
      };
      return payload;
    }
  }
}

/** The provenance bundle captured at submit from the project (§5.7). */
export function buildEvidence(project: VaultProject, now: IsoDateTime, howMadeNote: string | null): ProvenanceEvidence {
  const dawSessions = project.files
    .filter((f) => dawKindOf(f.path) !== null && !ALWAYS_EXCLUDED.test(f.path))
    .map((f) => ({ path: f.path, daw: dawKindOf(f.path) as DawKind, sha256: f.sha256, bytes: f.bytes }));
  return {
    capturedAt: now,
    source: { vaultId: DEMO_VAULT_ID, projectName: project.name, pushedAtCapture: true, capturedAt: now },
    manifest: project.files.map((f) => ({ path: f.path, sha256: f.sha256, bytes: f.bytes })),
    dawSessions,
    stemCount: stemFiles(project).length,
    audioFileCount: project.files.filter(isAudio).length,
    projectCreatedAt: project.createdAt,
    projectUpdatedAt: project.updatedAt,
    historyDepthDays: null,
    howMadeNote: howMadeNote?.trim() || null,
    retainUntil: null,
  };
}

export function isWizardType(type: ReleaseType): type is WizardType {
  return type === 'song' || type === 'beat' || type === 'preset_pack' || type === 'sample_pack';
}
