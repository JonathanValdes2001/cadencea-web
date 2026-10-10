'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { releaseActions } from '@/lib/v2-demo/release-lifecycle/actions';
import { REASON_COPY } from '@/lib/v2-demo/release-lifecycle/reasons';
import { SOR_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import {
  appealOption,
  changesRequestedOf,
  releaseView,
  revisionsOf,
  statementsOf,
} from '@/lib/v2-demo/release-lifecycle/selectors';
import { useLifecycle } from '@/lib/v2-demo/release-lifecycle/store';
import { DETAIL_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import BuyersPanel from './BuyersPanel';
import DemoReviewer, { AutoApprover } from './DemoReviewer';
import EvidencePanel from './EvidencePanel';
import LiveVsPending, { WhatReviewersSee } from './LiveVsPending';
import { ActionButton, ReleaseActionsProvider } from './ReleaseActions';
import ReleaseHeader from './ReleaseHeader';
import ReviewTimeline from './ReviewTimeline';
import StateBanner from './StateBanner';
import StatementOfReasons from './StatementOfReasons';
import { useHydrated } from './useHydrated';
import VersionHistory from './VersionHistory';

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      <h2 id={id ? `${id}-heading` : undefined} className="text-xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * The release detail page body (RL §6.3, WEB-V2-SPEC §4.7): header, state
 * banner, live vs pending, reasons, timeline and versions on the left; actions,
 * evidence and the demo numbers on the right; the Demo reviewer docked
 * bottom-right when `demo` is true (decided by the server shell).
 */
export default function ReleaseDetail({ releaseId, demo }: { releaseId: string; demo: boolean }) {
  const state = useLifecycle();
  const hydrated = useHydrated();
  const release = state.releases[releaseId];

  if (!release) {
    // A release created in this browser exists only after hydration.
    if (!hydrated) return <Container className="py-10 lg:py-14" aria-busy="true">{null}</Container>;
    return (
      <Container className="py-10 lg:py-14">
        <EmptyState
          headingLevel="h1"
          title={DETAIL_UI.notFoundTitle}
          body={DETAIL_UI.notFoundBody}
          action={<Button href="/studio">{DETAIL_UI.backToStudio}</Button>}
        />
      </Container>
    );
  }

  const view = releaseView(state, release, DEMO_NOW);
  const actions = releaseActions(state, view, DEMO_NOW);
  const title = view.shown.payload.title;
  const statements = statementsOf(state, release.id);
  const requested = changesRequestedOf(state, view);
  const requestDecision = requested?.decision?.outcome === 'changes_requested' ? requested.decision : null;
  const option = appealOption(state, view, DEMO_NOW);
  const canAppeal = Boolean(option && !option.appeal && !option.windowClosed);
  const evidenceRevision = [view.open, view.current, view.latest].find((r) => r?.evidence) ?? null;
  const revisions = revisionsOf(state, release);
  const submittedFirst = release.currentRevisionId === null ? view.latest : null;

  return (
    <ReleaseActionsProvider>
      {demo && <AutoApprover />}
      <Container className="py-10 lg:py-14">
        <ReleaseHeader view={view} />
        <StateBanner state={state} view={view} actions={actions} />

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            {(view.current && view.open) || submittedFirst ? (
              <Section id="changes" title={view.current && view.open ? DETAIL_UI.liveVsPending : DETAIL_UI.whatReviewersSee}>
                {view.current && view.open ? <LiveVsPending view={view} /> : submittedFirst && <WhatReviewersSee revision={submittedFirst} releaseId={release.id} />}
              </Section>
            ) : null}

            {(requestDecision || statements.length > 0) && (
              <Section id="reasons" title={requestDecision ? DETAIL_UI.whatToFix : DETAIL_UI.reasons}>
                <div className="space-y-3">
                  {requestDecision && (
                    <div className="rounded-md border border-line px-4 py-3">
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
                        {requestDecision.reasons.map((reason, i) => (
                          <li key={`${reason.code}-${i}`}>
                            {fill(SOR_COPY.reasonLine, { reasonTitle: REASON_COPY[reason.code].title, reasonMessage: reason.message })}
                            {REASON_COPY[reason.code].hint && <span className="block text-xs text-ink-subtle">{REASON_COPY[reason.code].hint}</span>}
                          </li>
                        ))}
                      </ul>
                      {requestDecision.note && <p className="mt-2 text-sm text-ink-muted">{requestDecision.note}</p>}
                    </div>
                  )}
                  {statements.map((entry, i) => (
                    <StatementOfReasons
                      key={entry.caseId}
                      statement={entry.statement}
                      title={title}
                      version={view.current?.version ?? null}
                      canAppeal={i === 0 && canAppeal && entry.kind !== 'appeal_upheld'}
                      open={i === 0 && !requestDecision}
                    />
                  ))}
                </div>
              </Section>
            )}

            <Section id="timeline" title={DETAIL_UI.timeline}>
              <ReviewTimeline state={state} releaseId={release.id} title={title} liveVersion={view.current?.version ?? null} />
            </Section>

            <Section id="versions" title={DETAIL_UI.versionHistory}>
              <VersionHistory revisions={revisions} />
            </Section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            {actions.length > 0 && (
              <section aria-labelledby="actions-heading" className="rounded-md border border-line p-4">
                <h2 id="actions-heading" className="text-base font-semibold text-ink">
                  {DETAIL_UI.actions}
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {actions.map((item, i) => (
                    <ActionButton key={item.id} view={view} item={item} variant={i === 0 ? 'primary' : 'secondary'} fullWidth />
                  ))}
                </div>
              </section>
            )}
            <EvidencePanel evidence={evidenceRevision?.evidence ?? null} type={release.type} reviewedAt={view.current?.decidedAt ?? null} />
            <BuyersPanel release={release} revisions={revisions} />
          </aside>
        </div>
      </Container>
      {demo && (
        <Container className="pb-10 lg:pb-0">
          <DemoReviewer releaseId={release.id} />
        </Container>
      )}
    </ReleaseActionsProvider>
  );
}
