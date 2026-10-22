/**
 * Release UI strings from docs/v2/RELEASE-LIFECYCLE.md §9 (plus the §6.1 tab and
 * §5.2 step labels), keyed like the doc's [keys]. Fill "{name}" placeholders with
 * `fill()` from ../format.ts. Where the doc offers alternatives ("{A / B}" or
 * "(Songs: …)"), each alternative is its own full string here.
 *
 * The strings carry no demo markers: the web adds " (demo)" to confirm buttons
 * and "Demo: " to toasts in one place (RL §9, WEB-V2-SPEC §2.5).
 * Copy rule (RL §7.6): "free" appears only in "royalty-free" and "Free up space".
 */
import type {
  PrimaryChipId,
  ReleaseType,
  SecondaryChipId,
  StudioTab,
  WizardStepId,
} from './types.ts';

/* §9.1 Status chips and hints ------------------------------------------ */

export const CHIP_COPY: Readonly<Record<PrimaryChipId | SecondaryChipId, { label: string; hint: string }>> = {
  draft: { label: 'Draft', hint: "Only you can see this. Submit it when it's ready." },
  in_review: { label: 'In review', hint: 'A person at Cadencea is checking it. We aim to finish within 2 working days.' },
  changes_requested: { label: 'Needs changes', hint: 'We need a few fixes before it can go live.' },
  rejected: { label: 'Rejected', hint: "This release can't go live. See why, and how to appeal." },
  scheduled: { label: 'Scheduled', hint: 'Approved. It goes live on {date}.' },
  live: { label: 'Live', hint: 'On sale in the Market.' },
  unpublished: { label: 'Unpublished', hint: 'Off sale. Buyers keep what they bought. You can relist it.' },
  sold_exclusive: { label: 'Sold exclusively', hint: 'You sold the exclusive license, so this beat is off sale for good.' },
  removed: { label: 'Removed', hint: 'Cadencea took this release down. See why, and how to appeal.' },
  suspended: { label: 'On hold', hint: 'Hidden while we look into a report. Buyers keep access.' },
  update_draft: { label: 'Update draft', hint: "Your changes aren't submitted yet. Version {n} stays live." },
  update_in_review: { label: 'Update in review', hint: 'Version {n} stays live until we approve version {next}.' },
  update_changes_requested: { label: 'Update needs changes', hint: 'Version {n} stays live. Fix the update and resubmit.' },
  update_appealed: { label: 'Update appealed', hint: 'A different reviewer is looking at your appeal. Version {n} stays live.' },
  appeal_in_progress: { label: 'Appeal in progress', hint: 'A different reviewer is looking at your appeal.' },
};

/** The `live` hint for songs. */
export const CHIP_LIVE_SONG_HINT = 'Streaming on Cadencea Stream.';

/** [`version.*`] */
export const VERSION_COPY = {
  live: 'v{n} live',
  liveUpdateInReview: 'v{n} live · v{next} in review',
  liveUpdateDraft: 'v{n} live · update draft',
  revision: 'Revision #{seq}',
  notLive: 'Not live yet',
  liveSince: 'Live since {date} · v{n}',
} as const;

/** [`public.*`] Buyer and listener labels. */
export const PUBLIC_COPY = {
  versionUpdated: 'Version {n} · Updated {date}',
  whatsNew: "What's new in version {n}",
  youOwn: 'You own version {k}.',
  downloadVersion: 'Download version {k}',
  versionIncluded: 'Version {n} is included with your purchase.',
  humanMade: 'Human-made · Reviewed by Cadencea',
  reviewedOn: 'Reviewed by Cadencea on {date}',
  madeIn: 'Made in {daw}',
  stems: '{count} stems',
  whatThisMeans: 'What this means',
  marketUnavailable: "This release is no longer on sale. If you bought it, it's still in your library.",
  streamUnavailable: "This release isn't available right now.",
} as const;

/* §9.2 Release detail banners [`banner.*`] ------------------------------- */

export interface BannerCopy {
  title: string;
  body: string;
  /** The "(Songs: …)" or "(If downloads are disabled: …)" alternative. */
  bodyAlt?: string;
  actions: readonly string[];
}

