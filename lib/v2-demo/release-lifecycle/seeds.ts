/**
 * The 16 seeded demo releases of RELEASE-LIFECYCLE §7.4 (R1…R16 = demo-r01…
 * demo-r16), Nightjar's releases. Nightjar is Maya Lind's artist name
 * (DECISIONS.md D1), so every seed's `sellerId` is the persona's user id.
 *
 * Together the seeds cover every release status, revision status, review case
 * status and appeal state. Dates are fixed and read against the demo clock
 * (DEMO_NOW, §7.2): R8 stays scheduled for 24 Oct 2026 and every seeded appeal
 * window stays open whenever the demo is opened. Market listings link to these
 * releases by slug (WEB-V2-SPEC §6.5); `seedPublicView` gives the Market's
 * server render the same values the store has before any action.
 */
import type {
  Actor,
  Appeal,
  AutoCheck,
  BeatPayload,
  CreditEntry,
  DawKind,
  FileRef,
  IsoDateTime,
  KeyValue,
  LeaseTier,
  LifecycleState,
  PresetPackPayload,
  ProvenanceEvidence,
  Provenanced,
  ReasonItem,
  Release,
  ReleasePayload,
  ReleaseType,
  RestrictionKind,
  ReviewCase,
  ReviewDecision,
  ReviewEvent,
  ReviewEventType,
  RevisionStatus,
  SamplePackPayload,
  SongPayload,
  SongTrack,
  StatementOfReasons,
} from './types.ts';
import type { PublicReleaseView } from './public.ts';
import { APPEAL_WINDOW_DAYS, RELEASE_LIFECYCLE_SPEC_VERSION, RELEASE_TYPE_INFO } from './types.ts';
import { SOR_COPY } from './copy.ts';
import { CREDITS } from '../credits/config.ts';
import { addDays, DEMO_NOW } from '../clock.ts';
import { PERSONA } from '../sellers.ts';
import { fill } from '../format.ts';
import { audioFile, countOneShots, demoCover, numberedAudio, plainFile } from './demo-files.ts';
import { diffRevision } from './diff.ts';
import { reasonItem } from './reasons.ts';
import { toPublicView } from './selectors.ts';
import { buildEvidence, DEMO_VAULT_ID, defaultPreviewStart, findProject } from './vault-projects.ts';

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

const SELLER: Actor = { kind: 'seller', userId: PERSONA.userId };
const REVIEWER_1 = 'reviewer-1';
const REVIEWER_2 = 'reviewer-2';
const reviewer = (id: string): Actor => ({ kind: 'reviewer', reviewerId: id });

const user = <T,>(value: T): Provenanced<T> => ({ value, source: 'user', confirmed: true });

function maya(): CreditEntry {
  return {
    name: PERSONA.personName,
    cadenceaUserId: PERSONA.userId,
    roles: ['writer', 'producer', 'performer'],
    masterSharePct: 100,
    compositionSharePct: 100,
    cmo: 'TONO',
    ipi: null,
    confirmation: 'self',
  };
}

function track(id: string, position: number, title: string, path: string, durationMs: number, extra: Partial<SongTrack> = {}): SongTrack {
  return {
    id,
    position,
    title,
    audio: audioFile(path, durationMs),
    isrc: null,
    explicit: false,
    language: 'zxx',
    previewStartMs: defaultPreviewStart(durationMs),
    credits: [maya()],
    ...extra,
  };
}

function tiers(prices: Partial<Record<LeaseTier['tier'], number>>, mainMix: FileRef, stems: FileRef[], dawFile: FileRef): LeaseTier[] {
  return (['wav', 'stems', 'unlimited', 'exclusive'] as const).map((id) => {
    const config = CREDITS.beatTiers[id];
    const eur = prices[id];
    return {
      tier: id,
      enabled: eur !== undefined,
      price: { amountMinor: (eur ?? config.defaultEur) * 100, currency: 'EUR' },
      files: id === 'wav' ? [mainMix] : id === 'exclusive' ? [mainMix, ...stems, dawFile] : [mainMix, ...stems],
      audioStreamCap: config.streams,
      producerPublishingSharePct: 50,
      creditLine: `prod. by ${PERSONA.artistName}`,
      contentIdAllowed: id === 'exclusive',
    };
  });
}

function credits(n: number): { kind: 'credits'; credits: number } {
  return { kind: 'credits', credits: n };
}

function attested(at: IsoDateTime) {
  return {
    standardVersion: 'human-made-2026-10' as const,
    madeByMe: true,
    noGeneratedAudio: true,
    licensedMaterialListed: true,
    coverRights: true,
    falseStatementConsequences: true,
    acceptedAt: at,
  };
}

/** A captured evidence bundle for seeds without a demo Vault project. */
function seedEvidence(o: {
  project: string;
  daw: DawKind;
  dawFile: FileRef;
  deliverables: FileRef[];
  stems: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  capturedAt: IsoDateTime;
}): ProvenanceEvidence {
  const stemFiles = Array.from({ length: o.stems }, (_, i) =>
    audioFile(`Stems/${o.project} stem ${String(i + 1).padStart(2, '0')}.wav`, 180_000),
  );
  const files = [...o.deliverables, ...stemFiles, o.dawFile];
  return {
    capturedAt: o.capturedAt,
    source: { vaultId: DEMO_VAULT_ID, projectName: o.project, pushedAtCapture: true, capturedAt: o.capturedAt },
    manifest: files.map((f) => ({ path: f.path, sha256: f.sha256, bytes: f.bytes })),
    dawSessions: [{ path: o.dawFile.path, daw: o.daw, sha256: o.dawFile.sha256, bytes: o.dawFile.bytes }],
    stemCount: o.stems,
    audioFileCount: files.filter((f) => f.kind === 'audio').length,
    projectCreatedAt: o.createdAt,
    projectUpdatedAt: o.updatedAt,
    historyDepthDays: null,
    howMadeNote: null,
    retainUntil: null,
  };
}

function statement(
  restriction: RestrictionKind,
  reasons: ReasonItem[],
  facts: string,
  ground: StatementOfReasons['ground'],
  automatedDetection: boolean,
  issuedAt: IsoDateTime,
  appealFrom: IsoDateTime = issuedAt,
): StatementOfReasons {
  return { restriction, reasons, facts, ground, automatedDetection, appealUntil: addDays(appealFrom, APPEAL_WINDOW_DAYS), issuedAt };
}

interface RevisionSpec {
  seq: number;
  status: RevisionStatus;
  payload: ReleasePayload;
  createdAt: IsoDateTime;
  updatedAt?: IsoDateTime;
  version?: number;
  submittedAt?: IsoDateTime;
  decidedAt?: IsoDateTime;
  supersededAt?: IsoDateTime;
  changeNote?: string;
  evidence?: ProvenanceEvidence;
  caseIds?: string[];
}

interface CaseSpec {
  id: string;
  revisionSeq: number | null;
  kind: ReviewCase['kind'];
  depth: ReviewCase['depth'];
  status: ReviewCase['status'];
  openedAt: IsoDateTime;
  decision?: ReviewDecision;
  decidedBy?: string;
  assignedReviewerId?: string;
  priority?: number;
  checks?: AutoCheck[];
  appealOfCaseId?: string;
}

interface EventSpec {
  type: ReviewEventType;
  at: IsoDateTime;
  actor: Actor;
  seq?: number;
  version?: number;
  caseId?: string;
  appealId?: string;
  reasons?: ReasonItem[];
  statement?: StatementOfReasons;
  note?: string;
}

interface SeedSpec {
  n: number;
  type: ReleaseType;
  slug: string;
  release: Pick<Release, 'status' | 'createdAt'> &
    Partial<Pick<Release, 'goesPublicAt' | 'unpublished' | 'suspension' | 'firstLiveAt' | 'demoStats'>>;
  current?: number;
  open?: number;
  project?: string;
  revisions: RevisionSpec[];
  cases: CaseSpec[];
  appeals?: Omit<Appeal, 'releaseId' | 'revisionId'>[];
  events: EventSpec[];
}

const seedId = (n: number) => `demo-r${String(n).padStart(2, '0')}`;

