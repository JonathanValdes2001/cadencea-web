import React from 'react';
import { fill, formatDate } from '@/lib/v2-demo/format';
import { SOR_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { REASON_COPY } from '@/lib/v2-demo/release-lifecycle/reasons';
import type { StatementOfReasons as Statement } from '@/lib/v2-demo/release-lifecycle/types';

const HEADING: Readonly<Record<Statement['restriction'], keyof typeof SOR_COPY.heading>> = {
  not_published: 'notPublished',
  update_not_published: 'updateNotPublished',
  suspended: 'onHold',
  removed: 'removed',
  earnings_on_hold: 'onHold',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{title}</h4>
      <div className="mt-1 text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/**
 * A statement of reasons in RL §9.6's template: what was decided, why, what was
 * found, the rule, how it was found and what the seller can do. Reviewers are
 * never named; a person always made the decision.
 */
export default function StatementOfReasons({
  statement,
  title,
  version,
  canAppeal,
  open = false,
}: {
  statement: Statement;
  /** The release title for the heading. */
  title: string;
  /** The live version, for "Version {n} is still live". */
  version: number | null;
  /** Show "Appeal by {date}" only while the decision can still be appealed. */
  canAppeal: boolean;
  open?: boolean;
}) {
  const ground = statement.ground.kind === 'terms' ? statement.ground.clause : statement.ground.reference;
  return (
    <details open={open} className="rounded-md border border-line bg-canvas">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 text-sm font-semibold text-ink">
        {fill(SOR_COPY.heading[HEADING[statement.restriction]], { title })}
        <span className="ml-2 font-normal text-ink-subtle">· {formatDate(statement.issuedAt)}</span>
      </summary>
      <div className="space-y-4 border-t border-line px-4 py-4">
        <Section title={SOR_COPY.sections.decided}>{fill(SOR_COPY.restriction[statement.restriction], { n: version ?? '' })}</Section>
        <Section title={SOR_COPY.sections.why}>
          <ul className="list-disc space-y-1 pl-5">
            {statement.reasons.map((reason, i) => (
              <li key={`${reason.code}-${i}`}>
                {fill(SOR_COPY.reasonLine, { reasonTitle: REASON_COPY[reason.code].title, reasonMessage: reason.message })}
              </li>
            ))}
          </ul>
        </Section>
        <Section title={SOR_COPY.sections.found}>{statement.facts}</Section>
        <Section title={SOR_COPY.sections.rule}>{ground}</Section>
        <Section title={SOR_COPY.sections.howFound}>
          {statement.automatedDetection ? SOR_COPY.detection.automated : SOR_COPY.detection.person}
        </Section>
        <Section title={SOR_COPY.sections.whatYouCanDo}>
          <ul className="list-disc space-y-1 pl-5">
            {canAppeal && <li>{fill(SOR_COPY.options[0], { date: formatDate(statement.appealUntil) })}</li>}
            <li>{SOR_COPY.options[1]}</li>
          </ul>
        </Section>
      </div>
    </details>
  );
}