export const BANNER_COPY = {
  draft: { title: 'Not submitted yet', body: 'Finish the details, then submit for review.', actions: ['Continue editing', 'Delete draft'] },
  in_review_queued: {
    title: 'In review',
    body: "A person at Cadencea will check your files, details and project. It isn't public yet. You can move it back to draft until the review starts.",
    actions: ['Move back to draft'],
  },
  in_review_started: {
    title: 'Review started',
    body: "A reviewer is checking it now. We'll let you know when there's a decision.",
    actions: [],
  },
  needs_changes_first: {
    title: 'A few changes needed',
    body: 'Not live yet. The reviewer asked for the changes below.',
    actions: ['Fix and resubmit'],
  },
  rejected_first: {
    title: "We didn't approve this release",
    body: 'See the reasons below. You can appeal once, until {date}.',
    actions: ['Read the reasons', 'Appeal'],
  },
  scheduled: { title: 'Scheduled', body: 'Approved. It goes live on {date}.', actions: ['Edit release', 'Unpublish'] },
  live: { title: 'Live', body: 'Version {n} has been live since {date}.', actions: ['Edit release', 'Unpublish'] },
  live_update_draft: {
    title: 'Update not submitted',
    body: "Version {n} stays live. Submit your changes when they're ready.",
    actions: ['Continue update', 'Withdraw update'],
  },
  live_update_in_review: {
    title: 'Update in review',
    body: "Version {next} is waiting for review. Buyers keep getting version {n} until it's approved.",
    bodyAlt: "Version {next} is waiting for review. Listeners keep hearing version {n} until it's approved.",
    actions: ['View update', 'Withdraw update'],
  },
  live_update_needs_changes: {
    title: 'Your update needs changes',
    body: 'Version {n} is still live. The reviewer asked for the changes below.',
    actions: ['Fix update', 'Withdraw update'],
  },
  live_update_rejected: {
    title: "We didn't approve your update",
    body: 'Version {n} is still live and nothing changed for buyers. You can appeal until {date}, or start a new update.',
    actions: ['Read the reasons', 'Appeal', 'Edit release'],
  },
  live_update_appealed: {
    title: 'Appeal in progress',
    body: 'A different reviewer is looking at your update. Version {n} stays live meanwhile.',
    actions: ['View appeal'],
  },
  unpublished_seller: {
    title: 'Unpublished',
    body: 'You took this release off sale on {date}. Everyone who bought it keeps their files and license.',
    actions: ['Relist', 'Edit release'],
  },
  unpublished_storage: {
    title: 'Off sale: over your storage limit',
    body: "Your plan's storage is full, so we took the oldest releases off sale. Free up space or upgrade, then relist.",
    actions: ['Free up space', 'Relist'],
  },
  sold_exclusive: {
    title: 'Sold exclusively',
    body: "You sold the exclusive license on {date}. This beat can't be relisted. Earlier lease holders keep their rights.",
    actions: [],
  },
  removed: {
    title: 'Removed by Cadencea',
    body: 'We removed this release on {date}. See the reasons below. You can appeal until {appealDate}.',
    actions: ['Read the reasons', 'Appeal'],
  },
  on_hold: {
    title: 'On hold',
    body: "We're looking into a report. It's hidden from the Market and new sales are paused. Buyers keep access. Earnings from it are on hold.",
    bodyAlt:
      "We're looking into a report. It's hidden from the Market and new sales are paused. Buyers keep access. Earnings from it are on hold. Downloads are paused because of a legal notice.",
    actions: ['Read the reasons', 'Appeal'],
  },
  publishing_delayed: {
    title: 'Taking longer than usual',
    body: "Your release is approved and we're finishing the upload. Nothing for you to do.",
    actions: [],
  },
} as const satisfies Record<string, BannerCopy>;

/* §9.3 Empty states [`empty.*`], Studio callout, coming-later, prices ------ */