function buildState(seeds: readonly SeedSpec[]): LifecycleState {
  const state: LifecycleState = {
    specVersion: RELEASE_LIFECYCLE_SPEC_VERSION,
    releases: {},
    revisions: {},
    cases: {},
    appeals: {},
    events: [],
  };
  const events: ReviewEvent[] = [];

  for (const seed of seeds) {
    const releaseId = seedId(seed.n);
    const revId = (seq: number) => `${releaseId}-rev${seq}`;
    const caseRevision = new Map(seed.cases.map((c) => [c.id, c.revisionSeq]));

    for (const spec of seed.revisions) {
      // An update is based on the newest version approved before it was started.
      const previous = seed.revisions.filter((r) => r.seq < spec.seq && r.version !== undefined).pop();
      const baseVersion = previous?.version ?? null;
      state.revisions[revId(spec.seq)] = {
        id: revId(spec.seq),
        releaseId,
        seq: spec.seq,
        version: spec.version ?? null,
        baseVersion,
        status: spec.status,
        payload: spec.payload,
        changes: previous ? diffRevision(previous.payload, spec.payload) : null,
        changeNote: spec.changeNote ?? null,
        replyToReviewer: null,
        evidence: spec.evidence ?? null,
        attestation: spec.submittedAt ? attested(spec.submittedAt) : null,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt ?? spec.submittedAt ?? spec.createdAt,
        submittedAt: spec.submittedAt ?? null,
        decidedAt: spec.decidedAt ?? null,
        supersededAt: spec.supersededAt ?? null,
        caseIds: seed.cases.filter((c) => c.revisionSeq === spec.seq).map((c) => c.id),
      };
    }

    for (const c of seed.cases) {
      state.cases[c.id] = {
        id: c.id,
        releaseId,
        revisionId: c.revisionSeq === null ? null : revId(c.revisionSeq),
        kind: c.kind,
        priority: c.priority ?? (c.kind === 'appeal' ? 40 : c.kind === 'report' || c.kind === 'audit' ? 30 : 50),
        depth: c.depth,
        status: c.status,
        assignedReviewerId: c.assignedReviewerId ?? c.decidedBy ?? null,
        checks: c.checks ?? [],
        decision: c.decision ?? null,
        decidedBy: c.decidedBy ?? null,
        appealOfCaseId: c.appealOfCaseId ?? null,
        openedAt: c.openedAt,
        decidedAt: c.decision?.at ?? null,
      };
    }

    for (const appeal of seed.appeals ?? []) {
      const seq = caseRevision.get(appeal.appealedCaseId) ?? null;
      state.appeals[appeal.id] = { ...appeal, releaseId, revisionId: seq === null ? null : revId(seq) };
    }

    const lastAt = seed.events.reduce((a, e) => (e.at > a ? e.at : a), seed.release.createdAt);
    const project = seed.project ?? seed.revisions[0].payload.title;
    state.releases[releaseId] = {
      id: releaseId,
      type: seed.type,
      slug: seed.slug,
      sellerId: PERSONA.userId,
      sellerHandle: PERSONA.sellerHandle,
      channels: [...RELEASE_TYPE_INFO[seed.type].surfaces],
      status: seed.release.status,
      goesPublicAt: seed.release.goesPublicAt ?? null,
      unpublished: seed.release.unpublished ?? null,
      suspension: seed.release.suspension ?? null,
      currentRevisionId: seed.current ? revId(seed.current) : null,
      openRevisionId: seed.open ? revId(seed.open) : null,
      revisionIds: seed.revisions.map((r) => revId(r.seq)),
      source: { vaultId: DEMO_VAULT_ID, projectName: project, pushedAtCapture: true, capturedAt: seed.release.createdAt },
      createdAt: seed.release.createdAt,
      updatedAt: lastAt,
      firstLiveAt: seed.release.firstLiveAt ?? null,
      ...(seed.release.demoStats ? { demoStats: seed.release.demoStats } : {}),
    };

    for (const e of seed.events) {
      events.push({
        id: '',
        releaseId,
        revisionId: e.seq ? revId(e.seq) : null,
        type: e.type,
        at: e.at,
        actor: e.actor,
        visibility: e.type === 'draft_saved' || e.type === 'auto_checks_completed' || e.type === 'publish_failed' ? 'internal' : 'seller',
        version: e.version ?? null,
        seq: e.seq ?? null,
        ...(e.caseId ? { caseId: e.caseId } : {}),
        ...(e.appealId ? { appealId: e.appealId } : {}),
        ...(e.reasons ? { reasons: e.reasons } : {}),
        ...(e.statement ? { statement: e.statement } : {}),
        ...(e.note ? { note: e.note } : {}),
      });
    }
  }

  state.events = events
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((e, i) => ({ ...e, id: `seed-ev-${String(i + 1).padStart(3, '0')}` }));
  return state;
}

/* ------------------------------------------------------------------ */
/* Payload helpers                                                     */
/* ------------------------------------------------------------------ */

function samplePack(o: {
  title: string;
  description: string;
  tags: string[];
  genre: string;
  moods: string[];
  cover: string;
  samples: FileRef[];
  demo: FileRef | null;
  price: number;
  bpm?: string;
  key?: Provenanced<KeyValue>;
}): SamplePackPayload {
  const oneShots = countOneShots(o.samples);
  return {
    kind: 'sample_pack',
    title: o.title,
    description: o.description,
    tags: o.tags,
    genre: o.genre,
    moods: o.moods,
    cover: demoCover(o.cover),
    ...(o.bpm ? { bpm: user(o.bpm) } : {}),
    ...(o.key ? { key: o.key } : {}),
    samples: o.samples,
    contents: { oneShots, loops: o.samples.length - oneShots },
    demo: o.demo,
    licensedMaterial: [],
    price: credits(o.price),
  };
}

function song(o: {
  title: string;
  description: string;
  tags: string[];
  genre: string;
  moods: string[];
  cover: string;
  bpm: string;
  key: KeyValue;
  format: SongPayload['format'];
  tracks: SongTrack[];
  releaseDate?: string;
  territories?: string[];
  price?: SongPayload['price'];
}): SongPayload {
  return {
    kind: 'song',
    title: o.title,
    description: o.description,
    tags: o.tags,
    genre: o.genre,
    moods: o.moods,
    cover: demoCover(o.cover),
    bpm: user(o.bpm),
    key: user(o.key),
    format: o.format,
    releaseDate: o.releaseDate ?? null,
    territories: o.territories ?? ['NO'],
    tracks: o.tracks,
    licensedMaterial: [],
    pLine: `℗ 2026 ${PERSONA.artistName}`,
    cLine: `© 2026 ${PERSONA.artistName}`,
    price: o.price ?? { kind: 'stream_only' },
    allowFanSupport: true,
  };
}

function beat(o: {
  title: string;
  description: string;
  tags: string[];
  genre: string;
  moods: string[];
  cover: string;
  bpm: string;
  key: KeyValue;
  durationMs: number;
  stems: string[];
  prices: Partial<Record<LeaseTier['tier'], number>>;
}): BeatPayload {
  const mainMix = audioFile(`${o.title}.wav`, o.durationMs);
  const stems = o.stems.map((s) => audioFile(`Stems/${o.title} ${s}.wav`, o.durationMs));
  const dawFile = plainFile(`${o.title}.flp`, 'daw', 1_100_000);
  return {
    kind: 'beat',
    title: o.title,
    description: o.description,
    tags: o.tags,
    genre: o.genre,
    moods: o.moods,
    cover: demoCover(o.cover),
    bpm: user(o.bpm),
    key: user(o.key),
    mainMix,
    previewStartMs: defaultPreviewStart(o.durationMs),
    previewHasProducerTag: true,
    stems,
    tiers: tiers(o.prices, mainMix, stems, dawFile),
    coProducers: [],
    licensedMaterial: [],
    price: { kind: 'per_tier' },
  };
}

function presetPack(o: {
  title: string;
  description: string;
  tags: string[];
  genre: string;
  moods: string[];
  cover: string;
  synth: PresetPackPayload['synth'];
  minSynthVersion: string;
  vitalTier: PresetPackPayload['vitalTier'];
  presets: FileRef[];
  categories: PresetPackPayload['categories'];
  demo: FileRef | null;
  price: number;
  bpm?: string;
  key?: KeyValue;
}): PresetPackPayload {
  return {
    kind: 'preset_pack',
    title: o.title,
    description: o.description,
    tags: o.tags,
    genre: o.genre,
    moods: o.moods,
    cover: demoCover(o.cover),
    ...(o.bpm ? { bpm: user(o.bpm) } : {}),
    ...(o.key !== undefined ? { key: user(o.key) } : {}),
    synth: o.synth,
    minSynthVersion: o.minSynthVersion,
    vitalTier: o.vitalTier,
    presets: o.presets,
    categories: o.categories,
    demo: o.demo,
    perPresetDemos: [],
    embedsAudio: false,
    embeddedAudioNote: null,
    licensedMaterial: [],
    price: credits(o.price),
  };
}

function presets(folder: string, prefix: string, count: number, ext: string): FileRef[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return plainFile(`${folder}/${prefix} ${n}.${ext}`, 'preset', 21_000 + ((i * 6151) % 30_000));
  });
}

const terms = (clause: string): StatementOfReasons['ground'] => ({ kind: 'terms', clause });

/* ------------------------------------------------------------------ */
/* R1 Late Ferry: live song with a past update                          */
/* ------------------------------------------------------------------ */

