/**
 * Release lifecycle: shared types for cadencea-web (Next.js) and, later, cadencea-stream (Expo).
 * Source of truth: docs/v2/RELEASE-LIFECYCLE.md section 8. Keep every copy identical.
 * Rules: no imports, no DOM or React Native types, string unions (no enums),
 * ISO 8601 UTC strings for time, integer minor units for money. Strip-only TypeScript
 * (Node type stripping): no enum, namespace or parameter properties.
 */

export const RELEASE_LIFECYCLE_SPEC_VERSION = '2026-10-10.3' as const;

export type Id = string;
/** ISO 8601 UTC timestamp, e.g. '2026-10-10T12:00:00Z'. */
export type IsoDateTime = string;
/** ISO 8601 calendar date, e.g. '2026-10-10'. */
export type IsoDate = string;

/* ------------------------------------------------------------------ */
/* Release types                                                       */
/* ------------------------------------------------------------------ */

export const RELEASE_TYPES = [
  'song',
  'beat',
  'preset_pack',
  'sample_pack',
  'splits_pack',
  'midi_pack',
  'theme',
] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

/** URL slugs (kebab-case) used by /publish/[type]. */
export const RELEASE_TYPE_SLUG: Readonly<Record<ReleaseType, string>> = {
  song: 'song',
  beat: 'beat',
  preset_pack: 'preset-pack',
  sample_pack: 'sample-pack',
  splits_pack: 'splits-pack',
  midi_pack: 'midi-pack',
  theme: 'theme',
};

export type Surface = 'stream' | 'market';
export type PaymentRail = 'credits' | 'card' | 'none';
export type LicenseFamily =
  | 'stream_non_exclusive'
  | 'personal_download'
  | 'beat_lease'
  | 'rf_asset'
  | 'splits'
  | 'theme_personal';
export type ReviewDepth = 'light' | 'standard' | 'strict';

export interface ReleaseTypeInfo {
  surfaces: readonly Surface[];
  /** How buyers pay. Songs: card for optional downloads; streaming has no item price. */
  payment: PaymentRail;
  license: LicenseFamily;
  sellerCanPublish: boolean;
  /** Has a web wizard in this build (founder brief item 5). */
  wizardInThisBuild: boolean;
  firstReviewDepth: ReviewDepth;
  evidence: 'required' | 'recommended' | 'none';
  /** Minimum deliverable items (tracks, presets, samples, loops, MIDI files). */
  minItems: number;
}

export const RELEASE_TYPE_INFO: Readonly<Record<ReleaseType, ReleaseTypeInfo>> = {
  song:        { surfaces: ['stream'],           payment: 'card',    license: 'stream_non_exclusive', sellerCanPublish: true,  wizardInThisBuild: true,  firstReviewDepth: 'strict',   evidence: 'required',    minItems: 1 },
  beat:        { surfaces: ['market'],           payment: 'card',    license: 'beat_lease',           sellerCanPublish: true,  wizardInThisBuild: true,  firstReviewDepth: 'strict',   evidence: 'required',    minItems: 1 },
  preset_pack: { surfaces: ['market'],           payment: 'credits', license: 'rf_asset',             sellerCanPublish: true,  wizardInThisBuild: true,  firstReviewDepth: 'standard', evidence: 'recommended', minItems: 15 },
  sample_pack: { surfaces: ['market'],           payment: 'credits', license: 'rf_asset',             sellerCanPublish: true,  wizardInThisBuild: true,  firstReviewDepth: 'standard', evidence: 'recommended', minItems: 20 },
  splits_pack: { surfaces: ['market'],           payment: 'credits', license: 'splits',               sellerCanPublish: true,  wizardInThisBuild: false, firstReviewDepth: 'strict',   evidence: 'required',    minItems: 5 },
  midi_pack:   { surfaces: ['market'],           payment: 'credits', license: 'rf_asset',             sellerCanPublish: true,  wizardInThisBuild: false, firstReviewDepth: 'standard', evidence: 'recommended', minItems: 10 },
  theme:       { surfaces: ['market'],           payment: 'credits', license: 'theme_personal',       sellerCanPublish: false, wizardInThisBuild: false, firstReviewDepth: 'standard', evidence: 'none',        minItems: 1 },
};

/* ------------------------------------------------------------------ */
/* Statuses                                                            */
/* ------------------------------------------------------------------ */