export const EMPTY_COPY = {
  all: {
    title: 'Nothing published yet',
    body: 'Turn a Vault project into a release. Cadencea fills in what your project already knows.',
    action: 'Publish something',
  },
  drafts: {
    title: 'No drafts',
    body: 'Start a release and save it as a draft to finish later. Unsent updates show up here too.',
    action: 'Publish something',
  },
  in_review: { title: 'Nothing in review', body: 'New releases wait here while a person at Cadencea checks them.' },
  live: { title: 'Nothing live yet', body: 'Approved releases show up here.' },
  update_in_review: {
    title: 'No updates in review',
    body: 'When you edit a live release, the live version stays up while we review your changes.',
  },
  needs_changes: { title: 'Nothing needs changes', body: "If a reviewer asks for fixes, you'll find them here." },
  rejected_unpublished: {
    title: 'Nothing here',
    body: "Releases you take off sale, and ones we couldn't approve, show up here.",
  },
  filters: { title: 'No releases match', body: 'Try another search or clear the filters.', action: 'Clear filters' },
  vault_preview: {
    title: 'Nothing published from this project yet',
    body: "Check what's ready, then continue on the web.",
  },
  stream_studio: {
    title: 'No songs yet',
    body: 'Publish a song from Cadencea Vault or the web. It goes live after a person at Cadencea reviews it.',
    action: 'Publish on the web',
  },
} as const;

/** [`studio.attention`] */
export const STUDIO_COPY = {
  attention: '{n} releases need your attention',
  attentionOne: '1 release needs your attention',
  showThem: 'Show them',
} as const;

/** §6.1 tab labels. */
export const STUDIO_TAB_LABEL: Readonly<Record<StudioTab, string>> = {
  all: 'All',
  drafts: 'Drafts',
  in_review: 'In review',
  live: 'Live',
  update_in_review: 'Update in review',
  needs_changes: 'Needs changes',
  rejected_unpublished: 'Rejected & unpublished',
};

/** [`publish.coming_later`] */
export const COMING_LATER_COPY = {
  title: '{Type}: coming later',
  body: 'Coming later. This preview publishes songs, beats, preset packs and sample packs.',
  back: 'Back to Publish',
} as const;

/** [`price.*`] (WEB-V2-SPEC §3.3 `Price` renders these.) */
export const PRICE_COPY = {
  zeroCredits: '0 credits',
  credits: '{credits} credits (€{eur})',
  card: '€{amount}',
  streamOnly: 'On Cadencea Stream',
  splitsTerms: '{publishing}% publishing · {advance}% advances',
} as const;

/* §9.4 Confirmations and inline notices -------------------------------- */

export interface ConfirmCopy {
  title: string;
  body: string;
  /** The "(Songs: …)" alternative. */
  bodyAlt?: string;
  confirm: string;
  cancel: string;
}

export const CONFIRM_COPY = {
  submit_first: {
    title: 'Submit "{title}" for review?',
    body: "A person at Cadencea will check your files, details and project evidence. You can't edit it while it's in review, but you can move it back to draft until the review starts.",
    confirm: 'Submit for review',
    cancel: 'Keep editing',
  },
  submit_update: {
    title: 'Submit this update?',
    body: "Version {n} stays live while we review version {next}. Buyers keep the version they bought, and version {next} is included with their purchase once it's approved.",
    bodyAlt: "Version {n} stays live while we review version {next}. Listeners hear version {next} once it's approved.",
    confirm: 'Submit update',
    cancel: 'Keep editing',
  },
  pull_back: {
    title: 'Move back to draft?',
    body: "It leaves the review queue. You'll need to submit it again.",
    confirm: 'Move back to draft',
    cancel: 'Keep in review',
  },
  resubmit: {
    title: 'Resubmit for review?',
    body: 'Add a note for the reviewer if it helps explain what you changed.',
    confirm: 'Resubmit',
    cancel: 'Keep editing',
  },
  discard_update: {
    title: 'Withdraw this update?',
    body: 'Your changes are deleted. Version {n} stays live.',
    confirm: 'Withdraw update',
    cancel: 'Keep update',
  },
  delete_draft: {
    title: 'Delete this draft?',
    body: "This can't be undone. Your Vault project isn't touched.",
    confirm: 'Delete draft',
    cancel: 'Cancel',
  },
  unpublish: {
    title: 'Unpublish "{title}"?',
    body: "It disappears from the Market and can't be bought. Everyone who bought it keeps their files and license. You can relist it later.",
    confirm: 'Unpublish',
    cancel: 'Cancel',
  },
  unpublish_song: {
    title: 'Unpublish "{title}"?',
    body: "Listeners can't play it anymore, and it leaves Stream. Plays, downloads and earnings so far are kept. You can relist it later.",
    confirm: 'Unpublish',
    cancel: 'Cancel',
  },
  unpublish_scheduled: {
    title: 'Cancel this release?',
    body: '"{title}" won\'t go live on {date}. You can relist it later.',
    confirm: 'Cancel release',
    cancel: 'Keep scheduled',
  },
  relist: {
    title: 'Relist "{title}"?',
    body: "Version {n} goes back on sale right away. It was already approved, so it doesn't need another review.",
    confirm: 'Relist',
    cancel: 'Cancel',
  },
  appeal: {
    title: 'Appeal this decision',
    body: 'Tell us why you think the decision is wrong (at least 20 characters). A different reviewer will decide and explain why. Appealing costs nothing, and you can appeal each decision once.',
    confirm: 'Send appeal',
    cancel: 'Cancel',
  },
} as const satisfies Record<string, ConfirmCopy>;

