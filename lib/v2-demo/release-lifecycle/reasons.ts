/**
 * Reason codes (RELEASE-LIFECYCLE §4.11): the seller-facing title, the fix hint
 * and the decisions each code is typically used for. The Demo reviewer offers
 * the codes that fit the decision it is making.
 */
import type { ReasonCode, ReasonItem } from './types.ts';

export type ReasonDecision = 'changes' | 'reject' | 'suspend' | 'remove';

export interface ReasonInfo {
  title: string;
  /** null where the doc has no hint ("—"). */
  hint: string | null;
  decisions: readonly ReasonDecision[];
}

export const REASON_COPY: Readonly<Record<ReasonCode, ReasonInfo>> = {
  files_missing: { title: 'Some files are missing', hint: 'Push your project, then pick the files again', decisions: ['changes'] },
  files_changed_since_submit: { title: 'Files changed after you submitted', hint: "Resubmit so we review the files you'll sell", decisions: ['changes'] },
  format_not_accepted: { title: "A file format isn't accepted", hint: 'Use WAV, AIFF or FLAC for samples; WAV or FLAC for songs; WAV for beats', decisions: ['changes'] },
  below_minimum_count: { title: 'Not enough items in the pack', hint: 'Add items to reach the minimum', decisions: ['changes'] },
  demo_missing: { title: 'Add an audio demo', hint: 'Buyers need to hear presets or MIDI before buying', decisions: ['changes'] },
  preview_segment_invalid: { title: "The preview doesn't fit the track", hint: 'Pick a start point at least 30 seconds before the end', decisions: ['changes'] },
  metadata_inaccurate: { title: "BPM, key or details don't match the audio", hint: 'Check the detected values and correct them', decisions: ['changes'] },
  misleading_metadata: { title: 'Title or tags could mislead buyers', hint: "Remove other artists' names and unrelated tags", decisions: ['changes'] },
  cover_art_quality: { title: 'Cover art needs work', hint: 'Use a square image of at least 1400 × 1400 px', decisions: ['changes'] },
  cover_art_rights: { title: "We can't confirm rights to the cover art", hint: 'Use original art with no third-party logos, characters or trademarks', decisions: ['changes', 'reject'] },
  synth_version_mismatch: { title: "Presets don't match the synth or version", hint: 'Name the right synth and minimum version', decisions: ['changes'] },
  embedded_audio_undisclosed: { title: "Presets contain audio you didn't mention", hint: 'Describe embedded wavetables or samples and confirm rights', decisions: ['changes'] },
  credits_incomplete: { title: 'Credits or splits are incomplete', hint: 'Add every writer and performer; shares must total 100%', decisions: ['changes'] },
  splits_invalid: { title: "Split terms can't be used", hint: 'Use the standard Splits options', decisions: ['changes'] },
  isrc_invalid: { title: 'An ISRC is invalid or reused', hint: 'Check the code or leave it empty', decisions: ['changes'] },
  explicit_flag_wrong: { title: 'The explicit label is wrong', hint: 'Mark tracks with explicit lyrics as explicit', decisions: ['changes'] },
  price_out_of_range: { title: 'Price is outside the allowed range', hint: 'See the allowed range for this type', decisions: ['changes'] },
  lease_terms_invalid: { title: 'Lease terms conflict', hint: 'Turn on the tiers whose files you provided', decisions: ['changes'] },
  new_recording_needs_new_release: { title: 'This is a different recording', hint: 'Publish it as a new release', decisions: ['reject'] },
  evidence_insufficient: { title: 'We need more evidence the release is human-made', hint: 'Add the DAW session, stems or a short note on how you made it', decisions: ['changes'] },
  uncleared_samples: { title: 'Material you may not have rights to', hint: "List and license every sample you didn't make, or remove it", decisions: ['changes', 'reject'] },
  duplicate_content: { title: 'These files are already on Cadencea', hint: "If they're yours, appeal and tell us where else they're published", decisions: ['reject'] },
  human_made_violation: { title: "This doesn't meet the Human-Made Standard", hint: null, decisions: ['reject', 'remove'] },
  impersonation: { title: 'This release impersonates someone', hint: null, decisions: ['reject', 'remove'] },
  copyright_claim: { title: 'A rights holder says this infringes their work', hint: 'Appeal or send a counter-notice', decisions: ['suspend', 'remove'] },
  legal_order: { title: 'Removed because of a legal order', hint: null, decisions: ['remove'] },
  other: { title: 'Other reason', hint: 'Free text required', decisions: ['changes', 'reject', 'suspend', 'remove'] },
};

/** The codes offered for a decision, in §4.11 order. */
export function reasonCodesFor(decision: ReasonDecision): ReasonCode[] {
  return (Object.keys(REASON_COPY) as ReasonCode[]).filter((code) => REASON_COPY[code].decisions.includes(decision));
}

/** A reason item with the code's fix hint as its message (the Demo reviewer's starting text). */
export function reasonItem(code: ReasonCode, message?: string): ReasonItem {
  return { code, message: message ?? REASON_COPY[code].hint ?? REASON_COPY[code].title };
}
