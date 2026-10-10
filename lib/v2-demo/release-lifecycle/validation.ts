/**
 * Publish wizard validation (RELEASE-LIFECYCLE §5.4, §5.5, §5.8). The wizard
 * shows these issues inline and in the last step's checklist; the reducer runs
 * the same checks as the submit guard (T03, T04, T06), so a release can't reach
 * review with an issue the wizard would have flagged.
 *
 * `field` in every issue is a dot path the wizard turns into an element id.
 */
import type {
  Attestation,
  BeatPayload,
  CommonDetails,
  FileRef,
  IsoDateTime,
  KeyValue,
  PresetPackPayload,
  ProvenanceEvidence,
  Provenanced,
  ReleasePayload,
  ReleaseType,
  SamplePackPayload,
  SongPayload,
  ValidationIssue,
  WizardStepId,
} from './types.ts';
import { BPM_MAX, BPM_MIN, BPM_PATTERN, RELEASE_TYPE_INFO } from './types.ts';
import { CREDITS } from '../credits/config.ts';
import { fill } from '../format.ts';
import { extensionOf, fileName } from './demo-files.ts';
import { SYNTH_EXTENSION } from './options.ts';

/** §5.8 messages. `tier_price_min` is the Exclusive variant of `tier_price_range`. */
export const VALIDATION_COPY = {
  required: 'Add {field}.',
  title_length: 'Use 2 to 80 characters.',
  description_length: 'Use up to 1,000 characters.',
  no_urls: 'Links go on your profile, not here.',
  tags_count: 'Add 1 to 10 tags.',
  bpm_format: 'Enter a whole number from 20 to 999.',
  confirm_detected: 'Detected by Cadencea. Check it and confirm.',
  cover_size: 'Use a square image of at least 1400 × 1400 px.',
  min_count: '{type} need at least {min} {items}. You have {count}.',
  format_not_accepted: '{file} is {ext}. Use {accepted}.',
  duplicate_in_pack: '{file} is the same file as {other}. Remove one.',
  shares_total: 'Shares add up to {total}%. They need to add up to 100%.',
  isrc_format: 'An ISRC has 12 characters, like NO-ABC-26-00001.',
  preview_range: 'Start the preview at least 30 seconds before the end.',
  price_range: 'Pick a price from {min} to {max} credits, in steps of {step}.',
  card_price_min: 'Set a price of at least €3.00.',
  tier_price_range: 'Pick a price from €{min} to €{max} for the {tier}.',
  tier_price_min: 'Pick a price of at least €{min} for the Exclusive.',
  price_above_items: "A pack can't cost more than its {count} items bought one by one ({max} credits).",
  tier_files_missing: '{tier} needs {files}. Add them or turn the tier off.',
  stems_needed: 'Stems, Unlimited and Exclusive leases need stems.',
  demo_needed: 'Add an audio demo so buyers can hear it.',
  evidence_needed: "We couldn't find a DAW session in this project. Add one, or tell us how you made it.",
  attestation_needed: 'Confirm the Human-Made Standard to submit.',
  push_first: 'Push your latest changes first. Publishing uses your cloud copy.',
  nothing_changed: 'Nothing changed yet.',
  change_note_length: 'Tell reviewers what changed (10 to 500 characters).',
} as const;

const TITLE_MIN = 2;
export const TITLE_MAX = 80;
const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;
const CHANGE_NOTE_MIN = 10;
export const CHANGE_NOTE_MAX = 500;
export const PREVIEW_CLIP_MS = 30_000;
const MIN_COVER_PX = 1400;
export const RELEASE_DATE_MAX_DAYS = 365;

const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|no|app|co)\b/i;
const ISRC_PATTERN = /^[A-Z]{2}-?[A-Z0-9]{3}-?\d{2}-?\d{5}$/i;

/** Plural type names and item nouns for `min_count`. */
const COUNT_NOUNS: Readonly<Record<ReleaseType, { type: string; items: string }>> = {
  song: { type: 'Songs', items: 'track' },
  beat: { type: 'Beats', items: 'main mix' },
  preset_pack: { type: 'Preset packs', items: 'presets' },
  sample_pack: { type: 'Sample packs', items: 'samples' },
  splits_pack: { type: 'Splits packs', items: 'loops' },
  midi_pack: { type: 'MIDI packs', items: 'MIDI files' },
  theme: { type: 'Themes', items: 'files' },
};

