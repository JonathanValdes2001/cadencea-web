'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Chip';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/ui/EmptyState';
import { SelectField, TextField } from '@/components/ui/Field';
import { Alert, ArrowRight } from '@/components/ui/Icons';
import SectionHeader from '@/components/ui/SectionHeader';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import DemoConfirm from '@/components/v2/common/DemoConfirm';
import PersonaBanner from '@/components/v2/common/PersonaBanner';
import { DEMO_NOW } from '@/lib/v2-demo/clock';
import { fill } from '@/lib/v2-demo/format';
import { DEMO_COPY, EMPTY_COPY, STUDIO_COPY, STUDIO_TAB_LABEL } from '@/lib/v2-demo/release-lifecycle/copy';
import { allViews, attentionCount, inTab, lastActivity, tabCounts } from '@/lib/v2-demo/release-lifecycle/selectors';
import { resetLifecycleDemo, useLifecycle } from '@/lib/v2-demo/release-lifecycle/store';
import { STUDIO_TABS, type StudioTab } from '@/lib/v2-demo/release-lifecycle/types';
import { STUDIO_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { CREATOR_COPY } from '@/lib/v2-demo/release-lifecycle/publish-copy';
import { studioTabStore } from '@/lib/v2-demo/release-lifecycle/viewer-prefs';
import { useDemoStore } from '@/lib/v2-demo/use-demo-store';
import ActionMenu from './ActionMenu';
import { resetCreatorProfile } from '@/components/v2/publish/CreatorGate';
import { AutoApprover } from './DemoReviewer';
import { ReleaseActionsProvider } from './ReleaseActions';
import ReleaseRow, { ROW_GRID } from './ReleaseRow';

type SortKey = keyof typeof STUDIO_UI.sort;
type TypeChip = keyof typeof STUDIO_UI.typeChips;
const TYPE_CHIPS = Object.keys(STUDIO_UI.typeChips) as TypeChip[];
const TILE_TABS: readonly StudioTab[] = ['live', 'in_review', 'needs_changes', 'drafts'];

function isStudioTab(value: string | null): value is StudioTab {
  return value !== null && (STUDIO_TABS as readonly string[]).includes(value);
}

/**
 * The seller dashboard (RL §6.1–§6.2, WEB-V2-SPEC §4.7): summary tiles, the
 * attention callout, the seven tabs with counts, search, type chips, sort and
 * the release list. The tab lives in `?tab=` and, per viewer, in localStorage.
 */
export default function StudioDashboard({ demo }: { demo: boolean }) {
  const state = useLifecycle();
  const searchParams = useSearchParams();
  const storedTab = useDemoStore(studioTabStore);
  const param = searchParams.get('tab');
  const tab: StudioTab = isStudioTab(param) ? param : storedTab ?? 'all';
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState<TypeChip[]>([]);
  const [sort, setSort] = useState<SortKey>('activity');
  const [resetOpen, setResetOpen] = useState(false);
  const toast = useToast();
  const searchId = useId();
  const sortId = useId();
  const resultsId = useId();

  useEffect(() => {
    if (isStudioTab(param)) studioTabStore.update(() => param);
  }, [param]);

  const views = useMemo(() => allViews(state, DEMO_NOW), [state]);
  const counts = useMemo(() => tabCounts(state, DEMO_NOW), [state]);
  const attention = useMemo(() => attentionCount(state, DEMO_NOW), [state]);

  const inCurrentTab = views.filter((v) => inTab(v, tab));
  const filtered = inCurrentTab
    .filter((v) => (query.trim() ? v.shown.payload.title.toLowerCase().includes(query.trim().toLowerCase()) : true))
    .filter((v) => (types.length > 0 ? types.includes(v.release.type as TypeChip) : true))
    .sort((a, b) => {
      if (sort === 'title') return a.shown.payload.title.localeCompare(b.shown.payload.title);
      if (sort === 'created') return Date.parse(b.release.createdAt) - Date.parse(a.release.createdAt);
      return Date.parse(lastActivity(state, b.release).at) - Date.parse(lastActivity(state, a.release).at);
    });
  const filtersOn = query.trim() !== '' || types.length > 0;
  const clearFilters = () => {
    setQuery('');
    setTypes([]);
  };
  const showThemTab: StudioTab = counts.needs_changes > 0 ? 'needs_changes' : 'rejected_unpublished';
  const empty = EMPTY_COPY[tab];

  const reset = () => {
    resetLifecycleDemo();
    resetCreatorProfile();
    studioTabStore.reset();
    setResetOpen(false);
    toast.show(STUDIO_UI.resetToast);
  };

  return (
    <ReleaseActionsProvider>
      {demo && <AutoApprover />}
      <Container className="py-10 lg:py-14">
        <SectionHeader
          as="h1"
          eyebrow={STUDIO_UI.eyebrow}
          title={STUDIO_UI.title}
          subtitle={STUDIO_UI.lead}
          action={
            <div className="flex items-center gap-2">
              <Button href="/publish">{EMPTY_COPY.all.action}</Button>
              <ActionMenu
                label={STUDIO_UI.moreOptions}
                items={[
                  { id: 'market', label: STUDIO_UI.openMarket, href: '/market' },
                  {
                    id: 'reset-creator',
                    label: CREATOR_COPY.demo.reset,
                    onSelect: () => {
                      resetCreatorProfile();
                      toast.show(CREATOR_COPY.demo.resetToast);
                    },
                  },
                  { id: 'reset', label: STUDIO_UI.reset, danger: true, onSelect: () => setResetOpen(true) },
                ]}
              />
            </div>
          }
        />
        <PersonaBanner className="mt-8" />

        <section aria-label={STUDIO_UI.summaryLabel} className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILE_TABS.map((t) => (
            <Link
              key={t}
              href={`/studio?tab=${t}`}
              aria-current={tab === t ? 'page' : undefined}
              className={`rounded-md border px-4 py-3 hover:border-line-strong ${tab === t ? 'border-ink' : 'border-line'}`}
            >
              <span className="block text-sm text-ink-muted">{STUDIO_TAB_LABEL[t]}</span>
              <span className="mt-1 block text-2xl font-bold tabular-nums text-ink">{counts[t]}</span>
            </Link>
          ))}
        </section>

        {attention > 0 && (
          <div role="status" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-tone-warning-bg px-4 py-3 text-sm text-tone-warning">
            <span className="flex items-center gap-2 font-semibold">
              <Alert size={16} />
              {attention === 1 ? STUDIO_COPY.attentionOne : fill(STUDIO_COPY.attention, { n: attention })}
            </span>
            <Link href={`/studio?tab=${showThemTab}`} className="inline-flex min-h-11 items-center gap-1 font-semibold underline underline-offset-2">
              {STUDIO_COPY.showThem}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <Tabs
          className="mt-8"
          label={STUDIO_UI.tabsLabel}
          value={tab}
          items={STUDIO_TABS.map((t) => ({ id: t, label: STUDIO_TAB_LABEL[t], count: counts[t], href: `/studio?tab=${t}` }))}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <TextField
            id={searchId}
            type="search"
            label={STUDIO_UI.searchLabel}
            placeholder={STUDIO_UI.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">{STUDIO_UI.typeFilterLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {TYPE_CHIPS.map((type) => {
                const on = types.includes(type);
                return (
                  <FilterChip
                    key={type}
                    selected={on}
                    onToggle={() => setTypes((list) => (on ? list.filter((t) => t !== type) : [...list, type]))}
                  >
                    {STUDIO_UI.typeChips[type]}
                  </FilterChip>
                );
              })}
            </div>
          </fieldset>
          <SelectField
            id={sortId}
            label={STUDIO_UI.sortLabel}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            options={(Object.keys(STUDIO_UI.sort) as SortKey[]).map((key) => ({ value: key, label: STUDIO_UI.sort[key] }))}
          />
        </div>

        <p id={resultsId} aria-live="polite" className="mt-4 text-sm text-ink-subtle">
          {filtered.length === 1 ? STUDIO_UI.resultsOne : fill(STUDIO_UI.results, { n: filtered.length })}
        </p>

        {filtered.length > 0 ? (
          <div className="mt-2 overflow-hidden rounded-md border border-line">
            <div aria-hidden="true" className={`hidden border-b border-line bg-elevated px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle ${ROW_GRID}`}>
              <span>{STUDIO_UI.columns.release}</span>
              <span>{STUDIO_UI.columns.status}</span>
              <span>{STUDIO_UI.columns.version}</span>
              <span>{STUDIO_UI.columns.channel}</span>
              <span>{STUDIO_UI.columns.activity}</span>
              <span className="text-right">{STUDIO_UI.columns.actions}</span>
            </div>
            <ul aria-describedby={resultsId}>
              {filtered.map((view) => (
                <ReleaseRow key={view.release.id} view={view} state={state} />
              ))}
            </ul>
          </div>
        ) : filtersOn && inCurrentTab.length > 0 ? (
          <EmptyState
            className="mt-2"
            title={EMPTY_COPY.filters.title}
            body={EMPTY_COPY.filters.body}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {EMPTY_COPY.filters.action}
              </Button>
            }
          />
        ) : (
          <EmptyState
            className="mt-2"
            title={empty.title}
            body={empty.body}
            action={'action' in empty ? <Button href="/publish">{empty.action}</Button> : undefined}
          />
        )}
      </Container>

      <DemoConfirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={reset}
        title={DEMO_COPY.reset.title}
        body={DEMO_COPY.reset.body}
        confirmLabel={DEMO_COPY.reset.confirm}
        cancelLabel={DEMO_COPY.reset.cancel}
        tone="danger"
      />
    </ReleaseActionsProvider>
  );
}