/** Inline notices in the update wizard, toasts and disabled-action tooltips. */
export const NOTICE_COPY = {
  priceChange: 'New price: {new_price}. It applies to purchases after we approve this update. Past orders keep the price they paid.',
  termsChange:
    'New terms apply only to purchases after we approve this update. Everyone who already bought keeps the terms they accepted.',
  splitsChange:
    'New Splits terms apply only to downloads after approval. Everyone who already has this pack keeps the terms they accepted.',
  audioReplace:
    'Replacing audio is for fixing the same recording, like a clipped master or a wrong bounce. A new mix, new vocals or a remix is a new release.',
  trackRemoved: "Removing a track also removes it from listeners' libraries and playlists.",
  coverReview: 'Cover changes are reviewed too. Your current cover stays up until then.',
  ownersUpdate: 'The approved update is included for people who already own this. They keep the version they bought too.',
  toastUpdateStarted: 'Update started. Version {n} stays live.',
  toastSubmitted: "Submitted for review. We'll let you know when there's a decision.",
  disabled: {
    finishUpdate: 'Finish or withdraw the current update first.',
    onHold: "You can't edit or submit while this release is on hold.",
    alreadyAppealed: 'You already appealed this decision.',
    appealEnded: 'The appeal period ended on {date}.',
  },
} as const;

/* §9.5 Review notices and timeline titles ------------------------------- */

export interface EventCopy {
  noticeTitle?: string;
  noticeBody?: string;
  /** The second "{A / B}" alternative of the notice body. */
  noticeBodyAlt?: string;
  timeline: string;
}