/** Which wizard step owns a field path. */
function stepOfField(field: string): WizardStepId {
  const head = field.split('.')[0];
  switch (head) {
    case 'tracks':
      return field.endsWith('.previewStartMs') ? 'cover_preview' : 'contents';
    case 'samples':
    case 'presets':
    case 'mainMix':
    case 'stems':
    case 'contents':
      return 'contents';
    case 'cover':
    case 'demo':
    case 'previewStartMs':
    case 'previewHasProducerTag':
      return 'cover_preview';
    case 'price':
    case 'tiers':
    case 'territories':
    case 'releaseDate':
      return 'license_price';
    case 'attestation':
    case 'evidence':
    case 'licensedMaterial':
    case 'embedsAudio':
    case 'embeddedAudioNote':
    case 'changeNote':
    case 'changes':
      return 'review_submit';
    default:
      return 'details';
  }
}

function issue(field: string, code: keyof typeof VALIDATION_COPY, vars: Record<string, string | number> = {}): ValidationIssue {
  return { step: stepOfField(field), field, code, message: fill(VALIDATION_COPY[code], vars) };
}

/** True when a detected value still needs the seller's confirmation (L13). */
export function needsConfirmation(value: Provenanced<unknown> | undefined): boolean {
  return value !== undefined && value.source === 'analysis' && !value.confirmed;
}

function bpmIsValid(bpm: string): boolean {
  if (!BPM_PATTERN.test(bpm)) return false;
  const n = Number(bpm);
  return n >= BPM_MIN && n <= BPM_MAX;
}

function checkBpm(field: string, bpm: Provenanced<string> | undefined, required: boolean, out: ValidationIssue[]) {
  if (bpm === undefined || bpm.value === '') {
    if (required) out.push(issue(field, 'required', { field: 'a BPM' }));
    return;
  }
  if (!bpmIsValid(bpm.value)) out.push(issue(field, 'bpm_format'));
  else if (needsConfirmation(bpm)) out.push(issue(field, 'confirm_detected'));
}

function checkKey(field: string, key: Provenanced<KeyValue> | undefined, required: boolean, out: ValidationIssue[]) {
  if (key === undefined) {
    if (required) out.push(issue(field, 'required', { field: 'a key, or "No key"' }));
    return;
  }
  if (needsConfirmation(key)) out.push(issue(field, 'confirm_detected'));
}

function hasUrl(text: string): boolean {
  return URL_PATTERN.test(text);
}

function checkCommon(payload: CommonDetails, type: ReleaseType, out: ValidationIssue[]) {
  const title = payload.title.normalize('NFC').trim();
  if (title.length === 0) out.push(issue('title', 'required', { field: 'a title' }));
  else if (title.length < TITLE_MIN || title.length > TITLE_MAX) out.push(issue('title', 'title_length'));
  else if (hasUrl(title)) out.push(issue('title', 'no_urls'));

  const description = payload.description.trim();
  const marketType = type !== 'song';
  if (marketType && description.length < DESCRIPTION_MIN) {
    out.push(issue('description', 'required', { field: `a description of at least ${DESCRIPTION_MIN} characters` }));
  } else if (description.length > DESCRIPTION_MAX) out.push(issue('description', 'description_length'));
  else if (hasUrl(description)) out.push(issue('description', 'no_urls'));

  if (payload.tags.length < 1 || payload.tags.length > 10) out.push(issue('tags', 'tags_count'));
  if (!payload.genre) out.push(issue('genre', 'required', { field: 'a genre' }));

  if (!payload.cover) out.push(issue('cover', 'required', { field: 'a cover' }));
  else if (
    payload.cover.widthPx !== payload.cover.heightPx ||
    payload.cover.widthPx < MIN_COVER_PX
  ) {
    out.push(issue('cover', 'cover_size'));
  }
}

