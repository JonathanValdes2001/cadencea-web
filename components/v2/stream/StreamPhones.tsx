import React from 'react';
import CoverArt from '@/components/ui/CoverArt';
import { Check } from '@/components/ui/Icons';
import { fill, formatDate, formatKey, formatNok } from '@/lib/v2-demo/format';
import { PUBLIC_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import {
  DISCOVER_HERO_ID,
  NEW_VERIFIED_IDS,
  PAYOUT_EXAMPLE,
  RELEASE_PAGE_ID,
  payoutRow,
  teaserRelease,
  type PayoutRow,
  type TeaserRelease,
} from '@/lib/v2-demo/stream-teaser';
import PhoneFrame from './PhoneFrame';
import { PayoutBar, segmentColor } from './PayoutBreakdown';

const nok = (ore: number) => formatNok(ore / 100);
const reviewedOn = (release: TeaserRelease) => fill(PUBLIC_COPY.reviewedOn, { date: formatDate(release.reviewedAt) });
const madeIn = (release: TeaserRelease) => fill(PUBLIC_COPY.madeIn, { daw: release.daw });
const stems = (release: TeaserRelease) => fill(PUBLIC_COPY.stems, { count: release.stems });
/** For the spoken descriptions: "Reviewed by Cadencea on …" → "reviewed by Cadencea on …". */
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

function Cover({ release, rounded = 'sm' }: { release: TeaserRelease; rounded?: 'none' | 'sm' }) {
  return <CoverArt seed={`stream-${release.id}`} kind="song" palette={release.palette} decorative rounded={rounded} />;
}

function Seal() {
  return (
    <p className="flex items-center gap-1 text-[10px] font-medium text-brand-300">
      <Check size={16} className="h-3 w-3 shrink-0" />
      {PUBLIC_COPY.humanMade}
    </p>
  );
}

function DiscoverScreen() {
  const hero = teaserRelease(DISCOVER_HERO_ID);
  return (
    <>
      <p className="text-sm font-semibold">Good evening</p>
      <p className="mt-1 self-start rounded-sm bg-brand-950 px-2 py-0.5 text-[10px] text-brand-200">
        Listening as Supporter · demo
      </p>
      <div className="mt-3 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
        <div className="relative aspect-[2/1] overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <Cover release={hero} rounded="none" />
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-sm font-semibold leading-tight">{hero.title}</p>
          <p className="text-[11px] text-dark-muted">{hero.artist}</p>
          <div className="mt-1.5">
            <Seal />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-dark-muted">
            {reviewedOn(hero)} · {madeIn(hero)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold">New verified releases</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {NEW_VERIFIED_IDS.map((id) => {
          const release = teaserRelease(id);
          return (
            <div key={id} className="min-w-0">
              <Cover release={release} />
              <p className="mt-1 truncate text-[10px] font-medium">{release.title}</p>
              <p className="truncate text-[9px] text-dark-muted">{release.artist}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReleaseScreen() {
  const release = teaserRelease(RELEASE_PAGE_ID);
  return (
    <>
      <div className="flex gap-3">
        <div className="w-20 shrink-0">
          <Cover release={release} />
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-sm font-semibold leading-tight">{release.title}</p>
          <p className="text-[11px] text-dark-muted">{release.artist}</p>
          <p className="mt-0.5 text-[10px] text-dark-muted">
            {release.kind} · {release.tracks.length} tracks
          </p>
        </div>
      </div>
      <div className="mt-2.5">
        <Seal />
      </div>
      <ol className="mt-2.5 divide-y divide-white/10 border-y border-white/10">
        {release.tracks.map((track, i) => (
          <li key={track.title} className="flex items-baseline gap-2 py-1.5 text-[11px]">
            <span className="w-3 text-dark-muted tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{track.title}</span>
            <span className="text-[10px] tabular-nums text-dark-muted">
              {track.bpm} · {formatKey(track.key)}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted">Provenance</p>
        <ul className="mt-1.5 space-y-1 text-[11px]">
          <li>{reviewedOn(release)}</li>
          <li>{madeIn(release)}</li>
          <li>{stems(release)}</li>
        </ul>
        <p className="mt-1.5 text-[11px] font-medium text-brand-300">{PUBLIC_COPY.whatThisMeans} →</p>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[10px] italic leading-snug text-dark-muted">{release.linerNote}</p>
    </>
  );
}

/** The phone legend drops the parenthetical detail ("Delivery (15 hours …)" → "Delivery"); the page table keeps it. */
const shortLabel = (row: PayoutRow) => row.label.replace(/\s*\(.*\)$/, '');

function MoneyScreen() {
  const nowPlaying = teaserRelease(RELEASE_PAGE_ID);
  const legend = (['artists', 'cadencea', 'songwriters', 'vat', 'card', 'delivery'] as const).map(payoutRow);
  return (
    <>
      <p className="text-sm font-semibold">Where your money goes</p>
      <p className="mt-1 text-[10px] text-dark-muted">
        Now playing: {nowPlaying.tracks[0].title} by {nowPlaying.artist}
      </p>
      <p className="mt-4 text-[10px] uppercase tracking-widest text-dark-muted">This month</p>
      <p className="text-xl font-bold tabular-nums">{nok(payoutRow('price').ore)}</p>
      <PayoutBar onDark className="mt-3" />
      <ul className="mt-3 space-y-1.5">
        {legend.map((row) => (
          <li key={row.id} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: segmentColor(row.id, true) }}
            />
            <span className={`min-w-0 flex-1 truncate ${row.id === 'artists' ? 'font-semibold' : 'text-dark-muted'}`}>
              {shortLabel(row)}
            </span>
            <span className={`tabular-nums ${row.id === 'artists' ? 'font-semibold' : 'text-dark-muted'}`}>
              {nok(Math.abs(row.ore))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-3 text-[10px] leading-snug text-dark-muted">
        {PAYOUT_EXAMPLE.listenedMinutes / 60} hours listened. No per-stream rate: your money follows your listening.
      </p>
    </>
  );
}

/**
 * The three phone mocks in the /stream hero: Discover, a release page with its
 * provenance panel, and "Where your money goes". They scroll sideways in their
 * own row below lg and sit side by side from lg.
 */
export default function StreamPhones() {
  const hero = teaserRelease(DISCOVER_HERO_ID);
  const release = teaserRelease(RELEASE_PAGE_ID);
  return (
    <div
      role="region"
      aria-label="Screens from the Cadencea Stream demo"
      tabIndex={0}
      className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0"
    >
      <PhoneFrame
        description={`Discover: ${hero.title} by ${hero.artist} as the featured release, ${lowerFirst(reviewedOn(hero))}, ${lowerFirst(madeIn(hero))}, above a rail of new verified releases.`}
      >
        <DiscoverScreen />
      </PhoneFrame>
      <PhoneFrame
        description={`Release page for ${release.title} by ${release.artist}, with its provenance: ${lowerFirst(reviewedOn(release))}, ${lowerFirst(madeIn(release))}, ${stems(release)}.`}
      >
        <ReleaseScreen />
      </PhoneFrame>
      <PhoneFrame
        description={`Where your money goes: of ${nok(payoutRow('price').ore)} this month, ${nok(payoutRow('artists').ore)} goes to the artists you played.`}
      >
        <MoneyScreen />
      </PhoneFrame>
    </div>
  );
}

/** One phone, the Discover screen, for small product cards (/software). */
export function StreamPhonePreview() {
  const hero = teaserRelease(DISCOVER_HERO_ID);
  return (
    <PhoneFrame description={`Cadencea Stream's Discover screen, featuring ${hero.title} by ${hero.artist}.`}>
      <DiscoverScreen />
    </PhoneFrame>
  );
}
