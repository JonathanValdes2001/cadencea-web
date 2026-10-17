/**
 * [`prefill.*`] `{level}` is High, Medium or Low (DECISIONS.md D4). The chip
 * labels follow PUBLISH-PROCEDURE §2, which overrides RL's "Detected (confirm)".
 *
 * Its own module, not part of release-lifecycle/copy.ts, because the shared
 * Field component (also used by /login and /signup) reads it, and importing the
 * whole Studio and Publish copy file there would ship that copy, credit
 * wording included, to every production page. release-lifecycle/copy.ts
 * re-exports it, so the Publish components import it from there as before.
 */
export const PREFILL_COPY = {
  fromProject: 'From your project',
  detected: 'Detected, please confirm',
  needsInput: 'Needs your input',
  looksRight: 'Looks right',
  detectedNote: 'Detected by Cadencea · {level} confidence. Check it before you submit.',
} as const;