const r01v1 = song({
  title: 'Late Fery',
  description:
    'A slow night crossing from Tromsø, built on tape-saturated Rhodes and field recordings from the ferry deck.',
  tags: ['downtempo', 'rhodes', 'night'],
  genre: 'Downtempo',
  moods: ['melancholic', 'chill'],
  cover: 'demo-r01-cover',
  bpm: '84',
  key: { root: 'A', mode: 'Minor' },
  format: 'single',
  territories: ['NO', 'SE', 'DK'],
  tracks: [track('trk-1', 1, 'Late Ferry', 'Late Ferry (master).wav', 252_000, { isrc: 'NO-NJR-26-00001' })],
  price: { kind: 'card', amount: { amountMinor: 300, currency: 'EUR' } },
});
const r01v2: SongPayload = { ...r01v1, title: 'Late Ferry' };

/* ------------------------------------------------------------------ */
/* R2 Tidewater Drums: update in review                                 */
/* ------------------------------------------------------------------ */

const r02v1Samples = [
  ...numberedAudio('One-shots', 'Tidewater Kick', 12, 'one_shot'),
  ...numberedAudio('One-shots', 'Tidewater Snare', 12, 'one_shot'),
  ...numberedAudio('One-shots', 'Tidewater Tom', 8, 'one_shot'),
  ...numberedAudio('One-shots', 'Tidewater Shaker', 8, 'one_shot'),
  ...numberedAudio('Loops', 'Tidewater Loop', 8, 'loop'),
];
const r02v2Samples = [
  ...r02v1Samples,
  ...numberedAudio('One-shots', 'Tidewater Rim', 8, 'one_shot'),
  ...numberedAudio('One-shots', 'Tidewater Clap', 8, 'one_shot'),
];
const R02_RENAMES: Readonly<Record<string, string>> = {
  'Loops/Tidewater Loop 01.wav': 'Loops/Tidewater Groove 92 BPM.wav',
  'Loops/Tidewater Loop 02.wav': 'Loops/Tidewater Groove 96 BPM.wav',
};
const r02v3Samples = [
  ...r02v2Samples.map((f) => (R02_RENAMES[f.path] ? { ...f, path: R02_RENAMES[f.path] } : f)),
  ...numberedAudio('One-shots', 'Tidewater Shaker', 6, 'one_shot', 9),
];
const r02Demo = audioFile('Tidewater Drums demo.wav', 48_000);
const r02Base = {
  title: 'Tidewater Drums',
  description:
    'Drums recorded in a boathouse at low tide: big wooden kicks, tight snares, toms and shakers, with a few loops to start from.',
  tags: ['drums', 'organic', 'tape'],
  genre: 'Downtempo',
  moods: ['warm'],
  demo: r02Demo,
  bpm: '96',
  key: user<KeyValue>(null),
};
const r02v1 = samplePack({ ...r02Base, cover: 'demo-r02-cover-a', samples: r02v1Samples, price: 40 });
const r02v2 = samplePack({ ...r02Base, cover: 'demo-r02-cover-a', samples: r02v2Samples, price: 60 });
const r02v3 = samplePack({ ...r02Base, cover: 'demo-r02-cover-b', samples: r02v3Samples, price: 70 });

/* ------------------------------------------------------------------ */
/* Other payloads                                                      */
/* ------------------------------------------------------------------ */

const r03 = beat({
  title: 'Moth Glow',
  description: 'A hazy downtempo beat: brushed drums, a warm bass and keys that flicker like a porch light.',
  tags: ['downtempo', 'keys', 'night'],
  genre: 'Downtempo',
  moods: ['dreamy'],
  cover: 'demo-r03-cover',
  bpm: '88',
  key: { root: 'D', mode: 'Minor' },
  durationMs: 178_000,
  stems: ['Kick', 'Snare', 'Hats', 'Bass', 'Keys', 'Pad'],
  prices: { wav: 30, stems: 75 },
});

const fogChoir = findProject('fog-choir-pads');
const r04 = presetPack({
  title: 'Fog Choir Pads',
  description: 'Choir-like Serum 2 pads built from my own voice, resampled and layered into slow, wide textures.',
  tags: ['pads', 'choir', 'serum'],
  genre: 'Ambient',
  moods: ['dark', 'dreamy'],
  cover: 'demo-r04-cover-v1',
  synth: 'serum2',
  minSynthVersion: '1.3',
  vitalTier: null,
  presets: fogChoir ? fogChoir.files.filter((f) => f.kind === 'preset') : [],
  categories: ['pad', 'texture'],
  demo: null,
  price: 40,
  bpm: '70',
  key: { root: 'E', mode: 'Minor' },
});

const loopKit = findProject('untitled-loop-kit');
const r05: SamplePackPayload = {
  ...samplePack({
    title: 'Untitled Loop Kit',
    description: loopKit?.description ?? '',
    tags: ['loops', 'downtempo', 'keys'],
    genre: 'Downtempo',
    moods: ['chill'],
    cover: 'demo-r05-cover-v1',
    samples: loopKit ? loopKit.files.filter((f) => f.path.startsWith('Loops/')).slice(0, 14) : [],
    demo: loopKit?.files.find((f) => f.path === loopKit.playerFile) ?? null,
    price: 20,
    bpm: '120',
  }),
  key: { value: { root: 'A', mode: 'Minor' }, source: 'analysis', confidence: 0.64, confirmed: false },
};

const r06 = song({
  title: 'Basement Sessions',
  description: 'Four songs recorded in an apartment-block basement over one winter.',
  tags: ['downtempo', 'electronic', 'lo-fi'],
  genre: 'Electronic',
  moods: ['melancholic'],
  cover: 'demo-r06-cover',
  bpm: '90',
  key: { root: 'F', mode: 'Minor' },
  format: 'ep',
  tracks: [
    track('trk-1', 1, 'Low Ceiling', 'Low Ceiling.wav', 220_000),
    track('trk-2', 2, 'Pipe Organ', 'Pipe Organ.wav', 245_000),
    track('trk-3', 3, 'Laundry Room', 'Laundry Room.wav', 192_000),
    track('trk-4', 4, 'Fuse Box', 'Fuse Box.wav', 260_000),
  ],
});

const r07v1 = beat({
  title: 'Ice Road',
  description: 'A heavy, slow-rolling beat for night drives: detuned 808s, a frozen choir pad and sparse hats.',
  tags: ['dark', '808', 'cinematic'],
  genre: 'Trap',
  moods: ['dark', 'tense'],
  cover: 'demo-r07-cover-v1',
  bpm: '140',
  key: { root: 'G', mode: 'Minor' },
  durationMs: 168_000,
  stems: ['Kick', '808', 'Snare', 'Hats', 'Choir', 'FX'],
  prices: { wav: 30, stems: 75, unlimited: 150 },
});
const r07v2: BeatPayload = { ...r07v1, cover: demoCover('demo-r07-cover-v2') };

const r08 = song({
  title: 'Harbor Lights',
  description: 'A single for the first night of the polar winter, with harbour sounds under a soft synth line.',
  tags: ['downtempo', 'ambient', 'synth'],
  genre: 'Downtempo',
  moods: ['dreamy', 'chill'],
  cover: 'demo-r08-cover',
  bpm: '78',
  key: { root: 'C#', mode: 'Minor' },
  format: 'single',
  releaseDate: '2026-10-24',
  tracks: [track('trk-1', 1, 'Harbor Lights', 'Harbor Lights (master).wav', 238_000)],
});

const r09 = presetPack({
  title: 'Old Synth Memories',
  description: 'Thirty Vital presets that recreate the leads, basses and keys of an old family synth.',
  tags: ['retro', 'leads', 'vital'],
  genre: 'Synthwave',
  moods: ['warm', 'playful'],
  cover: 'demo-r09-cover',
  synth: 'vital',
  minSynthVersion: '1.5',
  vitalTier: 'plus',
  presets: [
    ...presets('Presets/Leads', 'OSM Lead', 10, 'vital'),
    ...presets('Presets/Bass', 'OSM Bass', 10, 'vital'),
    ...presets('Presets/Keys', 'OSM Keys', 10, 'vital'),
  ],
  categories: ['lead', 'bass', 'keys'],
  demo: audioFile('Old Synth Memories demo.wav', 70_000),
  price: 50,
});

const r10 = samplePack({
  title: 'Copper Kit',
  description: 'Forty hits played on copper pots, pipes and a cymbal from a flea market, recorded close and dry.',
  tags: ['percussion', 'metal', 'one-shots'],
  genre: 'Electronic',
  moods: ['bright'],
  cover: 'demo-r10-cover',
  samples: [
    ...numberedAudio('One-shots', 'Copper Snare', 14, 'one_shot'),
    ...numberedAudio('One-shots', 'Copper Pipe', 14, 'one_shot'),
    ...numberedAudio('One-shots', 'Copper Pot', 12, 'one_shot'),
  ],
  demo: audioFile('Copper Kit demo.wav', 40_000),
  price: 40,
});

