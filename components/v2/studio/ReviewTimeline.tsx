'use client';

import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Cadencea, Review, User } from '@/components/ui/Icons';
import { formatDate, formatRelative, fill } from '@/lib/v2-demo/format';
import { DEMO_COPY, SOR_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { REASON_COPY } from '@/lib/v2-demo/release-lifecycle/reasons';
import { sellerTimeline, timelineLabel, timelineTitle } from '@/lib/v2-demo/release-lifecycle/selectors';
import type { LifecycleState, ReviewEvent } from '@/lib/v2-demo/release-lifecycle/types';
import { DETAIL_UI, TIMELINE_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import StatementOfReasons from './StatementOfReasons';

const FIRST_PAGE = 10;

function ActorIcon({ event }: { event: ReviewEvent }) {
  const common = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full';
  if (event.actor.kind === 'seller') {
    return (
      <span className={`${common} bg-elevated text-ink-muted`}>
        <User size={16} />
      </span>
    );
  }
  if (event.actor.kind === 'reviewer') {
    return (
      <span className={`${common} bg-brand-50 text-brand-700`}>
        <Review size={16} />
      </span>
    );
  }
  return (
    <span className={`${common} bg-dark text-dark-text`}>
      <Cadencea size={16} />
    </span>
  );
}

const actorName = (event: ReviewEvent) =>
  event.actor.kind === 'seller' ? TIMELINE_UI.you : event.actor.kind === 'reviewer' ? TIMELINE_UI.reviewTeam : TIMELINE_UI.cadencea;

/** Notes the seller should see again: their appeal, their reply, the reviewer's note on a request. */
function noteLabel(event: ReviewEvent): string | null {
  if (event.type === 'appeal_filed') return TIMELINE_UI.appealMessage;
  if (event.type === 'resubmitted') return TIMELINE_UI.reply;
  if (event.type === 'changes_requested') return '';
  return null;
}

/**
 * The review timeline (RL §6.3): newest first, ten entries then "Show all".
 * Reviewers always appear as "Cadencea review team"; internal events never
 * show; events from the Demo reviewer carry the "Simulated" tag.
 */
export default function ReviewTimeline({
  state,
  releaseId,
  title,
  liveVersion,
}: {
  state: LifecycleState;
  releaseId: string;
  title: string;
  /** The live version, for "Version {n} is still live" in update statements. */
  liveVersion: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const events = sellerTimeline(state, releaseId);
  const shown = showAll ? events : events.slice(0, FIRST_PAGE);

  return (
    <div>
      <ol className="space-y-5">
        {shown.map((event) => {
          const label = timelineLabel(event);
          const noteHeading = noteLabel(event);
          return (
            <li key={event.id} className="flex gap-3">
              <ActorIcon event={event} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-ink">{timelineTitle(state, event)}</p>
                  {label && <span className="text-xs tabular-nums text-ink-subtle">{label}</span>}
                  {event.simulated && <Badge tone="demo">{DEMO_COPY.simulatedTag}</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {actorName(event)} ·{' '}
                  <time dateTime={event.at} title={formatDate(event.at)}>
                    {formatRelative(event.at)}
                  </time>
                </p>
                {event.reasons && event.reasons.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                    {event.reasons.map((reason, i) => (
                      <li key={`${reason.code}-${i}`}>
                        {fill(SOR_COPY.reasonLine, { reasonTitle: REASON_COPY[reason.code].title, reasonMessage: reason.message })}
                      </li>
                    ))}
                  </ul>
                )}
                {noteHeading !== null && event.note && (
                  <p className="mt-2 text-sm text-ink-muted">
                    {noteHeading && <span className="font-medium text-ink">{noteHeading}: </span>}
                    {event.note}
                  </p>
                )}
                {event.statement && (
                  <div className="mt-2">
                    <StatementOfReasons statement={event.statement} title={title} version={event.version ?? liveVersion} canAppeal={false} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {events.length > FIRST_PAGE && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setShowAll((v) => !v)}>
          {showAll ? DETAIL_UI.showFewer : DETAIL_UI.showAll}
        </Button>
      )}
    </div>
  );
}
