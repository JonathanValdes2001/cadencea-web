import React from 'react';
import { Shield } from '@/components/ui/Icons';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { EVIDENCE_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { dawWithArticle } from '@/lib/v2-demo/release-lifecycle/options';
import type { ProvenanceEvidence, ReleaseType } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

/** "71 files, an Ableton Live session, 12 stems, started 20 May 2026" (or "71 files and a Logic Pro session"). */
export function evidenceContents(evidence: ProvenanceEvidence, daw: string): string {
  const count = evidence.manifest.length;
  const files = count === 1 ? EVIDENCE_COPY.oneFile : fill(EVIDENCE_COPY.files, { n: count });
  const session = fill(EVIDENCE_COPY.session, { daw });
  const stems =
    evidence.stemCount > 0
      ? evidence.stemCount === 1
        ? EVIDENCE_COPY.oneStem
        : fill(EVIDENCE_COPY.stems, { n: evidence.stemCount })
      : null;
  const contents = stems ? `${files}, ${session}, ${stems}` : `${files} and ${session}`;
  return evidence.projectCreatedAt
    ? `${contents}, ${fill(EVIDENCE_COPY.started, { date: formatDate(evidence.projectCreatedAt) })}`
    : contents;
}

/** The evidence summary and its privacy promises (RL §5.7, §9.7). Only reviewers see the bundle itself. */
export function EvidenceSummary({
  evidence,
  type,
  reviewedAt = null,
}: {
  evidence: ProvenanceEvidence;
  type: ReleaseType;
  /** The approval date of the live version, for the song footer. */
  reviewedAt?: string | null;
}) {
  const session = evidence.dawSessions[0];
  return (
    <div className="text-sm leading-relaxed text-ink-muted">
      {session ? (
        <p>
          {fill(EVIDENCE_COPY.body, { contents: evidenceContents(evidence, dawWithArticle(session.daw)) })}
        </p>
      ) : (
        <p>{EVIDENCE_COPY.noDawSession}</p>
      )}
      {evidence.howMadeNote && <p className="mt-2 italic">“{evidence.howMadeNote}”</p>}
      <ul className="mt-3 space-y-1.5">
        {EVIDENCE_COPY.promises.map((line) => (
          <li key={line} className="flex gap-2">
            <Shield size={16} className="mt-0.5 shrink-0 text-brand-700" />
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-subtle">
        {type === 'song'
          ? fill(EVIDENCE_COPY.footerSong, { date: reviewedAt ? formatDate(reviewedAt) : DETAIL_UI.approvalDate })
          : EVIDENCE_COPY.footerMarket}
      </p>
    </div>
  );
}

export default function EvidencePanel({
  evidence,
  type,
  reviewedAt,
}: {
  evidence: ProvenanceEvidence | null;
  type: ReleaseType;
  reviewedAt: string | null;
}) {
  return (
    <section aria-labelledby="evidence-heading" className="rounded-md border border-line p-4">
      <h2 id="evidence-heading" className="text-base font-semibold text-ink">
        {EVIDENCE_COPY.title}
      </h2>
      <div className="mt-2">
        {evidence ? <EvidenceSummary evidence={evidence} type={type} reviewedAt={reviewedAt} /> : <p className="text-sm text-ink-muted">{DETAIL_UI.noEvidence}</p>}
      </div>
    </section>
  );
}