const r11 = beat({
  title: 'Glass Steps',
  description: 'A bright, bouncing beat with glass percussion and a chopped piano.',
  tags: ['bounce', 'piano', 'glass'],
  genre: 'Hip-hop',
  moods: ['playful'],
  cover: 'demo-r11-cover',
  bpm: '96',
  key: { root: 'F', mode: 'Major' },
  durationMs: 150_000,
  stems: ['Drums', 'Piano', 'Bass', 'Glass'],
  prices: { wav: 30, stems: 75 },
});

const r12 = song({
  title: 'Paper Moons',
  description: 'A short single with a music box melody and a slow, swaying beat.',
  tags: ['downtempo', 'music box'],
  genre: 'Downtempo',
  moods: ['dreamy'],
  cover: 'demo-r12-cover',
  bpm: '72',
  key: { root: 'G', mode: 'Major' },
  format: 'single',
  tracks: [track('trk-1', 1, 'Paper Moons', 'Paper Moons (master).wav', 201_000)],
});

const r13v1Samples = [
  ...numberedAudio('One-shots', 'Kitchen Pan', 12, 'one_shot'),
  ...numberedAudio('One-shots', 'Kitchen Glass', 12, 'one_shot'),
  ...numberedAudio('One-shots', 'Kitchen Drawer', 10, 'one_shot'),
  ...numberedAudio('Loops', 'Kitchen Groove', 10, 'loop'),
];
const r13Base = {
  title: 'Kitchen Percussion',
  description: 'Pans, glasses and drawers recorded in a small kitchen, edited into tight one-shots and grooves.',
  tags: ['percussion', 'foley', 'organic'],
  genre: 'Downtempo',
  moods: ['playful'],
  cover: 'demo-r13-cover',
  demo: audioFile('Kitchen Percussion demo.wav', 44_000),
  key: user<KeyValue>(null),
};
const r13v1 = samplePack({ ...r13Base, samples: r13v1Samples, price: 40 });
const r13v2 = samplePack({
  ...r13Base,
  samples: [...r13v1Samples, ...numberedAudio('One-shots', 'Kitchen Whisk', 6, 'one_shot')],
  price: 30,
});

const r14Tracks = [
  track('trk-1', 1, 'Tide Pool', 'Tide Pool.wav', 210_000),
  track('trk-2', 2, 'Salt Wind', 'Salt Wind.wav', 242_000),
  track('trk-3', 3, 'Coastline', 'Coastline.wav', 225_000),
  track('trk-4', 4, 'Breakwater', 'Breakwater.wav', 200_000),
  track('trk-5', 5, 'Lighthouse', 'Lighthouse.wav', 255_000),
];
const r14v1 = song({
  title: 'Coastline',
  description: 'Five songs written on walks along the coast, from the first warm day to the last light of summer.',
  tags: ['downtempo', 'electronic', 'coast'],
  genre: 'Electronic',
  moods: ['uplifting', 'warm'],
  cover: 'demo-r14-cover',
  bpm: '100',
  key: { root: 'D', mode: 'Major' },
  format: 'ep',
  territories: ['NO', 'SE'],
  tracks: r14Tracks,
});
const r14v2: SongPayload = {
  ...r14v1,
  tracks: r14Tracks.map((t) => (t.id === 'trk-3' ? { ...t, audio: audioFile('Coastline.wav', 231_000, 'b') } : t)),
};

const r15v1 = beat({
  title: 'Night Bus',
  description: 'A late-night beat with a rattling bus-stop rhythm and a long, warm bassline.',
  tags: ['night', 'bass', 'downtempo'],
  genre: 'Downtempo',
  moods: ['chill'],
  cover: 'demo-r15-cover',
  bpm: '92',
  key: { root: 'B', mode: 'Minor' },
  durationMs: 172_000,
  stems: ['Drums', 'Bass', 'Keys', 'Vox chops', 'FX'],
  prices: { wav: 30, stems: 75, unlimited: 150, exclusive: 600 },
});
const r15v2: BeatPayload = {
  ...r15v1,
  tiers: r15v1.tiers.map((t) => (t.tier === 'wav' ? { ...t, price: { amountMinor: 3500, currency: 'EUR' } } : t)),
};

const r16 = samplePack({
  title: 'Vocal Chops',
  description: 'Thirty short vocal chops, pitched and filtered, ready to drop into a hook.',
  tags: ['vocals', 'chops', 'hooks'],
  genre: 'Electronic',
  moods: ['bright'],
  cover: 'demo-r16-cover',
  samples: numberedAudio('Chops', 'Vocal Chop', 30, 'one_shot'),
  demo: audioFile('Vocal Chops demo.wav', 36_000),
  price: 30,
});

/* ------------------------------------------------------------------ */
/* Statements                                                          */
/* ------------------------------------------------------------------ */

const R06_STATEMENT = statement(
  'not_published',
  [
    reasonItem(
      'uncleared_samples',
      'Track 2, "Pipe Organ", uses a vocal phrase from a commercial record that isn\'t listed as licensed material.',
    ),
  ],
  'The vocal phrase at 1:12 in "Pipe Organ" matches a released recording, and no licence for it is listed.',
  terms('Cadencea Content Policy: licensed material'),
  false,
  '2026-10-03T12:00:00Z',
);

const R10_STATEMENT = statement(
  'suspended',
  [reasonItem('copyright_claim', 'A rights holder says three of the snare samples come from their sample library.')],
  'We received a copyright notice about Copper Snare 03, 07 and 12. We are checking it with you and the claimant.',
  { kind: 'law', reference: fill(SOR_COPY.groundExamples.copyright, { claimant: 'Brassline Samples' }) },
  false,
  '2026-10-05T09:30:00Z',
);

const R11_HOLD = statement(
  'suspended',
  [reasonItem('duplicate_content', 'The main mix matches another release on Cadencea. We are comparing them.')],
  'An automated check matched the main mix of "Glass Steps" with another release.',
  terms('Cadencea Content Policy: original content'),
  true,
  '2026-09-14T08:00:00Z',
);

const R11_REMOVAL = statement(
  'removed',
  [reasonItem('duplicate_content', 'The main mix is the same file as a beat another seller published in March 2026.')],
  'An automated check matched the main mix byte for byte with another release on Cadencea. A reviewer compared both and confirmed the match.',
  terms('Cadencea Content Policy: original content'),
  true,
  '2026-09-20T10:00:00Z',
);

const R14_STATEMENT = statement(
  'update_not_published',
  [
    reasonItem(
      'new_recording_needs_new_release',
      'Track 3, "Coastline", has a new arrangement and a new vocal, so it\'s a different recording.',
    ),
  ],
  'The new file for "Coastline" adds a vocal and a new bridge. That is a new recording, not a technical fix of the old one.',
  terms('Cadencea Content Policy: same-recording updates'),
  false,
  '2026-09-19T11:00:00Z',
);

const R16_STATEMENT = statement(
  'not_published',
  [reasonItem('human_made_violation', 'Several chops have the sound of a generated voice, which the Human-Made Standard doesn\'t allow.')],
  'Most chops carry artefacts typical of a generated voice, and the project has no vocal recordings they could come from.',
  terms(SOR_COPY.groundExamples.humanMade),
  true,
  '2026-09-10T15:00:00Z',
);

const R16_UPHELD = statement(
  'not_published',
  [reasonItem('human_made_violation', 'A second reviewer listened again and compared the chops with your project files.')],
  'The project has no vocal takes, and the chops match the output of a public voice model.',
  terms(SOR_COPY.groundExamples.humanMade),
  false,
  '2026-10-01T10:00:00Z',
  '2026-09-10T15:00:00Z',
);

const ALL_CLEAR: AutoCheck[] = [
  { id: 'files_match_manifest', result: 'pass', sellerVisible: true },
  { id: 'formats', result: 'pass', sellerVisible: true },
  { id: 'minimum_count', result: 'pass', sellerVisible: true },
  { id: 'cover_art', result: 'pass', sellerVisible: true },
  { id: 'preview', result: 'pass', sellerVisible: true },
  { id: 'metadata_complete', result: 'pass', sellerVisible: true },
  { id: 'duplicate_sha256', result: 'pass', sellerVisible: false },
];

const approved = (at: IsoDateTime): ReviewDecision => ({ outcome: 'approved', at });

/* ------------------------------------------------------------------ */
/* The seed table (RL §7.4)                                            */
/* ------------------------------------------------------------------ */

const ableton = (name: string) => plainFile(`${name}.als`, 'daw', 320_000);
const flStudio = (name: string) => plainFile(`${name}.flp`, 'daw', 1_100_000);