export const RELEASE_STATUSES = [
  'draft',
  'in_review',
  'changes_requested',
  'live',
  'unpublished',
  'suspended',
  'rejected',
] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const REVISION_STATUSES = [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

export type UnpublishedBy = 'seller' | 'platform' | 'system';
export type SystemUnpublishCause = 'storage_over_quota' | 'exclusive_sold' | 'account_closed';

/* ------------------------------------------------------------------ */
/* Actors                                                              */
/* ------------------------------------------------------------------ */

export type SystemProcess =
  | 'auto_checks'
  | 'publisher'
  | 'storage_quota'
  | 'exclusive_sale'
  | 'account_lifecycle'
  | 'demo_simulator';

export type Actor =
  | { kind: 'seller'; userId: Id }
  | { kind: 'reviewer'; reviewerId: Id } // always displayed as "Cadencea review team"
  | { kind: 'system'; process: SystemProcess };
export type ActorKind = Actor['kind'];

/* ------------------------------------------------------------------ */
/* Music metadata                                                      */
/* ------------------------------------------------------------------ */

export type PitchClass =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export interface MusicalKey {
  root: PitchClass;
  mode: 'Major' | 'Minor';
}
/** null means "No key" (drums, atonal). Absent means "not answered yet". Never default to C Major. */
export type KeyValue = MusicalKey | null;

/** Same values as the Vault's KEY_SOURCES. Never add new values (v1 validates them). */
export type ValueSource = 'user' | 'analysis' | 'assistant' | 'import';

export interface Provenanced<T> {
  value: T;
  source: ValueSource;
  /** 0 to 1, only when source === 'analysis'. */
  confidence?: number;
  /** The seller confirmed the value in the wizard. Required for submit when source === 'analysis'. */
  confirmed: boolean;
}

/** BPM is a string of 1 to 3 digits, 20 to 999, matching the Vault and cloud API rule. */
export type BpmString = string;
export const BPM_PATTERN = /^\d{1,3}$/;
export const BPM_MIN = 20;
export const BPM_MAX = 999;

/* ------------------------------------------------------------------ */
/* Money and prices                                                    */
/* ------------------------------------------------------------------ */

/** Consumer price including VAT, in minor units (cents, øre). */
export interface Money {
  amountMinor: number;
  currency: 'EUR' | 'NOK';
}

/**
 * Numbers come from docs/v2/CREDITS-MODEL.md (§6.1 credits, §6.2 card). Never hardcode them in copy.
 * Display: 'free' renders as "0 credits" (CREDITS-MODEL §9: only Detect is called free).
 */
export type Price =
  | { kind: 'credits'; credits: number }
  | { kind: 'free' }
  | { kind: 'card'; amount: Money }
  | { kind: 'per_tier' } // beats: see LeaseTier.price
  | { kind: 'stream_only' }; // songs without a download sale

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

export type FileKind = 'audio' | 'preset' | 'midi' | 'image' | 'daw' | 'other';

export interface FileRef {
  /** Vault-relative path, NFC, forward slashes. */
  path: string;
  /** Lowercase hex SHA-256 without prefix (strip "sha256:" from online.json). */
  sha256: string;
  bytes: number;
  kind: FileKind;
  durationMs?: number;
  /** Per-file tempo and key (loops). */
  bpm?: Provenanced<BpmString>;
  key?: Provenanced<KeyValue>;
  /** Demo only: web maps it to a CoverArt seed or audio recipe (Stream doesn't use these types yet, §6.6). */
  demoAssetKey?: string;
}

export interface CoverArt {
  file: FileRef;
  widthPx: number;
  heightPx: number;
}

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

export interface CommonDetails {
  title: string;
  description: string;
  tags: string[];
  genre: string | null;
  moods: string[];
  cover: CoverArt | null;
  bpm?: Provenanced<BpmString>;
  key?: Provenanced<KeyValue>;
}

export interface LicensedMaterial {
  description: string;
  source: string;
  licence: string;
  /** Set when bought on Cadencea Market; such items qualify automatically. */
  marketOrderItemId: Id | null;
}

export type CreditRole =
  | 'writer'
  | 'composer'
  | 'lyricist'
  | 'producer'
  | 'co_producer'
  | 'performer'
  | 'vocalist'
  | 'mixing_engineer'
  | 'mastering_engineer';

export interface CreditEntry {
  name: string;
  cadenceaUserId: Id | null;
  roles: CreditRole[];
  /** Recording share; entries with a value total 100. */
  masterSharePct: number | null;
  /** Composition share; entries with a value total 100. */
  compositionSharePct: number | null;
  cmo: string | null;
  ipi: string | null;
  confirmation: 'self' | 'pending' | 'confirmed' | 'declined' | 'not_on_cadencea';
}

export interface SongTrack {
  id: Id;
  position: number; // 1-based
  title: string;
  audio: FileRef; // WAV or FLAC master, delivered as uploaded
  isrc: string | null;
  explicit: boolean;
  /** ISO 639-1, or 'zxx' for no lyrics. */
  language: string;
  bpm?: Provenanced<BpmString>;
  key?: Provenanced<KeyValue>;
  previewStartMs: number;
  credits: CreditEntry[];
}

export interface SongPayload extends CommonDetails {
  kind: 'song';
  format: 'single' | 'ep' | 'album';
  /** null = go public on approval. */
  releaseDate: IsoDate | null;
  /** ISO 3166-1 alpha-2. Default ['NO']. */
  territories: string[];
  tracks: SongTrack[];
  licensedMaterial: LicensedMaterial[];
  pLine: string | null;
  cLine: string | null;
  /** Download price for the whole release, or stream only. */
  price: { kind: 'stream_only' } | { kind: 'card'; amount: Money };
  allowFanSupport: boolean;
}

export const LEASE_TIER_IDS = ['wav', 'stems', 'unlimited', 'exclusive'] as const;
export type LeaseTierId = (typeof LEASE_TIER_IDS)[number];

/** ADR-0042 license value for each tier (CREDITS-MODEL §6.2). */
export const LEASE_TIER_LICENSE: Readonly<Record<LeaseTierId, string>> = {
  wav: 'music_beat_basic',
  stems: 'music_beat_premium',
  unlimited: 'music_beat_unlimited',
  exclusive: 'music_beat_exclusive',
};

export interface LeaseTier {
  tier: LeaseTierId;
  enabled: boolean;
  /** Seller-set card price within the tier range in CREDITS-MODEL §6.2. */
  price: Money;
  files: FileRef[];
  /** Fixed per tier in v2 (CREDITS-MODEL §6.2). null = no cap. */
  audioStreamCap: number | null;
  producerPublishingSharePct: number;
  creditLine: string;
  contentIdAllowed: boolean;
}

export interface BeatPayload extends CommonDetails {
  kind: 'beat';
  mainMix: FileRef;
  previewStartMs: number;
  previewHasProducerTag: boolean;
  stems: FileRef[];
  tiers: LeaseTier[];
  coProducers: CreditEntry[];
  licensedMaterial: LicensedMaterial[];
  price: { kind: 'per_tier' };
}

export type Synth = 'serum2' | 'vital';
export type PresetCategory =
  | 'bass' | 'lead' | 'pad' | 'pluck' | 'keys' | 'arp' | 'fx' | 'drum' | 'texture';

export interface PresetPackPayload extends CommonDetails {
  kind: 'preset_pack';
  synth: Synth;
  minSynthVersion: string;
  vitalTier: 'basic' | 'plus' | 'pro' | null;
  presets: FileRef[];
  categories: PresetCategory[];
  /** Pack audio demo, required before submit. */
  demo: FileRef | null;
  perPresetDemos: FileRef[];
  embedsAudio: boolean | null; // null = not answered yet
  embeddedAudioNote: string | null;
  licensedMaterial: LicensedMaterial[];
  price: Price;
}

export interface SamplePackPayload extends CommonDetails {
  kind: 'sample_pack';
  samples: FileRef[];
  contents: { oneShots: number; loops: number };
  demo: FileRef | null;
  licensedMaterial: LicensedMaterial[];
  price: Price;
}

export interface SplitTerms {
  templateId: 'cadencea_splits_v1';
  termsVersion: string;
  publishingSharePct: 25 | 50;
  advanceSharePct: 0 | 25 | 50;
  creditLine: string;
}

export interface SplitsPackPayload extends CommonDetails {
  kind: 'splits_pack';
  loops: FileRef[];
  demo: FileRef | null;
  terms: SplitTerms;
  licensedMaterial: LicensedMaterial[];
  price: Price;
}

export interface MidiPackPayload extends CommonDetails {
  kind: 'midi_pack';
  midiFiles: FileRef[];
  demo: FileRef | null;
  licensedMaterial: LicensedMaterial[];
  price: Price;
}

export interface ThemePayload extends CommonDetails {
  kind: 'theme';
  themeId: string;
  screenshots: FileRef[];
  appearance: 'dark' | 'light' | 'both';
  price: Price;
}

export type ReleasePayload =
  | SongPayload
  | BeatPayload
  | PresetPackPayload
  | SamplePackPayload
  | SplitsPackPayload
  | MidiPackPayload
  | ThemePayload;

/* ------------------------------------------------------------------ */
/* Provenance and attestation                                          */
/* ------------------------------------------------------------------ */

export type DawKind =
  | 'ableton' | 'fl_studio' | 'logic' | 'pro_tools' | 'cubase' | 'reaper'
  | 'reason' | 'studio_one' | 'bitwig' | 'sonar' | 'cakewalk' | 'garageband' | 'other';

export interface VaultSourceRef {
  /**
   * Vault the project lives in. There is no stable project id today: .trackvault.json (ADR-0033)
   * identifies a project by its name inside a vault. Fictional in the demo.
   */
  vaultId: Id;
  /** Project name, NFC (unicode_utils). Together with vaultId this is the project's identity. */
  projectName: string;
  /** True when the cloud copy had no unpushed changes at capture time. */
  pushedAtCapture: boolean;
  capturedAt: IsoDateTime;
}

export interface ProvenanceEvidence {
  capturedAt: IsoDateTime;
  source: VaultSourceRef;
  manifest: { path: string; sha256: string; bytes: number }[];
  /** For bundle formats (.logicx, .band) sha256 hashes the sorted "path:sha256" lines of the bundle's files. */
  dawSessions: { path: string; daw: DawKind; sha256: string; bytes: number }[];
  stemCount: number;
  audioFileCount: number;
  projectCreatedAt: IsoDateTime | null;
  projectUpdatedAt: IsoDateTime | null;
  /** null until Vault version history ships. */
  historyDepthDays: number | null;
  howMadeNote: string | null;
  /** Evidence is deleted after this time unless an appeal or legal claim holds it. */
  retainUntil: IsoDateTime | null;
}

export interface Attestation {
  standardVersion: 'human-made-2026-10';
  madeByMe: boolean;
  noGeneratedAudio: boolean;
  licensedMaterialListed: boolean;
  coverRights: boolean;
  falseStatementConsequences: boolean;
  acceptedAt: IsoDateTime | null;
}

/* ------------------------------------------------------------------ */
/* Revisions and releases                                              */
/* ------------------------------------------------------------------ */

export type ChangeKind =
  | 'metadata' | 'cover' | 'price' | 'license' | 'files' | 'credits_splits' | 'tracklist' | 'audio';

export interface FieldChange {
  /** Dot path in the payload, e.g. 'tags', 'tiers.stems.price'. */
  field: string;
  kind: ChangeKind;
  before: unknown;
  after: unknown;
}

export interface FileChange {
  change: 'added' | 'removed' | 'replaced' | 'renamed';
  path: string;
  previousPath?: string;
  beforeSha256?: string;
  afterSha256?: string;
  bytesDelta: number;
}

export interface ChangeSummary {
  kinds: ChangeKind[];
  fields: FieldChange[];
  files: FileChange[];
  unchangedFileCount: number;
  reviewDepth: ReviewDepth;
}

export interface Revision {
  id: Id;
  releaseId: Id;
  /** 1, 2, 3... never reused. */
  seq: number;
  /** Public version, set only on approval. */
  version: number | null;
  /** Version this update was based on; null for the first revision. */
  baseVersion: number | null;
  status: RevisionStatus;
  payload: ReleasePayload;
  changes: ChangeSummary | null;
  changeNote: string | null;
  replyToReviewer: string | null;
  evidence: ProvenanceEvidence | null;
  attestation: Attestation | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  submittedAt: IsoDateTime | null;
  decidedAt: IsoDateTime | null;
  supersededAt: IsoDateTime | null;
  caseIds: Id[];
}

export interface Release {
  id: Id;
  type: ReleaseType;
  slug: string;
  sellerId: Id;
  sellerHandle: string;
  channels: Surface[];
  status: ReleaseStatus;
  /** Songs with a future release date: live but not public until this time. */
  goesPublicAt: IsoDateTime | null;
  unpublished: {
    by: UnpublishedBy;
    cause: SystemUnpublishCause | null;
    at: IsoDateTime;
    caseId: Id | null;
  } | null;
  suspension: {
    at: IsoDateTime;
    caseId: Id;
    restoreTo: 'live' | 'unpublished';
    downloadsDisabled: boolean;
  } | null;
  currentRevisionId: Id | null;
  openRevisionId: Id | null;
  revisionIds: Id[];
  source: VaultSourceRef | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  firstLiveAt: IsoDateTime | null;
  /** Demo only. */
  demoStats?: { sales?: number; ownersByVersion?: Record<number, number>; playsThisMonth?: number };
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

export const REASON_CODES = [
  'files_missing',
  'files_changed_since_submit',
  'format_not_accepted',
  'below_minimum_count',
  'demo_missing',
  'preview_segment_invalid',
  'metadata_inaccurate',
  'misleading_metadata',
  'cover_art_quality',
  'cover_art_rights',
  'synth_version_mismatch',
  'embedded_audio_undisclosed',
  'credits_incomplete',
  'splits_invalid',
  'isrc_invalid',
  'explicit_flag_wrong',
  'price_out_of_range',
  'lease_terms_invalid',
  'new_recording_needs_new_release',
  'evidence_insufficient',
  'uncleared_samples',
  'duplicate_content',
  'human_made_violation',
  'impersonation',
  'copyright_claim',
  'legal_order',
  'other',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export interface ReasonItem {
  code: ReasonCode;
  message: string;
  fields?: string[];
  files?: string[];
}

export type RestrictionKind =
  | 'not_published'
  | 'update_not_published'
  | 'suspended'
  | 'removed'
  | 'earnings_on_hold';

export interface StatementOfReasons {
  restriction: RestrictionKind;
  reasons: ReasonItem[]; // at least one
  facts: string;
  ground:
    | { kind: 'terms'; clause: string }
    | { kind: 'law'; reference: string };
  /** An automated check flagged the item. Decisions are always made by a person. */
  automatedDetection: boolean;
  appealUntil: IsoDateTime;
  issuedAt: IsoDateTime;
}

export type ReviewCaseKind = 'new_release' | 'update' | 'report' | 'dmca' | 'appeal' | 'audit';
export type ReviewCaseStatus = 'queued' | 'in_progress' | 'decided' | 'dismissed';

export type AutoCheckId =
  | 'files_match_manifest'
  | 'formats'
  | 'minimum_count'
  | 'cover_art'
  | 'preview'
  | 'metadata_complete'
  | 'duplicate_sha256'
  | 'human_made_triage';

export interface AutoCheck {
  id: AutoCheckId;
  result: 'pass' | 'warn' | 'fail' | 'flag';
  sellerVisible: boolean;
  detail?: string;
}

export type ReviewDecision =
  | { outcome: 'approved'; at: IsoDateTime; note?: string }
  | { outcome: 'changes_requested'; at: IsoDateTime; reasons: ReasonItem[]; note?: string }
  | { outcome: 'rejected'; at: IsoDateTime; statement: StatementOfReasons }
  | { outcome: 'suspended'; at: IsoDateTime; statement: StatementOfReasons }
  | { outcome: 'reinstated'; at: IsoDateTime; note?: string }
  | { outcome: 'removed'; at: IsoDateTime; statement: StatementOfReasons }
  | { outcome: 'appeal_upheld'; at: IsoDateTime; statement: StatementOfReasons }
  | { outcome: 'appeal_overturned'; at: IsoDateTime; note?: string };

export interface ReviewCase {
  id: Id;
  releaseId: Id;
  revisionId: Id | null;
  kind: ReviewCaseKind;
  /** 0 is top, 100 is lowest. Default 50 (ADR-0042 scale). */
  priority: number;
  depth: ReviewDepth;
  status: ReviewCaseStatus;
  assignedReviewerId: Id | null;
  checks: AutoCheck[];
  decision: ReviewDecision | null;
  decidedBy: Id | null;
  /** Appeal cases only: the case whose decision is appealed. */
  appealOfCaseId: Id | null;
  openedAt: IsoDateTime;
  decidedAt: IsoDateTime | null;
}

export interface Appeal {
  id: Id;
  releaseId: Id;
  revisionId: Id | null;
  target: 'rejection' | 'suspension' | 'removal';
  appealedCaseId: Id;
  appealCaseId: Id;
  message: string;
  status: 'open' | 'upheld' | 'overturned';
  filedAt: IsoDateTime;
  decidedAt: IsoDateTime | null;
}

export type ReviewEventType =
  | 'release_created'
  | 'draft_saved'
  | 'submitted'
  | 'pulled_back'
  | 'resubmitted'
  | 'update_started'
  | 'update_discarded'
  | 'auto_checks_completed'
  | 'review_started'
  | 'changes_requested'
  | 'rejected'
  | 'went_live'
  | 'scheduled'
  | 'update_went_live'
  | 'update_approved'
  | 'publish_failed'
  | 'unpublished'
  | 'relisted'
  | 'suspended'
  | 'reinstated'
  | 'removed'
  | 'appeal_filed'
  | 'appeal_upheld'
  | 'appeal_overturned'
  | 'exclusive_sold'
  | 'deleted';

export interface ReviewEvent {
  id: Id;
  releaseId: Id;
  revisionId: Id | null;
  type: ReviewEventType;
  at: IsoDateTime;
  actor: Actor;
  visibility: 'seller' | 'internal';
  /** Version or revision the event concerns, for the timeline label. */
  version: number | null;
  seq: number | null;
  reasons?: ReasonItem[];
  statement?: StatementOfReasons;
  caseId?: Id;
  appealId?: Id;
  note?: string;
  /** Demo: produced by the Simulate review panel. */
  simulated?: boolean;
}

/* ------------------------------------------------------------------ */
/* Buyer snapshot                                                      */
/* ------------------------------------------------------------------ */

export type PaidPrice =
  | { kind: 'credits'; credits: number }
  | { kind: 'card'; amount: Money }
  | { kind: 'free' };

export interface Entitlement {
  orderItemId: Id;
  releaseId: Id;
  /** The version bought. Kept forever. */
  version: number;
  pricePaid: PaidPrice;
  license: LicenseFamily;
  licenseTermsVersion: string;
  leaseTier?: LeaseTierId;
  splitTerms?: SplitTerms;
  purchasedAt: IsoDateTime;
  /** Owners also get later approved versions at no extra cost (CREDITS-MODEL §6.3), under the terms they bought. */
  latestVersionAccess: true;
}

/* ------------------------------------------------------------------ */
/* Actions and transitions                                             */
/* ------------------------------------------------------------------ */

export type SellerAction =
  | { type: 'create_release'; releaseType: ReleaseType; source: VaultSourceRef; payload: ReleasePayload }
  | { type: 'save_draft'; releaseId: Id; payload: ReleasePayload; changeNote?: string }
  | { type: 'submit'; releaseId: Id; attestation: Attestation; evidence: ProvenanceEvidence | null }
  | { type: 'pull_back'; releaseId: Id }
  | { type: 'resubmit'; releaseId: Id; replyToReviewer: string | null }
  | { type: 'start_update'; releaseId: Id }
  | { type: 'discard_update'; releaseId: Id }
  | { type: 'delete_release'; releaseId: Id }
  | { type: 'unpublish'; releaseId: Id }
  | { type: 'relist'; releaseId: Id }
  | { type: 'file_appeal'; releaseId: Id; appealedCaseId: Id; message: string };

export type ReviewerAction =
  | { type: 'start_review'; caseId: Id }
  | { type: 'approve'; caseId: Id; note?: string }
  | { type: 'request_changes'; caseId: Id; reasons: ReasonItem[]; note?: string }
  | { type: 'reject'; caseId: Id; statement: StatementOfReasons }
  | { type: 'suspend'; releaseId: Id; statement: StatementOfReasons; disableDownloads: boolean }
  | { type: 'reinstate'; releaseId: Id; note?: string }
  | { type: 'remove'; releaseId: Id; statement: StatementOfReasons }
  | { type: 'decide_appeal'; appealId: Id; outcome: 'upheld' | 'overturned'; statement?: StatementOfReasons; note?: string };

export type SystemAction =
  | { type: 'auto_checks_completed'; caseId: Id; checks: AutoCheck[] }
  | { type: 'request_changes'; caseId: Id; reasons: ReasonItem[]; note?: string }
  | { type: 'publish_failed'; caseId: Id; detail: string }
  | { type: 'quota_unpublish'; releaseId: Id }
  | { type: 'exclusive_sold'; releaseId: Id }
  | { type: 'account_closed'; releaseId: Id };

export type LifecycleAction = SellerAction | ReviewerAction | SystemAction;
export type LifecycleActionType = LifecycleAction['type'];

export interface TransitionRule {
  id: string; // 'T01'...
  action: LifecycleActionType;
  actors: readonly ActorKind[];
  scope: 'first' | 'update' | 'any';
  release: {
    from: readonly (ReleaseStatus | 'none')[];
    to: ReleaseStatus | 'unchanged' | 'deleted' | 'restore';
  };
  revision: {
    from: readonly (RevisionStatus | 'none')[];
    to: RevisionStatus | 'unchanged';
  };
}

/** Mirrors section 4.6. Guards that need data (validation, deadlines, actor identity) live in machine.ts. */
export const TRANSITIONS: readonly TransitionRule[] = [
  { id: 'T01', action: 'create_release', actors: ['seller'], scope: 'first',
    release: { from: ['none'], to: 'draft' }, revision: { from: ['none'], to: 'draft' } },
  { id: 'T02', action: 'save_draft', actors: ['seller'], scope: 'any',
    release: { from: ['draft', 'changes_requested', 'live', 'unpublished', 'suspended'], to: 'unchanged' },
    revision: { from: ['draft', 'changes_requested'], to: 'unchanged' } },
  { id: 'T03', action: 'submit', actors: ['seller'], scope: 'first',
    release: { from: ['draft'], to: 'in_review' }, revision: { from: ['draft'], to: 'in_review' } },
  { id: 'T04', action: 'submit', actors: ['seller'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['draft'], to: 'in_review' } },
  { id: 'T05a', action: 'pull_back', actors: ['seller'], scope: 'first',
    release: { from: ['in_review'], to: 'draft' }, revision: { from: ['in_review'], to: 'draft' } },
  { id: 'T05b', action: 'pull_back', actors: ['seller'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'draft' } },
  { id: 'T06a', action: 'resubmit', actors: ['seller'], scope: 'first',
    release: { from: ['changes_requested'], to: 'in_review' }, revision: { from: ['changes_requested'], to: 'in_review' } },
  { id: 'T06b', action: 'resubmit', actors: ['seller'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['changes_requested'], to: 'in_review' } },
  { id: 'T07', action: 'start_update', actors: ['seller'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['none'], to: 'draft' } },
  { id: 'T08', action: 'discard_update', actors: ['seller'], scope: 'update',
    release: { from: ['live', 'unpublished', 'suspended'], to: 'unchanged' },
    revision: { from: ['draft', 'in_review', 'changes_requested'], to: 'withdrawn' } },
  { id: 'T09', action: 'delete_release', actors: ['seller'], scope: 'first',
    release: { from: ['draft', 'changes_requested', 'rejected'], to: 'deleted' },
    revision: { from: ['draft', 'changes_requested', 'rejected'], to: 'withdrawn' } },
  { id: 'T10', action: 'unpublish', actors: ['seller'], scope: 'update',
    release: { from: ['live'], to: 'unpublished' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T11', action: 'relist', actors: ['seller'], scope: 'update',
    release: { from: ['unpublished'], to: 'live' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T12', action: 'file_appeal', actors: ['seller'], scope: 'any',
    release: { from: ['rejected', 'live', 'unpublished', 'suspended'], to: 'unchanged' },
    revision: { from: ['none', 'rejected'], to: 'unchanged' } },
  { id: 'T13', action: 'start_review', actors: ['reviewer'], scope: 'any',
    release: { from: ['in_review', 'live', 'unpublished', 'rejected', 'suspended'], to: 'unchanged' },
    revision: { from: ['none', 'in_review', 'rejected'], to: 'unchanged' } },
  { id: 'T14', action: 'approve', actors: ['reviewer'], scope: 'first',
    release: { from: ['in_review'], to: 'live' }, revision: { from: ['in_review'], to: 'approved' } },
  { id: 'T15', action: 'approve', actors: ['reviewer'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'approved' } },
  { id: 'T16a', action: 'request_changes', actors: ['reviewer', 'system'], scope: 'first',
    release: { from: ['in_review'], to: 'changes_requested' }, revision: { from: ['in_review'], to: 'changes_requested' } },
  { id: 'T16b', action: 'request_changes', actors: ['reviewer', 'system'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'changes_requested' } },
  { id: 'T17a', action: 'reject', actors: ['reviewer'], scope: 'first',
    release: { from: ['in_review'], to: 'rejected' }, revision: { from: ['in_review'], to: 'rejected' } },
  { id: 'T17b', action: 'reject', actors: ['reviewer'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'rejected' } },
  { id: 'T18', action: 'suspend', actors: ['reviewer'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'suspended' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T19', action: 'reinstate', actors: ['reviewer'], scope: 'update',
    release: { from: ['suspended'], to: 'restore' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T20', action: 'auto_checks_completed', actors: ['system'], scope: 'any',
    release: { from: ['in_review', 'live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'unchanged' } },
  { id: 'T21', action: 'publish_failed', actors: ['system'], scope: 'any',
    release: { from: ['in_review', 'live', 'unpublished'], to: 'unchanged' }, revision: { from: ['in_review'], to: 'unchanged' } },
  { id: 'T22', action: 'remove', actors: ['reviewer'], scope: 'update',
    release: { from: ['live', 'suspended'], to: 'unpublished' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'withdrawn' } },
  { id: 'T23', action: 'decide_appeal', actors: ['reviewer'], scope: 'any',
    release: { from: ['rejected', 'live', 'unpublished', 'suspended'], to: 'unchanged' }, revision: { from: ['none', 'rejected'], to: 'unchanged' } },
  { id: 'T24a', action: 'decide_appeal', actors: ['reviewer'], scope: 'first',
    release: { from: ['rejected'], to: 'live' }, revision: { from: ['rejected'], to: 'approved' } },
  { id: 'T24b', action: 'decide_appeal', actors: ['reviewer'], scope: 'update',
    release: { from: ['live', 'unpublished'], to: 'unchanged' }, revision: { from: ['rejected'], to: 'approved' } },
  { id: 'T24c', action: 'decide_appeal', actors: ['reviewer'], scope: 'update',
    release: { from: ['suspended'], to: 'restore' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T24d', action: 'decide_appeal', actors: ['reviewer'], scope: 'update',
    release: { from: ['unpublished'], to: 'live' }, revision: { from: ['none'], to: 'unchanged' } },
  { id: 'T25', action: 'quota_unpublish', actors: ['system'], scope: 'update',
    release: { from: ['live'], to: 'unpublished' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'unchanged' } },
  { id: 'T26', action: 'exclusive_sold', actors: ['system'], scope: 'update',
    release: { from: ['live'], to: 'unpublished' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'withdrawn' } },
  { id: 'T27a', action: 'account_closed', actors: ['system'], scope: 'update',
    release: { from: ['live', 'unpublished', 'suspended'], to: 'unpublished' }, revision: { from: ['none', 'draft', 'in_review', 'changes_requested', 'rejected'], to: 'withdrawn' } },
  { id: 'T27b', action: 'account_closed', actors: ['system'], scope: 'first',
    release: { from: ['draft', 'in_review', 'changes_requested', 'rejected'], to: 'deleted' }, revision: { from: ['draft', 'in_review', 'changes_requested', 'rejected'], to: 'withdrawn' } },
];

/* ------------------------------------------------------------------ */
/* Reducer contract                                                    */
/* ------------------------------------------------------------------ */

export interface LifecycleState {
  specVersion: typeof RELEASE_LIFECYCLE_SPEC_VERSION;
  releases: Record<Id, Release>;
  revisions: Record<Id, Revision>;
  cases: Record<Id, ReviewCase>;
  appeals: Record<Id, Appeal>;
  /** Append-only, oldest first. */
  events: ReviewEvent[];
}

export type WizardStepId =
  | 'source' | 'details' | 'contents' | 'cover_preview' | 'license_price' | 'review_submit';

export interface ValidationIssue {
  step: WizardStepId;
  field: string;
  code: string; // section 5.8 codes
  message: string;
}

export type LifecycleErrorCode =
  | 'not_found'
  | 'not_allowed_for_actor'
  | 'invalid_state'
  | 'open_revision_exists'
  | 'validation_failed'
  | 'nothing_changed'
  | 'review_already_started'
  | 'appeal_window_closed'
  | 'appeal_exists'
  | 'same_reviewer'
  | 'release_suspended'
  | 'not_relistable'
  | 'type_not_publishable';

export type ApplyResult =
  | { ok: true; state: LifecycleState; events: ReviewEvent[] }
  | { ok: false; error: LifecycleErrorCode; message: string; issues?: ValidationIssue[] };

/** Implemented in lib/v2-demo/release-lifecycle/machine.ts (web). Pure: no I/O, time is passed in. */
export type ApplyAction = (
  state: LifecycleState,
  action: LifecycleAction,
  actor: Actor,
  now: IsoDateTime,
) => ApplyResult;

/** Appeal window in days (DSA Art. 20 minimum of six months). */
export const APPEAL_WINDOW_DAYS = 183;

/* ------------------------------------------------------------------ */
/* Visibility and Studio helpers                                       */
/* ------------------------------------------------------------------ */

/** True when buyers or listeners can see the release (invariant 8). */
export function isPublic(release: Release, now: IsoDateTime): boolean {
  if (release.status !== 'live') return false;
  return release.goesPublicAt === null || Date.parse(release.goesPublicAt) <= Date.parse(now);
}

export const STUDIO_TABS = [
  'all',
  'drafts',
  'in_review',
  'live',
  'update_in_review',
  'needs_changes',
  'rejected_unpublished',
] as const;
export type StudioTab = (typeof STUDIO_TABS)[number];

export function inStudioTab(tab: StudioTab, release: Release, open: Revision | null): boolean {
  const isUpdate = release.currentRevisionId !== null;
  switch (tab) {
    case 'all':
      return true;
    case 'drafts':
      return release.status === 'draft' || (isUpdate && open?.status === 'draft');
    case 'in_review':
      return release.status === 'in_review';
    case 'live':
      return release.status === 'live';
    case 'update_in_review':
      return isUpdate && open?.status === 'in_review';
    case 'needs_changes':
      return release.status === 'changes_requested' || (isUpdate && open?.status === 'changes_requested');
    case 'rejected_unpublished':
      return release.status === 'rejected' || release.status === 'unpublished' || release.status === 'suspended';
  }
}

/** Six tones, one per web token pair `--color-tone-*` / `--color-tone-*-bg` (WEB-V2-SPEC §3.1). */
export type Tone = 'neutral' | 'info' | 'update' | 'warning' | 'success' | 'danger';
export type PrimaryChipId =
  | 'draft' | 'in_review' | 'changes_requested' | 'rejected' | 'scheduled' | 'live'
  | 'unpublished' | 'sold_exclusive' | 'removed' | 'suspended';
export type SecondaryChipId =
  | 'update_draft' | 'update_in_review' | 'update_changes_requested' | 'update_appealed' | 'appeal_in_progress';

export interface StatusChips {
  primary: PrimaryChipId;
  secondary: SecondaryChipId | null;
}

export function getStatusChips(
  release: Release,
  open: Revision | null,
  hasOpenAppeal: boolean,
  now: IsoDateTime,
): StatusChips {
  let primary: PrimaryChipId;
  if (release.status === 'unpublished') {
    if (release.unpublished?.by === 'platform') primary = 'removed';
    else if (release.unpublished?.cause === 'exclusive_sold') primary = 'sold_exclusive';
    else primary = 'unpublished';
  } else if (release.status === 'live' && !isPublic(release, now)) {
    primary = 'scheduled';
  } else {
    primary = release.status;
  }

  let secondary: SecondaryChipId | null = null;
  if (release.currentRevisionId !== null && open !== null) {
    if (open.status === 'draft') secondary = 'update_draft';
    else if (open.status === 'in_review') secondary = 'update_in_review';
    else if (open.status === 'changes_requested') secondary = 'update_changes_requested';
    else if (open.status === 'rejected' && hasOpenAppeal) secondary = 'update_appealed';
  } else if (hasOpenAppeal) {
    secondary = 'appeal_in_progress';
  }
  return { primary, secondary };
}

export const CHIP_TONE: Readonly<Record<PrimaryChipId | SecondaryChipId, Tone>> = {
  draft: 'neutral',
  in_review: 'info',
  changes_requested: 'warning',
  rejected: 'danger',
  scheduled: 'info',
  live: 'success',
  unpublished: 'neutral',
  sold_exclusive: 'neutral',
  removed: 'danger',
  suspended: 'warning',
  update_draft: 'neutral',
  update_in_review: 'update',
  update_changes_requested: 'warning',
  update_appealed: 'update',
  appeal_in_progress: 'info',
};

/** The version number a pending update will get, e.g. 3 for "v3 in review". */
export function pendingVersionNumber(current: Revision | null): number {
  return (current?.version ?? 0) + 1;
}
