'use client';

import React, { useId } from 'react';
import Button from '@/components/ui/Button';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { Alert, Check, Plus, Trash } from '@/components/ui/Icons';
import HumanMadeStandard from '@/components/v2/common/HumanMadeStandard';
import { useMarketLibrary } from '@/lib/v2-demo/credits/store';
import { fill } from '@/lib/v2-demo/format';
import { EVIDENCE_COPY, HUMAN_MADE_COPY, NOTICE_COPY, RIGHTS_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import type { ChangeSummary, LicensedMaterial, ProvenanceEvidence, ValidationIssue, WizardStepId } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { CHANGE_NOTE_MAX } from '@/lib/v2-demo/release-lifecycle/validation';
import { EvidenceSummary } from '@/components/v2/studio/EvidencePanel';
import { fieldLabel, fieldValue, priceText } from '@/components/v2/studio/field-values';
import { fieldId, type StepProps } from './wizard-shared';

const R = WIZARD_UI.review;

/** "{new_price}" for the price notice: the pack or download price, or the changed lease prices. */
function newPriceText(payload: StepProps['payload'], changes: ChangeSummary | null): string {
  if (payload.kind !== 'beat') return priceText(payload.price);
  return (changes?.fields ?? [])
    .filter((f) => f.kind === 'price')
    .map((f) => `${fieldLabel(f.field, payload)} ${fieldValue(f.field, f.after)}`)
    .join(', ');
}

export interface AttestationChecks {
  madeByMe: boolean;
  licensedMaterialListed: boolean;
  coverRights: boolean;
  falseStatementConsequences: boolean;
}

function LicensedMaterialEditor({ entries, onChange, nothingToList, setNothingToList, errorFor }: {
  entries: LicensedMaterial[];
  onChange: (entries: LicensedMaterial[]) => void;
  nothingToList: boolean;
  setNothingToList: (value: boolean) => void;
  errorFor: StepProps['errorFor'];
}) {
  const baseId = useId();
  const library = useMarketLibrary();
  const owned = library.entries.filter((e) => e.returnedAt === null && !entries.some((m) => m.marketOrderItemId === e.key));
  const patch = (i: number, change: Partial<LicensedMaterial>) => onChange(entries.map((m, j) => (j === i ? { ...m, ...change } : m)));
  return (
    <div className="ml-8 space-y-3">
      <p className="text-xs text-ink-subtle">{R.licensedHint}</p>
      <CheckboxField
        id={`${baseId}-nothing`}
        label={HUMAN_MADE_COPY.checkboxes.nothingToList}
        checked={nothingToList}
        onChange={(e) => {
          setNothingToList(e.target.checked);
          if (e.target.checked) onChange([]);
        }}
      />
      {!nothingToList && (
        <>
          {entries.map((entry, i) => (
            <div key={i} id={fieldId(`licensedMaterial.${i}`)} tabIndex={-1} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-3">
              <TextField id={`${baseId}-${i}-d`} label={R.licensedDescription} value={entry.description} onChange={(e) => patch(i, { description: e.target.value })} />
              <TextField id={`${baseId}-${i}-s`} label={R.licensedSource} value={entry.source} onChange={(e) => patch(i, { source: e.target.value })} />
              <TextField id={`${baseId}-${i}-l`} label={R.licensedLicence} value={entry.licence} onChange={(e) => patch(i, { licence: e.target.value })} />
              {errorFor(`licensedMaterial.${i}`) && <p className="text-xs font-medium text-danger sm:col-span-3">{errorFor(`licensedMaterial.${i}`)}</p>}
              <div className="sm:col-span-3">
                <Button size="sm" variant="ghost" iconLeft={<Trash size={16} />} onClick={() => onChange(entries.filter((_, j) => j !== i))}>
                  {R.remove}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-3">
            <Button size="sm" variant="secondary" iconLeft={<Plus size={16} />} onClick={() => onChange([...entries, { description: '', source: '', licence: '', marketOrderItemId: null }])}>
              {R.addLicensed}
            </Button>
            {owned.length > 0 && (
              <div className="min-w-56">
                <SelectField
                  id={`${baseId}-market`}
                  label={R.fromPurchases}
                  value=""
                  onChange={(e) => {
                    const item = owned.find((o) => o.key === e.target.value);
                    if (item) onChange([...entries, { description: item.title, source: R.marketSource, licence: R.marketLicence, marketOrderItemId: item.key }]);
                  }}
                  options={[{ value: '', label: R.fromPurchasesPlaceholder }, ...owned.map((o) => ({ value: o.key, label: o.title }))]}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Step 6, "Review, Human-Made and submit" (RL §5.2, §5.6, §5.7, §9.7): every
 * open issue as a link to its field, the change note and inline notices for
 * updates, the Human-Made Standard and attestation, licensed material, the
 * evidence summary with its privacy promises, and the rights text.
 */
export default function ReviewSubmitStep({
  payload,
  update,
  errorFor,
  isUpdate,
  issues,
  stepLabel,
  onGoTo,
  attestation,
  setAttestation,
  nothingToList,
  setNothingToList,
  evidence,
  howMadeNote,
  setHowMadeNote,
  changeNote,
  setChangeNote,
  changes,
}: StepProps & {
  issues: readonly ValidationIssue[];
  stepLabel: (step: WizardStepId) => string;
  onGoTo: (issue: ValidationIssue) => void;
  attestation: AttestationChecks;
  setAttestation: (next: AttestationChecks) => void;
  nothingToList: boolean;
  setNothingToList: (value: boolean) => void;
  evidence: ProvenanceEvidence | null;
  howMadeNote: string;
  setHowMadeNote: (value: string) => void;
  changeNote: string;
  setChangeNote: (value: string) => void;
  changes: ChangeSummary | null;
}) {
  const baseId = useId();
  const presets = payload.kind === 'preset_pack';
  const box = (key: keyof AttestationChecks, label: string) => (
    <CheckboxField id={`${baseId}-${key}`} label={label} checked={attestation[key]} onChange={(e) => setAttestation({ ...attestation, [key]: e.target.checked })} />
  );
  const kinds = new Set(changes?.kinds ?? []);
  const tracksRemoved = changes?.fields.some((f) => f.field === 'tracks' && Array.isArray(f.before) && Array.isArray(f.after) && f.after.length < f.before.length);
  const notices = isUpdate
    ? [
        kinds.has('price') ? fill(NOTICE_COPY.priceChange, { new_price: newPriceText(payload, changes) }) : null,
        kinds.has('license') ? NOTICE_COPY.termsChange : null,
        kinds.has('cover') ? NOTICE_COPY.coverReview : null,
        kinds.has('audio') && payload.kind === 'song' ? NOTICE_COPY.audioReplace : null,
        tracksRemoved ? NOTICE_COPY.trackRemoved : null,
        payload.kind !== 'song' ? NOTICE_COPY.ownersUpdate : null,
      ].filter((n): n is string => Boolean(n))
    : [];
  const noDaw = evidence !== null && evidence.dawSessions.length === 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby={`${baseId}-issues`}>
        {issues.length > 0 ? (
          <div className="rounded-md border border-tone-warning bg-tone-warning-bg p-4">
            <h3 id={`${baseId}-issues`} className="flex items-center gap-2 text-sm font-semibold text-tone-warning">
              <Alert size={16} />
              {R.issuesTitle}
            </h3>
            <ul className="mt-2 space-y-1">
              {issues.map((issue, i) => (
                <li key={`${issue.field}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onGoTo(issue)}
                    className="min-h-11 text-left text-sm text-ink underline underline-offset-2 hover:no-underline"
                  >
                    <span className="font-medium">{stepLabel(issue.step)}:</span> {issue.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p id={`${baseId}-issues`} className="flex items-center gap-2 rounded-md bg-tone-success-bg px-4 py-3 text-sm font-medium text-tone-success">
            <Check size={16} />
            {R.ready}
          </p>
        )}
      </section>

      {isUpdate && (
        <section className="space-y-3">
          <TextAreaField
            id={fieldId('changeNote')}
            label={R.changeNote}
            hint={`${R.changeNoteHint} ${changeNote.length} / ${CHANGE_NOTE_MAX}`}
            value={changeNote}
            maxLength={CHANGE_NOTE_MAX + 50}
            rows={3}
            error={errorFor('changeNote')}
            onChange={(e) => setChangeNote(e.target.value)}
          />
          {notices.map((notice) => (
            <p key={notice} className="flex gap-2 rounded-sm bg-tone-update-bg px-3 py-2 text-sm text-tone-update">
              <Alert size={16} className="mt-0.5 shrink-0" />
              {notice}
            </p>
          ))}
        </section>
      )}

      <section className="space-y-5">
        <HumanMadeStandard headingLevel="h3" />
        <fieldset id={fieldId('attestation')} tabIndex={-1} className="space-y-3">
          <legend className="sr-only">{HUMAN_MADE_COPY.title}</legend>
          {errorFor('attestation') && <p className="text-xs font-medium text-danger">{errorFor('attestation')}</p>}
          {box('madeByMe', presets ? HUMAN_MADE_COPY.checkboxes.madeByMePresets : HUMAN_MADE_COPY.checkboxes.madeByMe)}
          {box('licensedMaterialListed', HUMAN_MADE_COPY.checkboxes.licensedListed)}
          <LicensedMaterialEditor
            entries={payload.kind === 'theme' ? [] : payload.licensedMaterial}
            onChange={(licensedMaterial) => payload.kind !== 'theme' && update({ ...payload, licensedMaterial })}
            nothingToList={nothingToList}
            setNothingToList={setNothingToList}
            errorFor={errorFor}
          />
          {box('coverRights', HUMAN_MADE_COPY.checkboxes.coverRights)}
          {box('falseStatementConsequences', HUMAN_MADE_COPY.checkboxes.consequences)}
        </fieldset>
      </section>

      {payload.kind === 'preset_pack' && (
        <fieldset id={fieldId('embedsAudio')} tabIndex={-1} className="space-y-3">
          <legend className="text-sm font-semibold text-ink">{R.embedsAudio}</legend>
          {errorFor('embedsAudio', true) && <p className="text-xs font-medium text-danger">{errorFor('embedsAudio', true)}</p>}
          <div className="flex gap-4">
            {[true, false].map((value) => (
              <label key={String(value)} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name={`${baseId}-embeds`}
                  checked={payload.embedsAudio === value}
                  onChange={() => update({ ...payload, embedsAudio: value, embeddedAudioNote: value ? payload.embeddedAudioNote : null })}
                  className="h-5 w-5 accent-[var(--color-accent)]"
                />
                {value ? WIZARD_UI.contents.yes : WIZARD_UI.contents.no}
              </label>
            ))}
          </div>
          {payload.embedsAudio && (
            <TextAreaField
              id={fieldId('embeddedAudioNote')}
              label={R.embedsNote}
              rows={2}
              value={payload.embeddedAudioNote ?? ''}
              error={errorFor('embeddedAudioNote')}
              onChange={(e) => update({ ...payload, embeddedAudioNote: e.target.value || null })}
            />
          )}
        </fieldset>
      )}

      <section className="rounded-md border border-line p-4">
        <h3 className="text-base font-semibold text-ink">{EVIDENCE_COPY.title}</h3>
        <div className="mt-2">
          {evidence ? <EvidenceSummary evidence={evidence} type={payload.kind} /> : <p className="text-sm text-ink-muted">{EVIDENCE_COPY.noDawSession}</p>}
        </div>
        {(noDaw || !evidence) && (
          <div className="mt-3">
            <TextAreaField
              id={fieldId('evidence')}
              label={R.howMade}
              rows={2}
              value={howMadeNote}
              error={errorFor('evidence')}
              onChange={(e) => setHowMadeNote(e.target.value)}
            />
          </div>
        )}
      </section>

      <p className="text-sm leading-relaxed text-ink-muted">{payload.kind === 'song' ? RIGHTS_COPY.song : RIGHTS_COPY.market}</p>
    </div>
  );
}