export const EVENT_COPY = {
  submitted: { timeline: 'Submitted for review' },
  pulled_back: { timeline: 'Moved back to draft' },
  resubmitted: { timeline: 'Resubmitted' },
  update_started: { timeline: 'Update started' },
  update_discarded: { timeline: 'Update withdrawn' },
  review_started: { timeline: 'Review started' },
  went_live: {
    noticeTitle: '"{title}" is live',
    noticeBody: 'It passed review and is now on sale in the Market.',
    noticeBodyAlt: 'It passed review and is now streaming on Cadencea Stream.',
    timeline: 'Approved and live (version 1)',
  },
  scheduled: {
    noticeTitle: '"{title}" is approved',
    noticeBody: 'It goes live on {date}.',
    timeline: 'Approved, scheduled for {date}',
  },
  update_went_live: {
    noticeTitle: 'Your update to "{title}" is live',
    noticeBody:
      'Version {n} is now what new buyers get. People who bought earlier versions keep theirs, and this one is included with their purchase.',
    noticeBodyAlt:
      'Version {n} is now what listeners hear. People who bought earlier versions keep theirs, and this one is included with their purchase.',
    timeline: 'Update approved and live (version {n})',
  },
  update_approved: {
    noticeTitle: 'Your update to "{title}" was approved',
    noticeBody: "It's ready for when you relist.",
    timeline: 'Update approved (version {n})',
  },
  changes_requested: {
    noticeTitle: '"{title}" needs a few changes',
    noticeBody: "Nothing is live yet. Here's what to fix: {reasons}.",
    noticeBodyAlt: "Version {n} is still live. Here's what to fix: {reasons}.",
    timeline: 'Changes requested',
  },
  rejected: {
    noticeTitle: 'We didn\'t approve "{title}"',
    noticeBody: '{statement}. You can appeal until {date}.',
    timeline: 'Not approved',
  },
  rejected_update: {
    noticeTitle: 'We didn\'t approve your update to "{title}"',
    noticeBody: 'Version {n} is still live and nothing changed for buyers. {statement}. You can appeal until {date}.',
    timeline: 'Update not approved',
  },
  suspended: {
    noticeTitle: '"{title}" is on hold',
    noticeBody: '{statement}. Buyers keep access. Earnings from it are on hold until we finish.',
    timeline: 'Put on hold',
  },
  reinstated: {
    noticeTitle: '"{title}" is back',
    noticeBody: "We finished looking into the report. It's back on sale.",
    noticeBodyAlt: "We finished looking into the report. It's back in your unpublished releases.",
    timeline: 'Hold lifted',
  },
  removed: {
    noticeTitle: 'We removed "{title}"',
    noticeBody: '{statement}. Buyers keep access unless a legal notice requires otherwise. You can appeal until {date}.',
    timeline: 'Removed by Cadencea',
  },
  unpublished: { timeline: 'Unpublished (by you)' },
  unpublished_storage: { timeline: 'Unpublished (storage limit)' },
  unpublished_account: { timeline: 'Unpublished (account closed)' },
  relisted: { timeline: 'Relisted. No review needed' },
  exclusive_sold: {
    noticeTitle: 'You sold "{title}" exclusively',
    noticeBody: 'The beat is now off sale for good. Earlier lease holders keep their rights.',
    timeline: 'Exclusive license sold',
  },
  appeal_filed: {
    noticeTitle: 'We got your appeal',
    noticeBody: 'A different reviewer will look at it and explain the decision.',
    timeline: 'Appeal sent',
  },
  appeal_upheld: {
    noticeTitle: 'Your appeal was not successful',
    noticeBody: '{statement}. The decision stands.',
    timeline: 'Appeal decided: decision stands',
  },
  appeal_overturned: {
    noticeTitle: 'Your appeal was successful',
    noticeBody: 'We reversed the decision. "{title}" is live.',
    noticeBodyAlt: 'We reversed the decision. Version {n} is live.',
    timeline: 'Appeal decided: decision reversed',
  },
} as const satisfies Record<string, EventCopy>;

/** The third alternative of `appeal_overturned`'s notice body. */
export const APPEAL_OVERTURNED_BACK_ON_SALE = 'We reversed the decision. "{title}" is back on sale.';

/* §9.6 Statement of reasons [`sor.*`] (wording needs lawyer review) ------- */

export const SOR_COPY = {
  heading: {
    notPublished: 'Why we didn\'t publish "{title}"',
    updateNotPublished: 'Why we didn\'t publish your update to "{title}"',
    onHold: 'Why we put "{title}" on hold',
    removed: 'Why we removed "{title}"',
  },
  sections: {
    decided: 'What we decided',
    why: 'Why',
    found: 'What we found',
    rule: 'The rule we applied',
    howFound: 'How this was found',
    whatYouCanDo: 'What you can do',
  },
  reasonLine: '{reasonTitle}: {reasonMessage}',
  restriction: {
    not_published: "We didn't publish this release.",
    update_not_published: "We didn't publish this update. Version {n} is still live.",
    suspended: 'We put this release on hold while we investigate.',
    removed: 'We removed this release from Cadencea.',
    earnings_on_hold: 'Earnings from this release are on hold.',
  },
  groundExamples: {
    humanMade: 'Cadencea Content Policy: Human-Made Standard',
    copyright: 'A copyright notice from {claimant}',
  },
  detection: {
    automated: 'An automated check flagged this for a closer look. A person made the decision.',
    person: 'A person found this during review.',
  },
  options: [
    'Appeal by {date}. A different reviewer will decide and explain why. It costs nothing.',
    'You can also use a certified out-of-court dispute settlement body, or go to court.',
  ],
} as const;

/* §9.7 Human-Made, rights, evidence and Splits -------------------------- */