/** Credit-priced packs: range, step, and never above the items bought one by one (CREDITS-MODEL §6.1). */
function checkPackPrice(payload: PresetPackPayload | SamplePackPayload, itemCount: number, unitCredits: number, out: ValidationIssue[]) {
  const range = CREDITS.priceList.pack;
  const credits = payload.price.kind === 'credits' ? payload.price.credits : payload.price.kind === 'free' ? 0 : null;
  if (credits === null) {
    out.push(issue('price', 'required', { field: 'a price' }));
    return;
  }
  if (credits < range.min || credits > range.max || (credits - range.min) % range.step !== 0) {
    out.push(issue('price', 'price_range', { min: range.min, max: range.max, step: range.step }));
    return;
  }
  // Below the type's minimum count the count issue already blocks submit, and the
  // cap is meaningless until the pack has its items (RL §7.4 R5: "Fix 3 things").
  const min = RELEASE_TYPE_INFO[payload.kind].minItems;
  if (itemCount >= min && credits > itemCount * unitCredits) {
    out.push(issue('price', 'price_above_items', { count: itemCount, max: itemCount * unitCredits }));
  }
}

function checkMinCount(field: string, type: ReleaseType, count: number, out: ValidationIssue[]) {
  const min = RELEASE_TYPE_INFO[type].minItems;
  if (count < min) out.push(issue(field, 'min_count', { ...COUNT_NOUNS[type], min, count }));
}

function checkFormats(field: string, files: readonly FileRef[], accepted: readonly string[], label: string, out: ValidationIssue[]) {
  for (const file of files) {
    const ext = extensionOf(file.path);
    if (!accepted.includes(ext)) {
      out.push(issue(field, 'format_not_accepted', { file: fileName(file.path), ext: ext.toUpperCase() || 'a file', accepted: label }));
      return;
    }
  }
}

function checkDuplicates(field: string, files: readonly FileRef[], out: ValidationIssue[]) {
  const seen = new Map<string, string>();
  for (const file of files) {
    const other = seen.get(file.sha256);
    if (other) {
      out.push(issue(field, 'duplicate_in_pack', { file: fileName(file.path), other: fileName(other) }));
      return;
    }
    seen.set(file.sha256, file.path);
  }
}

function checkPreview(field: string, startMs: number, durationMs: number | undefined, out: ValidationIssue[]) {
  if (durationMs === undefined) return;
  if (startMs < 0 || startMs + PREVIEW_CLIP_MS > durationMs) out.push(issue(field, 'preview_range'));
}

function sharesTotal(values: (number | null)[]): number {
  return Math.round(values.reduce<number>((sum, v) => sum + (v ?? 0), 0) * 10) / 10;
}

function checkSong(p: SongPayload, opts: { now: IsoDateTime; releaseDateLocked: boolean }, out: ValidationIssue[]) {
  const writers = p.tracks.length > 0 ? p.tracks[0].credits : [];
  if (!writers.some((c) => c.name.trim() && c.roles.some((r) => r === 'writer' || r === 'composer' || r === 'lyricist'))) {
    out.push(issue('credits', 'required', { field: 'a writer or composer' }));
  }
  if (!writers.some((c) => c.name.trim() && c.roles.some((r) => r === 'performer' || r === 'vocalist' || r === 'producer'))) {
    out.push(issue('credits', 'required', { field: 'a performer or producer' }));
  }
  const master = sharesTotal(writers.map((c) => c.masterSharePct));
  if (writers.length > 0 && master !== 100) out.push(issue('credits.master', 'shares_total', { total: master }));
  const composition = sharesTotal(writers.map((c) => c.compositionSharePct));
  if (writers.length > 0 && composition !== 100) out.push(issue('credits.composition', 'shares_total', { total: composition }));

  if (p.tracks.length < 1) out.push(issue('tracks', 'required', { field: 'a track' }));
  checkFormats('tracks', p.tracks.map((t) => t.audio), ['wav', 'flac'], 'WAV or FLAC', out);
  checkDuplicates('tracks', p.tracks.map((t) => t.audio), out);
  p.tracks.forEach((track, i) => {
    if (!track.title.trim()) out.push(issue(`tracks.${i}.title`, 'required', { field: 'a track title' }));
    else if (track.title.trim().length > TITLE_MAX) out.push(issue(`tracks.${i}.title`, 'title_length'));
    if (!track.language) out.push(issue(`tracks.${i}.language`, 'required', { field: 'a language, or "No lyrics"' }));
    if (track.isrc && !ISRC_PATTERN.test(track.isrc.trim())) out.push(issue(`tracks.${i}.isrc`, 'isrc_format'));
    checkPreview(`tracks.${i}.previewStartMs`, track.previewStartMs, track.audio.durationMs, out);
  });

  if (p.territories.length === 0) out.push(issue('territories', 'required', { field: 'at least one territory' }));
  if (p.price.kind === 'card' && p.price.amount.amountMinor < CREDITS.cardOrderMinEurCents) {
    out.push(issue('price', 'card_price_min'));
  }
  if (p.releaseDate && !opts.releaseDateLocked) {
    const days = (Date.parse(`${p.releaseDate}T00:00:00Z`) - Date.parse(opts.now.slice(0, 10) + 'T00:00:00Z')) / 86_400_000;
    if (Number.isNaN(days) || days < 0 || days > RELEASE_DATE_MAX_DAYS) {
      out.push(issue('releaseDate', 'required', { field: 'a release date from today to a year ahead' }));
    }
  }
}

