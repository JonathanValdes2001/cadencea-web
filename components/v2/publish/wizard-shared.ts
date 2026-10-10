import type { SourceChip } from '@/components/ui/Field';
import { fill } from '@/lib/v2-demo/format';
import type {
  BpmString,
  FileRef,
  KeyValue,
  ProvenanceEvidence,
  Provenanced,
  ReleasePayload,
  ValidationIssue,
  WizardStepId,
} from '@/lib/v2-demo/release-lifecycle/types';
import { needsConfirmation } from '@/lib/v2-demo/release-lifecycle/validation';
import { buildEvidence, type VaultProject } from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

export const STEP_ORDER: readonly WizardStepId[] = ['source', 'details', 'contents', 'cover_preview', 'license_price', 'review_submit'];

/** The element id of a payload field, so a checklist issue can move focus to it. */
export function fieldId(field: string): string {
  return `wf-${field.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

/** What every step gets from the wizard shell. */
export interface StepProps<P extends ReleasePayload = ReleasePayload> {
  payload: P;
  update: (next: ReleasePayload) => void;
  project: VaultProject | null;
  /** The inline error for a field (or, unless `exact`, any field below it), shown once its step is flagged. */
  errorFor: (field: string, exact?: boolean) => string | undefined;
  isUpdate: boolean;
}

export function issueLookup(issues: readonly ValidationIssue[], flagged: ReadonlySet<WizardStepId>) {
  return (field: string, exact = false): string | undefined => {
    const hit = issues.find((i) => flagged.has(i.step) && (i.field === field || (!exact && i.field.startsWith(`${field}.`))));
    return hit?.message;
  };
}

/**
 * The prefill chip (RL §5.2, §5.3): "Detected (confirm)" for an unconfirmed
 * Detect value, with the confidence number only in its tooltip (DECISIONS.md
 * D4); "From your project" when the value is still the project's; "Needs your
 * input" when empty.
 */
export function chipFor<T>(value: Provenanced<T> | undefined, projectValue: Provenanced<T> | undefined): SourceChip | undefined {
  if (value === undefined) return 'needs_input';
  if (needsConfirmation(value)) {
    return value.confidence !== undefined
      ? { kind: 'detected', hint: fill(WIZARD_UI.source.confidence, { value: value.confidence.toFixed(2) }) }
      : 'detected';
  }
  if (projectValue && JSON.stringify(projectValue.value) === JSON.stringify(value.value)) return 'project';
  return undefined;
}

export function textChip(value: string, projectValue: string | undefined): SourceChip | undefined {
  if (!value.trim()) return 'needs_input';
  return projectValue !== undefined && value === projectValue ? 'project' : undefined;
}

/** A value the seller typed: source `user`, confirmed. */
export function userValue<T>(value: T): Provenanced<T> {
  return { value, source: 'user', confirmed: true };
}

/** Sets or clears the pack-level BPM (absent means "not answered"). */
export function setBpm(payload: ReleasePayload, bpm: Provenanced<BpmString> | undefined): ReleasePayload {
  const next = { ...payload };
  if (bpm) next.bpm = bpm;
  else delete next.bpm;
  return next;
}

/** Sets or clears the key; `null` inside the value is "No key", absent is "not answered". */
export function setKey(payload: ReleasePayload, key: Provenanced<KeyValue> | undefined): ReleasePayload {
  const next = { ...payload };
  if (key) next.key = key;
  else delete next.key;
  return next;
}

/** Files a pack step can offer: the project's candidates plus what's already selected. */
export function mergeFiles(...lists: readonly (readonly FileRef[])[]): FileRef[] {
  const byPath = new Map<string, FileRef>();
  for (const list of lists) for (const file of list) if (!byPath.has(file.path)) byPath.set(file.path, file);
  return [...byPath.values()];
}

/** Evidence for submit: captured from the project, else the release's last captured bundle (RL §5.7). */
export function evidenceFor(project: VaultProject | null, fallback: ProvenanceEvidence | null, howMadeNote: string): ProvenanceEvidence | null {
  if (project) return buildEvidence(project, DEMO_NOW, howMadeNote);
  if (!fallback) return null;
  return { ...fallback, howMadeNote: howMadeNote.trim() || fallback.howMadeNote };
}