export const HUMAN_MADE_COPY = {
  title: 'The Human-Made Standard',
  intro: 'Cadencea only publishes music and sounds made by people. Tools that process sound you made are fine.',
  allowedTitle: 'Allowed',
  allowed: [
    'Mixing, mastering, tuning, noise reduction and time-stretching, AI-powered or not',
    'Stem separation of audio you have the rights to',
    'Key, BPM and tag detection',
    'Licensed human-made samples and loops, listed by the creator when they submit (Cadencea Market packs qualify automatically)',
  ],
  notAllowedTitle: 'Not allowed',
  notAllowed: [
    "Generated vocals, and cloning or converting someone else's voice",
    'Generated melodies, chord progressions, beats, stems or lyrics',
    'AI-generated samples, loops, one-shots or presets',
    'Prompt-generated tracks, whole or in part',
  ],
  checkboxes: {
    madeByMe: 'I made this release, and nothing you can hear in it was generated by an AI model.',
    madeByMePresets: 'I designed these presets myself. None were generated by an AI model or by automated search.',
    licensedListed: "Everything in it that I didn't make is licensed to me and listed below.",
    nothingToList: 'Nothing to list',
    coverRights: 'I own or have the rights to the cover art.',
    consequences:
      "I understand that a person reviews it and may ask for changes, and that if any of this isn't true, Cadencea removes the release, holds its earnings and asks for money already paid out to be returned.",
  },
  unsure:
    "Using a voice model trained only on your own voice, samples from a licensed AI generator, or AI songwriting suggestions you rewrote? We haven't decided on these yet. Ask us before you submit.",
} as const;

/** [`rights.*`] */
export const RIGHTS_COPY = {
  market:
    'You keep all your rights. Cadencea is a store and streaming service, not a publisher or label. By submitting, you give Cadencea a non-exclusive license to sell this release under the license you chose. You can unpublish at any time.',
  song: 'You keep all your rights. Cadencea is a store and streaming service, not a publisher or label. By submitting, you give Cadencea a non-exclusive license to stream this release in the territories you chose. You can unpublish at any time.',
} as const;

/** [`evidence.*`] The three promises are [verify] items (RL §9.7). */
export const EVIDENCE_COPY = {
  title: 'Your project is the evidence',
  // RL §9.7's line, assembled from parts so it stays grammatical: "71 files and an
  // Ableton Live session" without stems, "1 stem", and no "started" without a date.
  body: 'To check the Human-Made Standard, we attach your project\'s file list and DAW session from your Vault: {contents}.',
  files: '{n} files',
  oneFile: '1 file',
  stems: '{n} stems',
  oneStem: '1 stem',
  session: '{daw} session',
  started: 'started {date}',
  promises: [
    'Only the Cadencea review team can open it.',
    "It's never shown to buyers or listeners, and never used to train AI.",
    'We delete our copy 90 days after the final decision, unless an appeal or a legal claim needs it longer.',
  ],
  footerSong: 'Listeners see only: reviewed by Cadencea on {date}, the DAW you used and the number of stems.',
  footerMarket: 'Buyers see only: Human-made · Reviewed by Cadencea.',
  noDawSession:
    "We couldn't find a DAW session in this project. Tell us briefly how you made it, for example 'field recordings edited in Audacity'.",
} as const;

/** [`splits.*`] */
export const SPLITS_COPY = {
  badge: 'Royalty-split, not royalty-free',
  sellerSummary:
    'Anyone who releases music using these loops gives you {publishing}% of their producer publishing share, {advance}% of advances and fees, and the credit "{creditLine}". Cadencea generates the paperwork; you both register splits with your own PRO.',
  buyerAck: 'I understand these loops are royalty-split, not royalty-free, and I accept the terms above.',
} as const;

/** [`prefill.*`] Lives in ../prefill-copy.ts so the shared Field component doesn't import this file. */
export { PREFILL_COPY } from '../prefill-copy.ts';

/* §9.8 Wizard labels [`wizard.*`] and §5.2 step labels ------------------- */

type WizardType = Exclude<ReleaseType, 'theme'>;