function checkBeat(p: BeatPayload, out: ValidationIssue[]) {
  checkFormats('mainMix', [p.mainMix], ['wav'], 'WAV', out);
  checkPreview('previewStartMs', p.previewStartMs, p.mainMix.durationMs, out);
  const sellerShare = 100 - sharesTotal(p.coProducers.map((c) => c.masterSharePct));
  if (sellerShare < 0) out.push(issue('coProducers', 'shares_total', { total: 100 - sellerShare }));

  const enabled = p.tiers.filter((t) => t.enabled);
  if (enabled.length === 0) out.push(issue('tiers', 'required', { field: 'at least one lease tier' }));
  const needsStems = enabled.some((t) => t.tier !== 'wav');
  if (needsStems && p.stems.length < 2) out.push(issue('stems', 'stems_needed'));
  else if (p.stems.length > 0) checkFormats('stems', p.stems, ['wav'], 'WAV', out);

  for (const tier of enabled) {
    const range = CREDITS.beatTiers[tier.tier];
    const eur = tier.price.amountMinor / 100;
    if (range.maxEur === null) {
      if (eur < range.minEur) out.push(issue(`tiers.${tier.tier}.price`, 'tier_price_min', { min: range.minEur }));
    } else if (eur < range.minEur || eur > range.maxEur) {
      out.push(issue(`tiers.${tier.tier}.price`, 'tier_price_range', { min: range.minEur, max: range.maxEur, tier: range.label }));
    }
  }
  const first = enabled[0];
  if (first) {
    if (first.producerPublishingSharePct < 0 || first.producerPublishingSharePct > 100) {
      out.push(issue('tiers.publishing', 'shares_total', { total: first.producerPublishingSharePct }));
    }
    if (!first.creditLine.trim()) out.push(issue('tiers.creditLine', 'required', { field: 'a credit line' }));
    else if (first.creditLine.length > 80) out.push(issue('tiers.creditLine', 'title_length'));
  }
}

function checkPresetPack(p: PresetPackPayload, out: ValidationIssue[]) {
  if (!p.minSynthVersion.trim()) out.push(issue('minSynthVersion', 'required', { field: 'the minimum synth version' }));
  if (p.categories.length === 0) out.push(issue('categories', 'required', { field: 'at least one category' }));
  checkMinCount('presets', 'preset_pack', p.presets.length, out);
  const ext = SYNTH_EXTENSION[p.synth];
  checkFormats('presets', p.presets, [ext], p.synth === 'serum2' ? '.SerumPreset files for Serum 2' : '.vital files for Vital', out);
  const names = new Set<string>();
  for (const preset of p.presets) {
    const name = fileName(preset.path).toLowerCase();
    if (names.has(name)) {
      out.push(issue('presets', 'duplicate_in_pack', { file: fileName(preset.path), other: fileName(preset.path) }));
      break;
    }
    names.add(name);
  }
  if (!p.demo) out.push(issue('demo', 'demo_needed'));
  checkPackPrice(p, p.presets.length, CREDITS.priceList.preset, out);
}