function ev(type: ReviewEventType, at: IsoDateTime, actor: Actor, extra: Omit<EventSpec, 'type' | 'at' | 'actor'> = {}): EventSpec {
  return { type, at, actor, ...extra };
}

const SEEDS: readonly SeedSpec[] = [
  {
    n: 1,
    type: 'song',
    slug: 'late-ferry',
    release: { status: 'live', createdAt: '2026-07-18T19:00:00Z', firstLiveAt: '2026-07-22T14:00:00Z', demoStats: { sales: 12, ownersByVersion: { 1: 7, 2: 5 }, playsThisMonth: 1840 } },
    current: 2,
    project: 'Late Ferry',
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r01v1, createdAt: '2026-07-18T19:00:00Z',
        submittedAt: '2026-07-20T10:00:00Z', decidedAt: '2026-07-22T14:00:00Z', supersededAt: '2026-08-04T15:00:00Z',
        evidence: seedEvidence({ project: 'Late Ferry', daw: 'ableton', dawFile: ableton('Late Ferry'), deliverables: [r01v1.tracks[0].audio], stems: 18, createdAt: '2026-05-02T20:00:00Z', updatedAt: '2026-07-17T22:00:00Z', capturedAt: '2026-07-20T10:00:00Z' }),
      },
      {
        seq: 2, status: 'approved', version: 2, payload: r01v2, createdAt: '2026-08-03T09:00:00Z',
        submittedAt: '2026-08-03T09:30:00Z', decidedAt: '2026-08-04T15:00:00Z', changeNote: 'Fixed a typo in the title.',
        evidence: seedEvidence({ project: 'Late Ferry', daw: 'ableton', dawFile: ableton('Late Ferry'), deliverables: [r01v2.tracks[0].audio], stems: 18, createdAt: '2026-05-02T20:00:00Z', updatedAt: '2026-07-17T22:00:00Z', capturedAt: '2026-08-03T09:30:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r01-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-07-20T10:00:00Z', decision: approved('2026-07-22T14:00:00Z'), decidedBy: REVIEWER_1 },
      { id: 'case-r01-2', revisionSeq: 2, kind: 'update', depth: 'light', status: 'decided', openedAt: '2026-08-03T09:30:00Z', decision: approved('2026-08-04T15:00:00Z'), decidedBy: REVIEWER_2 },
    ],
    events: [
      ev('release_created', '2026-07-18T19:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-07-20T10:00:00Z', SELLER, { seq: 1, caseId: 'case-r01-1' }),
      ev('review_started', '2026-07-21T09:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r01-1' }),
      ev('went_live', '2026-07-22T14:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
      ev('update_started', '2026-08-03T09:00:00Z', SELLER, { seq: 2 }),
      ev('submitted', '2026-08-03T09:30:00Z', SELLER, { seq: 2, caseId: 'case-r01-2' }),
      ev('review_started', '2026-08-04T10:00:00Z', reviewer(REVIEWER_2), { seq: 2, caseId: 'case-r01-2' }),
      ev('update_went_live', '2026-08-04T15:00:00Z', reviewer(REVIEWER_2), { seq: 2, version: 2 }),
    ],
  },
  {
    n: 2,
    type: 'sample_pack',
    slug: 'tidewater-drums',
    release: { status: 'live', createdAt: '2026-06-10T18:00:00Z', firstLiveAt: '2026-06-15T13:00:00Z', demoStats: { sales: 34, ownersByVersion: { 1: 21, 2: 13 } } },
    current: 2,
    open: 3,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r02v1, createdAt: '2026-06-10T18:00:00Z',
        submittedAt: '2026-06-11T09:00:00Z', decidedAt: '2026-06-15T13:00:00Z', supersededAt: '2026-07-30T12:00:00Z',
        evidence: seedEvidence({ project: 'Tidewater Drums', daw: 'ableton', dawFile: ableton('Tidewater Drums'), deliverables: r02v1Samples, stems: 0, createdAt: '2026-05-20T17:00:00Z', updatedAt: '2026-06-09T21:00:00Z', capturedAt: '2026-06-11T09:00:00Z' }),
      },
      {
        seq: 2, status: 'approved', version: 2, payload: r02v2, createdAt: '2026-07-27T17:00:00Z',
        submittedAt: '2026-07-28T08:30:00Z', decidedAt: '2026-07-30T12:00:00Z', changeNote: 'Added 16 rim and clap one-shots.',
        evidence: seedEvidence({ project: 'Tidewater Drums', daw: 'ableton', dawFile: ableton('Tidewater Drums'), deliverables: r02v2Samples, stems: 0, createdAt: '2026-05-20T17:00:00Z', updatedAt: '2026-07-27T16:00:00Z', capturedAt: '2026-07-28T08:30:00Z' }),
      },
      {
        seq: 3, status: 'in_review', payload: r02v3, createdAt: '2026-10-06T19:00:00Z', updatedAt: '2026-10-08T09:00:00Z',
        submittedAt: '2026-10-08T09:15:00Z',
        changeNote: 'New cover, 6 new shaker one-shots, two loops renamed with their tempo, and a new price.',
        evidence: seedEvidence({ project: 'Tidewater Drums', daw: 'ableton', dawFile: ableton('Tidewater Drums'), deliverables: r02v3Samples, stems: 0, createdAt: '2026-05-20T17:00:00Z', updatedAt: '2026-10-06T18:30:00Z', capturedAt: '2026-10-08T09:15:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r02-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-06-11T09:00:00Z', decision: approved('2026-06-15T13:00:00Z'), decidedBy: REVIEWER_1 },
      { id: 'case-r02-2', revisionSeq: 2, kind: 'update', depth: 'standard', status: 'decided', openedAt: '2026-07-28T08:30:00Z', decision: approved('2026-07-30T12:00:00Z'), decidedBy: REVIEWER_1 },
      { id: 'case-r02-3', revisionSeq: 3, kind: 'update', depth: 'standard', status: 'queued', openedAt: '2026-10-08T09:15:00Z' },
    ],
    events: [
      ev('release_created', '2026-06-10T18:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-06-11T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r02-1' }),
      ev('review_started', '2026-06-14T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r02-1' }),
      ev('went_live', '2026-06-15T13:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
      ev('update_started', '2026-07-27T17:00:00Z', SELLER, { seq: 2 }),
      ev('submitted', '2026-07-28T08:30:00Z', SELLER, { seq: 2, caseId: 'case-r02-2' }),
      ev('review_started', '2026-07-29T11:00:00Z', reviewer(REVIEWER_1), { seq: 2, caseId: 'case-r02-2' }),
      ev('update_went_live', '2026-07-30T12:00:00Z', reviewer(REVIEWER_1), { seq: 2, version: 2 }),
      ev('update_started', '2026-10-06T19:00:00Z', SELLER, { seq: 3 }),
      ev('submitted', '2026-10-08T09:15:00Z', SELLER, { seq: 3, caseId: 'case-r02-3' }),
    ],
  },
  {
    n: 3,
    type: 'beat',
    slug: 'moth-glow',
    release: { status: 'in_review', createdAt: '2026-10-05T20:00:00Z' },
    open: 1,
    revisions: [
      {
        seq: 1, status: 'in_review', payload: r03, createdAt: '2026-10-05T20:00:00Z', updatedAt: '2026-10-08T11:00:00Z',
        submittedAt: '2026-10-08T11:20:00Z',
        evidence: seedEvidence({ project: 'Moth Glow', daw: 'fl_studio', dawFile: flStudio('Moth Glow'), deliverables: [r03.mainMix, ...r03.stems], stems: 6, createdAt: '2026-09-21T21:00:00Z', updatedAt: '2026-10-05T19:30:00Z', capturedAt: '2026-10-08T11:20:00Z' }),
      },
    ],
    cases: [{ id: 'case-r03-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'queued', openedAt: '2026-10-08T11:20:00Z' }],
    events: [
      ev('release_created', '2026-10-05T20:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-10-08T11:20:00Z', SELLER, { seq: 1, caseId: 'case-r03-1' }),
    ],
  },
  {
    n: 4,
    type: 'preset_pack',
    slug: 'fog-choir-pads',
    release: { status: 'changes_requested', createdAt: '2026-09-20T18:00:00Z' },
    open: 1,
    project: 'Fog Choir Pads',
    revisions: [
      {
        seq: 1, status: 'changes_requested', payload: r04, createdAt: '2026-09-20T18:00:00Z', updatedAt: '2026-09-24T19:00:00Z',
        submittedAt: '2026-09-24T19:10:00Z', decidedAt: '2026-09-26T14:00:00Z',
        ...(fogChoir ? { evidence: buildEvidence(fogChoir, '2026-09-24T19:10:00Z', null) } : {}),
      },
    ],
    cases: [
      {
        id: 'case-r04-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-09-24T19:10:00Z', decidedBy: REVIEWER_1,
        decision: {
          outcome: 'changes_requested',
          at: '2026-09-26T14:00:00Z',
          reasons: [
            reasonItem('demo_missing', "The pack has no audio demo, so buyers can't hear the presets before they buy."),
            reasonItem('synth_version_mismatch', 'These presets use Serum 2 features, but the listing says Serum 1.3 or later. Set the minimum to 2.0.'),
          ],
        },
      },
    ],
    events: [
      ev('release_created', '2026-09-20T18:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-09-24T19:10:00Z', SELLER, { seq: 1, caseId: 'case-r04-1' }),
      ev('review_started', '2026-09-25T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r04-1' }),
      ev('changes_requested', '2026-09-26T14:00:00Z', reviewer(REVIEWER_1), {
        seq: 1,
        caseId: 'case-r04-1',
        reasons: [
          reasonItem('demo_missing', "The pack has no audio demo, so buyers can't hear the presets before they buy."),
          reasonItem('synth_version_mismatch', 'These presets use Serum 2 features, but the listing says Serum 1.3 or later. Set the minimum to 2.0.'),
        ],
      }),
    ],
  },
  {
    n: 5,
    type: 'sample_pack',
    slug: 'untitled-loop-kit',
    release: { status: 'draft', createdAt: '2026-10-09T09:30:00Z' },
    open: 1,
    project: 'Untitled Loop Kit',
    revisions: [{ seq: 1, status: 'draft', payload: r05, createdAt: '2026-10-09T09:30:00Z', updatedAt: '2026-10-09T10:10:00Z' }],
    cases: [],
    events: [
      ev('release_created', '2026-10-09T09:30:00Z', SELLER, { seq: 1 }),
      ev('draft_saved', '2026-10-09T10:10:00Z', SELLER, { seq: 1 }),
    ],
  },
  {
    n: 6,
    type: 'song',
    slug: 'basement-sessions',
    release: { status: 'rejected', createdAt: '2026-09-22T20:00:00Z' },
    revisions: [
      {
        seq: 1, status: 'rejected', payload: r06, createdAt: '2026-09-22T20:00:00Z', submittedAt: '2026-09-25T18:00:00Z', decidedAt: '2026-10-03T12:00:00Z',
        evidence: seedEvidence({ project: 'Basement Sessions', daw: 'ableton', dawFile: ableton('Basement Sessions'), deliverables: r06.tracks.map((t) => t.audio), stems: 26, createdAt: '2026-01-14T19:00:00Z', updatedAt: '2026-09-21T23:00:00Z', capturedAt: '2026-09-25T18:00:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r06-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-09-25T18:00:00Z', decision: { outcome: 'rejected', at: '2026-10-03T12:00:00Z', statement: R06_STATEMENT }, decidedBy: REVIEWER_1 },
    ],
    events: [
      ev('release_created', '2026-09-22T20:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-09-25T18:00:00Z', SELLER, { seq: 1, caseId: 'case-r06-1' }),
      ev('review_started', '2026-09-28T09:30:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r06-1' }),
      ev('rejected', '2026-10-03T12:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r06-1', statement: R06_STATEMENT }),
    ],
  },
  {
    n: 7,
    type: 'beat',
    slug: 'ice-road',
    release: { status: 'live', createdAt: '2026-08-14T21:00:00Z', firstLiveAt: '2026-08-20T12:00:00Z', demoStats: { sales: 9, ownersByVersion: { 1: 9 } } },
    current: 1,
    open: 2,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r07v1, createdAt: '2026-08-14T21:00:00Z', submittedAt: '2026-08-16T10:00:00Z', decidedAt: '2026-08-20T12:00:00Z',
        evidence: seedEvidence({ project: 'Ice Road', daw: 'fl_studio', dawFile: flStudio('Ice Road'), deliverables: [r07v1.mainMix, ...r07v1.stems], stems: 6, createdAt: '2026-07-30T22:00:00Z', updatedAt: '2026-08-14T20:30:00Z', capturedAt: '2026-08-16T10:00:00Z' }),
      },
      {
        seq: 2, status: 'changes_requested', payload: r07v2, createdAt: '2026-09-30T20:00:00Z', updatedAt: '2026-10-01T08:00:00Z',
        submittedAt: '2026-10-01T08:10:00Z', decidedAt: '2026-10-02T13:00:00Z', changeNote: 'New cover for the winter season.',
        evidence: seedEvidence({ project: 'Ice Road', daw: 'fl_studio', dawFile: flStudio('Ice Road'), deliverables: [r07v2.mainMix, ...r07v2.stems], stems: 6, createdAt: '2026-07-30T22:00:00Z', updatedAt: '2026-09-30T19:30:00Z', capturedAt: '2026-10-01T08:10:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r07-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-08-16T10:00:00Z', decision: approved('2026-08-20T12:00:00Z'), decidedBy: REVIEWER_2 },
      {
        id: 'case-r07-2', revisionSeq: 2, kind: 'update', depth: 'light', status: 'decided', openedAt: '2026-10-01T08:10:00Z', decidedBy: REVIEWER_2,
        decision: { outcome: 'changes_requested', at: '2026-10-02T13:00:00Z', reasons: [reasonItem('cover_art_rights', "The new cover shows a car maker's logo on the truck grille.")] },
      },
    ],
    events: [
      ev('release_created', '2026-08-14T21:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-08-16T10:00:00Z', SELLER, { seq: 1, caseId: 'case-r07-1' }),
      ev('review_started', '2026-08-19T09:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r07-1' }),
      ev('went_live', '2026-08-20T12:00:00Z', reviewer(REVIEWER_2), { seq: 1, version: 1 }),
      ev('update_started', '2026-09-30T20:00:00Z', SELLER, { seq: 2 }),
      ev('submitted', '2026-10-01T08:10:00Z', SELLER, { seq: 2, caseId: 'case-r07-2' }),
      ev('review_started', '2026-10-02T09:00:00Z', reviewer(REVIEWER_2), { seq: 2, caseId: 'case-r07-2' }),
      ev('changes_requested', '2026-10-02T13:00:00Z', reviewer(REVIEWER_2), {
        seq: 2,
        caseId: 'case-r07-2',
        reasons: [reasonItem('cover_art_rights', "The new cover shows a car maker's logo on the truck grille.")],
      }),
    ],
  },
  {
    n: 8,
    type: 'song',
    slug: 'harbor-lights',
    release: { status: 'live', createdAt: '2026-09-28T18:00:00Z', firstLiveAt: '2026-10-06T15:00:00Z', goesPublicAt: '2026-10-24T00:00:00Z' },
    current: 1,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r08, createdAt: '2026-09-28T18:00:00Z', submittedAt: '2026-09-30T09:00:00Z', decidedAt: '2026-10-06T15:00:00Z',
        evidence: seedEvidence({ project: 'Harbor Lights', daw: 'ableton', dawFile: ableton('Harbor Lights'), deliverables: [r08.tracks[0].audio], stems: 12, createdAt: '2026-08-11T19:00:00Z', updatedAt: '2026-09-27T22:00:00Z', capturedAt: '2026-09-30T09:00:00Z' }),
      },
    ],
    cases: [{ id: 'case-r08-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-09-30T09:00:00Z', decision: approved('2026-10-06T15:00:00Z'), decidedBy: REVIEWER_1 }],
    events: [
      ev('release_created', '2026-09-28T18:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-09-30T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r08-1' }),
      ev('review_started', '2026-10-05T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r08-1' }),
      ev('scheduled', '2026-10-06T15:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
    ],
  },
  {
    n: 9,
    type: 'preset_pack',
    slug: 'old-synth-memories',
    release: { status: 'unpublished', createdAt: '2026-06-20T17:00:00Z', firstLiveAt: '2026-06-25T11:00:00Z', unpublished: { by: 'seller', cause: null, at: '2026-09-02T19:00:00Z', caseId: null }, demoStats: { sales: 18, ownersByVersion: { 1: 18 } } },
    current: 1,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r09, createdAt: '2026-06-20T17:00:00Z', submittedAt: '2026-06-21T10:00:00Z', decidedAt: '2026-06-25T11:00:00Z',
        evidence: seedEvidence({ project: 'Old Synth Memories', daw: 'ableton', dawFile: ableton('Old Synth Memories'), deliverables: [...r09.presets, ...(r09.demo ? [r09.demo] : [])], stems: 0, createdAt: '2026-04-02T18:00:00Z', updatedAt: '2026-06-19T21:00:00Z', capturedAt: '2026-06-21T10:00:00Z' }),
      },
    ],
    cases: [{ id: 'case-r09-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-06-21T10:00:00Z', decision: approved('2026-06-25T11:00:00Z'), decidedBy: REVIEWER_2 }],
    events: [
      ev('release_created', '2026-06-20T17:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-06-21T10:00:00Z', SELLER, { seq: 1, caseId: 'case-r09-1' }),
      ev('review_started', '2026-06-24T09:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r09-1' }),
      ev('went_live', '2026-06-25T11:00:00Z', reviewer(REVIEWER_2), { seq: 1, version: 1 }),
      ev('unpublished', '2026-09-02T19:00:00Z', SELLER, { version: 1 }),
    ],
  },
  {
    n: 10,
    type: 'sample_pack',
    slug: 'copper-kit',
    release: { status: 'suspended', createdAt: '2026-07-01T16:00:00Z', firstLiveAt: '2026-07-08T12:00:00Z', suspension: { at: '2026-10-05T09:30:00Z', caseId: 'case-r10-2', restoreTo: 'live', downloadsDisabled: false }, demoStats: { sales: 22, ownersByVersion: { 1: 22 } } },
    current: 1,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r10, createdAt: '2026-07-01T16:00:00Z', submittedAt: '2026-07-03T09:00:00Z', decidedAt: '2026-07-08T12:00:00Z',
        evidence: seedEvidence({ project: 'Copper Kit', daw: 'ableton', dawFile: ableton('Copper Kit'), deliverables: r10.samples, stems: 0, createdAt: '2026-06-12T18:00:00Z', updatedAt: '2026-06-30T20:00:00Z', capturedAt: '2026-07-03T09:00:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r10-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-07-03T09:00:00Z', decision: approved('2026-07-08T12:00:00Z'), decidedBy: REVIEWER_1 },
      { id: 'case-r10-2', revisionSeq: null, kind: 'report', depth: 'standard', status: 'decided', openedAt: '2026-10-04T16:00:00Z', decision: { outcome: 'suspended', at: '2026-10-05T09:30:00Z', statement: R10_STATEMENT }, decidedBy: REVIEWER_1 },
    ],
    events: [
      ev('release_created', '2026-07-01T16:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-07-03T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r10-1' }),
      ev('review_started', '2026-07-07T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r10-1' }),
      ev('went_live', '2026-07-08T12:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
      ev('suspended', '2026-10-05T09:30:00Z', reviewer(REVIEWER_1), { caseId: 'case-r10-2', statement: R10_STATEMENT }),
    ],
  },
  {
    n: 11,
    type: 'beat',
    slug: 'glass-steps',
    release: { status: 'unpublished', createdAt: '2026-07-25T20:00:00Z', firstLiveAt: '2026-07-30T13:00:00Z', unpublished: { by: 'platform', cause: null, at: '2026-09-20T10:00:00Z', caseId: 'case-r11-3' }, demoStats: { sales: 4, ownersByVersion: { 1: 4 } } },
    current: 1,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r11, createdAt: '2026-07-25T20:00:00Z', submittedAt: '2026-07-26T09:00:00Z', decidedAt: '2026-07-30T13:00:00Z',
        evidence: seedEvidence({ project: 'Glass Steps', daw: 'fl_studio', dawFile: flStudio('Glass Steps'), deliverables: [r11.mainMix, ...r11.stems], stems: 4, createdAt: '2026-07-10T19:00:00Z', updatedAt: '2026-07-25T19:30:00Z', capturedAt: '2026-07-26T09:00:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r11-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-07-26T09:00:00Z', decision: approved('2026-07-30T13:00:00Z'), decidedBy: REVIEWER_2 },
      { id: 'case-r11-2', revisionSeq: null, kind: 'audit', depth: 'standard', status: 'decided', openedAt: '2026-09-14T07:30:00Z', decision: { outcome: 'suspended', at: '2026-09-14T08:00:00Z', statement: R11_HOLD }, decidedBy: REVIEWER_1, priority: 10 },
      { id: 'case-r11-3', revisionSeq: null, kind: 'audit', depth: 'standard', status: 'decided', openedAt: '2026-09-14T08:00:00Z', decision: { outcome: 'removed', at: '2026-09-20T10:00:00Z', statement: R11_REMOVAL }, decidedBy: REVIEWER_1, priority: 10 },
    ],
    events: [
      ev('release_created', '2026-07-25T20:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-07-26T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r11-1' }),
      ev('review_started', '2026-07-29T10:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r11-1' }),
      ev('went_live', '2026-07-30T13:00:00Z', reviewer(REVIEWER_2), { seq: 1, version: 1 }),
      ev('suspended', '2026-09-14T08:00:00Z', reviewer(REVIEWER_1), { caseId: 'case-r11-2', statement: R11_HOLD }),
      ev('removed', '2026-09-20T10:00:00Z', reviewer(REVIEWER_1), { caseId: 'case-r11-3', statement: R11_REMOVAL }),
    ],
  },
  {
    n: 12,
    type: 'song',
    slug: 'paper-moons',
    release: { status: 'in_review', createdAt: '2026-10-03T19:00:00Z' },
    open: 1,
    revisions: [
      {
        seq: 1, status: 'in_review', payload: r12, createdAt: '2026-10-03T19:00:00Z', submittedAt: '2026-10-06T10:00:00Z',
        evidence: seedEvidence({ project: 'Paper Moons', daw: 'logic', dawFile: plainFile('Paper Moons.logicx', 'daw', 36_000_000), deliverables: [r12.tracks[0].audio], stems: 9, createdAt: '2026-09-12T18:00:00Z', updatedAt: '2026-10-03T18:30:00Z', capturedAt: '2026-10-06T10:00:00Z' }),
      },
    ],
    cases: [
      {
        id: 'case-r12-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'in_progress', openedAt: '2026-10-06T10:00:00Z', assignedReviewerId: REVIEWER_2, priority: 20,
        checks: [...ALL_CLEAR, { id: 'human_made_triage', result: 'flag', sellerVisible: false, detail: 'Closer listen suggested.' }],
      },
    ],
    events: [
      ev('release_created', '2026-10-03T19:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-10-06T10:00:00Z', SELLER, { seq: 1, caseId: 'case-r12-1' }),
      ev('auto_checks_completed', '2026-10-06T10:05:00Z', { kind: 'system', process: 'auto_checks' }, { seq: 1, caseId: 'case-r12-1' }),
      ev('review_started', '2026-10-08T13:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r12-1' }),
    ],
  },
  {
    n: 13,
    type: 'sample_pack',
    slug: 'kitchen-percussion',
    release: { status: 'live', createdAt: '2026-08-06T18:00:00Z', firstLiveAt: '2026-08-12T10:00:00Z', demoStats: { sales: 27, ownersByVersion: { 1: 27 } } },
    current: 1,
    open: 2,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r13v1, createdAt: '2026-08-06T18:00:00Z', submittedAt: '2026-08-08T09:00:00Z', decidedAt: '2026-08-12T10:00:00Z',
        evidence: seedEvidence({ project: 'Kitchen Percussion', daw: 'ableton', dawFile: ableton('Kitchen Percussion'), deliverables: r13v1Samples, stems: 0, createdAt: '2026-07-19T17:00:00Z', updatedAt: '2026-08-06T17:30:00Z', capturedAt: '2026-08-08T09:00:00Z' }),
      },
      { seq: 2, status: 'draft', payload: r13v2, createdAt: '2026-10-07T18:00:00Z', updatedAt: '2026-10-07T18:20:00Z', changeNote: 'Added 6 one-shots and lowered the price.' },
    ],
    cases: [{ id: 'case-r13-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-08-08T09:00:00Z', decision: approved('2026-08-12T10:00:00Z'), decidedBy: REVIEWER_1 }],
    events: [
      ev('release_created', '2026-08-06T18:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-08-08T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r13-1' }),
      ev('review_started', '2026-08-11T09:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r13-1' }),
      ev('went_live', '2026-08-12T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
      ev('update_started', '2026-10-07T18:00:00Z', SELLER, { seq: 2 }),
      ev('draft_saved', '2026-10-07T18:20:00Z', SELLER, { seq: 2 }),
    ],
  },
  {
    n: 14,
    type: 'song',
    slug: 'coastline',
    release: { status: 'live', createdAt: '2026-08-18T19:00:00Z', firstLiveAt: '2026-08-26T12:00:00Z', demoStats: { sales: 3, ownersByVersion: { 1: 3 }, playsThisMonth: 960 } },
    current: 1,
    open: 2,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r14v1, createdAt: '2026-08-18T19:00:00Z', submittedAt: '2026-08-20T09:00:00Z', decidedAt: '2026-08-26T12:00:00Z',
        evidence: seedEvidence({ project: 'Coastline', daw: 'ableton', dawFile: ableton('Coastline'), deliverables: r14v1.tracks.map((t) => t.audio), stems: 31, createdAt: '2026-03-03T18:00:00Z', updatedAt: '2026-08-17T22:00:00Z', capturedAt: '2026-08-20T09:00:00Z' }),
      },
      {
        seq: 2, status: 'rejected', payload: r14v2, createdAt: '2026-09-15T18:00:00Z', updatedAt: '2026-09-16T08:00:00Z',
        submittedAt: '2026-09-16T08:20:00Z', decidedAt: '2026-09-19T11:00:00Z',
        changeNote: 'Replaced the master of "Coastline" after fixing clipping in the chorus.',
        evidence: seedEvidence({ project: 'Coastline', daw: 'ableton', dawFile: ableton('Coastline'), deliverables: r14v2.tracks.map((t) => t.audio), stems: 33, createdAt: '2026-03-03T18:00:00Z', updatedAt: '2026-09-15T17:30:00Z', capturedAt: '2026-09-16T08:20:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r14-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-08-20T09:00:00Z', decision: approved('2026-08-26T12:00:00Z'), decidedBy: REVIEWER_1 },
      { id: 'case-r14-2', revisionSeq: 2, kind: 'update', depth: 'strict', status: 'decided', openedAt: '2026-09-16T08:20:00Z', decision: { outcome: 'rejected', at: '2026-09-19T11:00:00Z', statement: R14_STATEMENT }, decidedBy: REVIEWER_1 },
      { id: 'case-r14-3', revisionSeq: 2, kind: 'appeal', depth: 'strict', status: 'queued', openedAt: '2026-09-22T17:00:00Z', appealOfCaseId: 'case-r14-2' },
    ],
    appeals: [
      {
        id: 'appeal-r14', target: 'rejection', appealedCaseId: 'case-r14-2', appealCaseId: 'case-r14-3',
        message: 'The new file is the same recording, remastered after a clipping issue on the first master. The vocal was always there, just buried.',
        status: 'open', filedAt: '2026-09-22T17:00:00Z', decidedAt: null,
      },
    ],
    events: [
      ev('release_created', '2026-08-18T19:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-08-20T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r14-1' }),
      ev('review_started', '2026-08-25T09:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r14-1' }),
      ev('went_live', '2026-08-26T12:00:00Z', reviewer(REVIEWER_1), { seq: 1, version: 1 }),
      ev('update_started', '2026-09-15T18:00:00Z', SELLER, { seq: 2 }),
      ev('submitted', '2026-09-16T08:20:00Z', SELLER, { seq: 2, caseId: 'case-r14-2' }),
      ev('review_started', '2026-09-17T10:00:00Z', reviewer(REVIEWER_1), { seq: 2, caseId: 'case-r14-2' }),
      ev('rejected', '2026-09-19T11:00:00Z', reviewer(REVIEWER_1), { seq: 2, caseId: 'case-r14-2', statement: R14_STATEMENT }),
      ev('appeal_filed', '2026-09-22T17:00:00Z', SELLER, {
        seq: 2,
        caseId: 'case-r14-3',
        appealId: 'appeal-r14',
        note: 'The new file is the same recording, remastered after a clipping issue on the first master. The vocal was always there, just buried.',
      }),
    ],
  },
  {
    n: 15,
    type: 'beat',
    slug: 'night-bus',
    release: { status: 'unpublished', createdAt: '2026-07-08T20:00:00Z', firstLiveAt: '2026-07-12T12:00:00Z', unpublished: { by: 'system', cause: 'exclusive_sold', at: '2026-09-19T21:00:00Z', caseId: null }, demoStats: { sales: 15, ownersByVersion: { 1: 15 } } },
    current: 1,
    revisions: [
      {
        seq: 1, status: 'approved', version: 1, payload: r15v1, createdAt: '2026-07-08T20:00:00Z', submittedAt: '2026-07-09T09:00:00Z', decidedAt: '2026-07-12T12:00:00Z',
        evidence: seedEvidence({ project: 'Night Bus', daw: 'fl_studio', dawFile: flStudio('Night Bus'), deliverables: [r15v1.mainMix, ...r15v1.stems], stems: 5, createdAt: '2026-06-20T22:00:00Z', updatedAt: '2026-07-08T19:30:00Z', capturedAt: '2026-07-09T09:00:00Z' }),
      },
      { seq: 2, status: 'withdrawn', payload: r15v2, createdAt: '2026-09-01T18:00:00Z', updatedAt: '2026-09-01T18:10:00Z', changeNote: 'Raised the WAV lease price.' },
    ],
    cases: [{ id: 'case-r15-1', revisionSeq: 1, kind: 'new_release', depth: 'strict', status: 'decided', openedAt: '2026-07-09T09:00:00Z', decision: approved('2026-07-12T12:00:00Z'), decidedBy: REVIEWER_2 }],
    events: [
      ev('release_created', '2026-07-08T20:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-07-09T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r15-1' }),
      ev('review_started', '2026-07-11T10:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r15-1' }),
      ev('went_live', '2026-07-12T12:00:00Z', reviewer(REVIEWER_2), { seq: 1, version: 1 }),
      ev('update_started', '2026-09-01T18:00:00Z', SELLER, { seq: 2 }),
      ev('update_discarded', '2026-09-03T08:00:00Z', SELLER, { seq: 2 }),
      ev('exclusive_sold', '2026-09-19T21:00:00Z', { kind: 'system', process: 'exclusive_sale' }, { version: 1 }),
    ],
  },
  {
    n: 16,
    type: 'sample_pack',
    slug: 'vocal-chops',
    release: { status: 'rejected', createdAt: '2026-09-02T18:00:00Z' },
    revisions: [
      {
        seq: 1, status: 'rejected', payload: r16, createdAt: '2026-09-02T18:00:00Z', submittedAt: '2026-09-04T09:00:00Z', decidedAt: '2026-09-10T15:00:00Z',
        evidence: seedEvidence({ project: 'Vocal Chops', daw: 'ableton', dawFile: ableton('Vocal Chops'), deliverables: r16.samples, stems: 0, createdAt: '2026-08-25T18:00:00Z', updatedAt: '2026-09-01T20:00:00Z', capturedAt: '2026-09-04T09:00:00Z' }),
      },
    ],
    cases: [
      { id: 'case-r16-1', revisionSeq: 1, kind: 'new_release', depth: 'standard', status: 'decided', openedAt: '2026-09-04T09:00:00Z', decision: { outcome: 'rejected', at: '2026-09-10T15:00:00Z', statement: R16_STATEMENT }, decidedBy: REVIEWER_1, priority: 20 },
      { id: 'case-r16-2', revisionSeq: 1, kind: 'appeal', depth: 'standard', status: 'decided', openedAt: '2026-09-12T19:00:00Z', decision: { outcome: 'appeal_upheld', at: '2026-10-01T10:00:00Z', statement: R16_UPHELD }, decidedBy: REVIEWER_2, appealOfCaseId: 'case-r16-1' },
    ],
    appeals: [
      {
        id: 'appeal-r16', target: 'rejection', appealedCaseId: 'case-r16-1', appealCaseId: 'case-r16-2',
        message: 'These are my own vocals, recorded at home and processed heavily with a formant shifter.',
        status: 'upheld', filedAt: '2026-09-12T19:00:00Z', decidedAt: '2026-10-01T10:00:00Z',
      },
    ],
    events: [
      ev('release_created', '2026-09-02T18:00:00Z', SELLER, { seq: 1 }),
      ev('submitted', '2026-09-04T09:00:00Z', SELLER, { seq: 1, caseId: 'case-r16-1' }),
      ev('review_started', '2026-09-08T10:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r16-1' }),
      ev('rejected', '2026-09-10T15:00:00Z', reviewer(REVIEWER_1), { seq: 1, caseId: 'case-r16-1', statement: R16_STATEMENT }),
      ev('appeal_filed', '2026-09-12T19:00:00Z', SELLER, { seq: 1, caseId: 'case-r16-2', appealId: 'appeal-r16', note: 'These are my own vocals, recorded at home and processed heavily with a formant shifter.' }),
      ev('appeal_upheld', '2026-10-01T10:00:00Z', reviewer(REVIEWER_2), { seq: 1, caseId: 'case-r16-2', appealId: 'appeal-r16', statement: R16_UPHELD }),
    ],
  },
];

/** The seed state: a module-level constant, so the store's server snapshot keeps one reference. */
export const SEED_STATE: LifecycleState = buildState(SEEDS);

/** demo-r01 … demo-r16, in RL §7.4 order. */
export const SEED_RELEASE_IDS: readonly string[] = SEEDS.map((s) => seedId(s.n));

/**
 * What the Market shows of a linked release before any demo action (WEB-V2-SPEC
 * §6.4): the seed's current revision at DEMO_NOW. Package B renders it on the
 * server; `useCurrentRelease` takes over after hydration.
 */
export function seedPublicView(releaseId: string): PublicReleaseView | null {
  return toPublicView(SEED_STATE, releaseId, DEMO_NOW);
}