export const WIZARD_STEP_LABELS: Readonly<Record<WizardType, Readonly<Record<WizardStepId, string>>>> = {
  song: {
    source: 'Project', details: 'Details', contents: 'Tracks', cover_preview: 'Cover and preview',
    license_price: 'Release and price', review_submit: 'Review, Human-Made and submit',
  },
  beat: {
    source: 'Project', details: 'Details', contents: 'Files', cover_preview: 'Cover and preview',
    license_price: 'Leases', review_submit: 'Review, Human-Made and submit',
  },
  preset_pack: {
    source: 'Project', details: 'Details', contents: 'Presets', cover_preview: 'Cover and demo',
    license_price: 'Price and license', review_submit: 'Review, Human-Made and submit',
  },
  sample_pack: {
    source: 'Project', details: 'Details', contents: 'Samples', cover_preview: 'Cover and demo',
    license_price: 'Price and license', review_submit: 'Review, Human-Made and submit',
  },
  splits_pack: {
    source: 'Project', details: 'Details', contents: 'Loops', cover_preview: 'Cover and demo',
    license_price: 'Terms and price', review_submit: 'Review, Human-Made and submit',
  },
  midi_pack: {
    source: 'Project', details: 'Details', contents: 'MIDI files', cover_preview: 'Cover and demo',
    license_price: 'Price and license', review_submit: 'Review, Human-Made and submit',
  },
};

/** What the `details` step adds for songs and beats (§5.2). */
export const WIZARD_DETAILS_EXTRA = { song: 'Credits and splits', beat: 'Co-producers' } as const;

export const WIZARD_COPY = {
  buttons: {
    continue: 'Continue',
    back: 'Back',
    saveDraft: 'Save draft',
    submit: 'Submit for review',
    submitUpdate: 'Submit update',
    fixToSubmit: 'Fix {n} things to submit',
  },
  h1: 'Publish a {type}',
  h1Edit: 'Update {title}',
  typeName: { song: 'song', beat: 'beat', preset_pack: 'preset pack', sample_pack: 'sample pack' },
  source: {
    start: 'Start from a Vault project',
    refresh: 'Refresh from Vault project',
    pushFirst: 'Push your latest changes first. Publishing uses your cloud copy.',
  },
  tiles: {
    song: { title: 'Song', body: 'For listeners on Cadencea Stream, with an optional download sale' },
    beat: { title: 'Beat', body: 'Lease it in four lossless tiers, paid by card' },
    preset_pack: { title: 'Preset pack', body: 'Serum 2 or Vital, at least 15 presets' },
    sample_pack: { title: 'Sample pack', body: 'Royalty-free, at least 20 files' },
    splits_pack: { title: 'Splits pack', body: 'Loops with royalty-split terms' },
    midi_pack: { title: 'MIDI pack', body: 'At least 10 MIDI files, from 10 credits (€1)' },
    theme: { title: 'Theme', body: 'Themes are made by Cadencea for now' },
  },
  comingLaterTitle: 'Coming later',
  requirementsTitle: 'Before you publish',
  reviewDepth: {
    light: 'Light review: details and cover',
    standard: 'Standard review: files and details',
    strict: 'Full review: audio, credits and project evidence',
  },
  earnings: 'Buyers pay {credits} credits (€{eur}). You earn €{earn} per sale.',
} as const;

/* §9.9 Demo copy [`demo.*`] ---------------------------------------------- */

export const DEMO_COPY = {
  notice: 'Preview. Releases, reviews, buyers and earnings here are demo data. Nothing is published, reviewed or charged.',
  reviewerTitle: 'Demo reviewer',
  reviewerSubtitle:
    'In the real Studio, the Cadencea review team makes these decisions. Use these buttons to see what sellers see.',
  simulatedTag: 'Simulated',
  autoApprove: 'Approve new submissions automatically after 3 seconds',
  reset: {
    title: 'Reset demo data?',
    body: 'Every demo release goes back to its starting state. Changes you made in this preview are lost.',
    confirm: 'Reset',
    cancel: 'Cancel',
  },
  vaultHandoff: 'Opens Publish on the web with demo data. Nothing from your project leaves this computer.',
  streamTeaser: {
    manage: 'Manage on the web',
    publishSong: 'Publish a song',
    helper: 'Publishing and edits happen in Cadencea Vault or on the web.',
  },
} as const;