function checkSamplePack(p: SamplePackPayload, out: ValidationIssue[]) {
  checkMinCount('samples', 'sample_pack', p.samples.length, out);
  checkFormats('samples', p.samples, ['wav', 'aif', 'aiff', 'flac'], 'WAV, AIFF or FLAC', out);
  checkDuplicates('samples', p.samples, out);
  checkPackPrice(p, p.samples.length, CREDITS.priceList.oneShot, out);
}

/** Issues on the first five steps: the release's own fields. */
export function validatePayload(
  payload: ReleasePayload,
  opts: { now: IsoDateTime; releaseDateLocked?: boolean },
): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  checkCommon(payload, payload.kind, out);
  const bpmRequired = payload.kind === 'beat';
  checkBpm('bpm', payload.bpm, bpmRequired, out);
  checkKey('key', payload.key, payload.kind === 'beat', out);
  switch (payload.kind) {
    case 'song':
      checkSong(payload, { now: opts.now, releaseDateLocked: opts.releaseDateLocked ?? false }, out);
      break;
    case 'beat':
      checkBeat(payload, out);
      break;
    case 'preset_pack':
      checkPresetPack(payload, out);
      break;
    case 'sample_pack':
      checkSamplePack(payload, out);
      break;
    default:
      break;
  }
  return out;
}

function attestationComplete(a: Attestation | null | undefined): boolean {
  return Boolean(a && a.madeByMe && a.noGeneratedAudio && a.licensedMaterialListed && a.coverRights && a.falseStatementConsequences);
}

/** Evidence counts when the project has a DAW session or the seller explained how it was made (§3.1, §5.7). */
function evidenceSufficient(evidence: ProvenanceEvidence | null | undefined, type: ReleaseType): boolean {
  if (RELEASE_TYPE_INFO[type].evidence === 'none') return true;
  if (!evidence) return false;
  return evidence.dawSessions.length > 0 || Boolean(evidence.howMadeNote?.trim());
}

export interface SubmissionContext {
  now: IsoDateTime;
  attestation: Attestation | null;
  evidence: ProvenanceEvidence | null;
  /** Updates only: the change note and whether anything changed. */
  update?: { changeNote: string | null; hasChanges: boolean };
  releaseDateLocked?: boolean;
}

/** Everything that blocks "Submit for review", in step order (§5.2: "Fix {n} things to submit"). */
export function validateSubmission(payload: ReleasePayload, ctx: SubmissionContext): ValidationIssue[] {
  const out = validatePayload(payload, { now: ctx.now, releaseDateLocked: ctx.releaseDateLocked });
  if (payload.kind !== 'theme') {
    payload.licensedMaterial.forEach((entry, i) => {
      if (!entry.description.trim() || !entry.source.trim() || !entry.licence.trim()) {
        out.push(issue(`licensedMaterial.${i}`, 'required', { field: 'a description, source and licence' }));
      }
    });
  }
  if (payload.kind === 'preset_pack') {
    if (payload.embedsAudio === null) out.push(issue('embedsAudio', 'required', { field: 'whether the presets embed audio' }));
    else if (payload.embedsAudio && !payload.embeddedAudioNote?.trim()) {
      out.push(issue('embeddedAudioNote', 'required', { field: 'what the presets embed and where it came from' }));
    }
  }
  if (!evidenceSufficient(ctx.evidence, payload.kind)) out.push(issue('evidence', 'evidence_needed'));
  if (!attestationComplete(ctx.attestation)) out.push(issue('attestation', 'attestation_needed'));
  if (ctx.update) {
    if (!ctx.update.hasChanges) out.push(issue('changes', 'nothing_changed'));
    const note = ctx.update.changeNote?.trim() ?? '';
    if (note.length < CHANGE_NOTE_MIN || note.length > CHANGE_NOTE_MAX) out.push(issue('changeNote', 'change_note_length'));
  }
  const order: WizardStepId[] = ['source', 'details', 'contents', 'cover_preview', 'license_price', 'review_submit'];
  return out.sort((a, b) => order.indexOf(a.step) - order.indexOf(b.step));
}
