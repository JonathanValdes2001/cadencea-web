'use client';

import React, { useId } from 'react';
import Price from '@/components/ui/Price';
import { CheckboxField, RangeField, StepperField, TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Icons';
import { DEMO_NOW, addDays } from '@/lib/v2-demo/clock';
import { CREDITS, cardSellerEarnsEurCents, sellerEarnsEurCents } from '@/lib/v2-demo/credits/config';
import { creditsToEurCents, fill, formatCreditPrice, formatEurCents } from '@/lib/v2-demo/format';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { TERRITORIES } from '@/lib/v2-demo/release-lifecycle/options';
import type { BeatPayload, LeaseTier, PresetPackPayload, SamplePackPayload, SongPayload } from '@/lib/v2-demo/release-lifecycle/types';
import { WIZARD_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { RELEASE_DATE_MAX_DAYS } from '@/lib/v2-demo/release-lifecycle/validation';
import { fieldId, type StepProps } from './wizard-shared';

const L = WIZARD_UI.license;
/** The UI ceiling for Exclusive, which has no maximum price (CREDITS-MODEL §6.2). */
const EXCLUSIVE_UI_MAX_EUR = 5000;

function PackPrice({ payload, update, errorFor }: { payload: SamplePackPayload | PresetPackPayload; update: StepProps['update']; errorFor: StepProps['errorFor'] }) {
  const { min, max, step } = CREDITS.priceList.pack;
  const credits = payload.price.kind === 'credits' ? payload.price.credits : min;
  const items = payload.kind === 'sample_pack' ? payload.samples.length : payload.presets.length;
  const unit = payload.kind === 'sample_pack' ? CREDITS.priceList.oneShot : CREDITS.priceList.preset;
  const aboveItems = credits > items * unit;
  return (
    <div className="space-y-4">
      <RangeField
        id={fieldId('price')}
        label={L.price}
        min={min}
        max={max}
        step={step}
        value={credits}
        valueText={formatCreditPrice(credits)}
        error={errorFor('price')}
        onChange={(e) => update({ ...payload, price: { kind: 'credits', credits: Number(e.target.value) } })}
      />
      <Price price={{ kind: 'credits', credits }} size="lg" />
      <p className="text-sm text-ink-muted">
        {fill(WIZARD_COPY.earnings, {
          credits,
          eur: (creditsToEurCents(credits) / 100).toFixed(2),
          earn: (sellerEarnsEurCents(credits) / 100).toFixed(2),
        })}
      </p>
      {aboveItems && (
        <p className="flex gap-2 text-sm text-tone-warning">
          <Alert size={16} className="mt-0.5 shrink-0" />
          {L.aboveItems}
        </p>
      )}
    </div>
  );
}

function TierRow({ tier, onChange, error }: { tier: LeaseTier; onChange: (tier: LeaseTier) => void; error?: string }) {
  const config = CREDITS.beatTiers[tier.tier];
  const eur = tier.price.amountMinor / 100;
  const maxEur = config.maxEur ?? EXCLUSIVE_UI_MAX_EUR;
  return (
    <li className="rounded-md border border-line p-4">
      <CheckboxField
        id={fieldId(`tiers.${tier.tier}.enabled`)}
        label={<span className="font-semibold">{fill(L.offerTier, { tier: config.label })}</span>}
        hint={L.rights[tier.tier]}
        checked={tier.enabled}
        onChange={(e) => onChange({ ...tier, enabled: e.target.checked })}
      />
      {tier.enabled && (
        <div className="ml-8 mt-3">
          <StepperField
            id={fieldId(`tiers.${tier.tier}.price`)}
            label={fill(L.tierPrice, { tier: config.label })}
            hint={config.maxEur === null ? fill(L.tierMin, { min: config.minEur }) : fill(L.tierRange, { min: config.minEur, max: config.maxEur })}
            error={error}
            prefix="€"
            value={eur}
            min={config.minEur}
            max={maxEur}
            step={5}
            onValueChange={(value) => onChange({ ...tier, price: { amountMinor: Math.round(value * 100), currency: 'EUR' } })}
            addon={fill(L.earnAbout, { amount: formatEurCents(cardSellerEarnsEurCents(tier.price.amountMinor)) })}
          />
        </div>
      )}
    </li>
  );
}

function BeatLeases({ payload, update, errorFor }: { payload: BeatPayload; update: StepProps['update']; errorFor: StepProps['errorFor'] }) {
  const first = payload.tiers[0];
  const setAll = (change: Partial<LeaseTier>) => update({ ...payload, tiers: payload.tiers.map((t) => ({ ...t, ...change })) });
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">{L.beatNote}</p>
      {errorFor('tiers', true) && <p className="text-xs font-medium text-danger">{errorFor('tiers', true)}</p>}
      <ul id={fieldId('tiers')} tabIndex={-1} className="space-y-3">
        {payload.tiers.map((tier) => (
          <TierRow
            key={tier.tier}
            tier={tier}
            error={errorFor(`tiers.${tier.tier}.price`)}
            onChange={(next) => update({ ...payload, tiers: payload.tiers.map((t) => (t.tier === next.tier ? next : t)) })}
          />
        ))}
      </ul>
      {first && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StepperField
            id={fieldId('tiers.publishing')}
            label={L.publishing}
            value={first.producerPublishingSharePct}
            min={0}
            max={100}
            step={5}
            error={errorFor('tiers.publishing')}
            onValueChange={(value) => setAll({ producerPublishingSharePct: value })}
          />
          <TextField
            id={fieldId('tiers.creditLine')}
            label={L.creditLine}
            value={first.creditLine}
            maxLength={80}
            error={errorFor('tiers.creditLine')}
            onChange={(e) => setAll({ creditLine: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

function SongRelease({
  payload,
  update,
  errorFor,
  releaseDateLocked,
  lockedTerritories,
}: {
  payload: SongPayload;
  update: StepProps['update'];
  errorFor: StepProps['errorFor'];
  releaseDateLocked: boolean;
  lockedTerritories: readonly string[];
}) {
  const saleId = useId();
  const selling = payload.price.kind === 'card';
  const priceEur = payload.price.kind === 'card' ? payload.price.amount.amountMinor / 100 : CREDITS.cardOrderMinEurCents / 100;
  const today = DEMO_NOW.slice(0, 10);
  const lastDay = addDays(DEMO_NOW, RELEASE_DATE_MAX_DAYS).slice(0, 10);
  return (
    <div className="space-y-6">
      <fieldset id={fieldId('price')} tabIndex={-1}>
        <legend className="text-sm font-semibold text-ink">{L.songSale}</legend>
        <div className="mt-2 space-y-1">
          {[false, true].map((sell) => (
            <label key={String(sell)} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name={saleId}
                checked={selling === sell}
                onChange={() =>
                  update({
                    ...payload,
                    price: sell ? { kind: 'card', amount: { amountMinor: CREDITS.cardOrderMinEurCents, currency: 'EUR' } } : { kind: 'stream_only' },
                  })
                }
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              {sell ? L.sellDownloads : L.streamOnly}
            </label>
          ))}
        </div>
        {selling && (
          <div className="ml-7 mt-2 max-w-xs">
            <TextField
              id={fieldId('price.amount')}
              label={L.downloadPrice}
              type="number"
              min={CREDITS.cardOrderMinEurCents / 100}
              step="0.01"
              value={String(priceEur)}
              error={errorFor('price')}
              onChange={(e) => {
                const cents = Math.round(Number(e.target.value) * 100);
                update({ ...payload, price: { kind: 'card', amount: { amountMinor: Number.isFinite(cents) ? cents : 0, currency: 'EUR' } } });
              }}
            />
            <p className="mt-1.5 text-xs text-ink-subtle">{L.downloadNote}</p>
          </div>
        )}
      </fieldset>

      <div className="max-w-xs">
        <TextField
          id={fieldId('releaseDate')}
          label={L.releaseDate}
          type="date"
          min={today}
          max={lastDay}
          value={payload.releaseDate ?? ''}
          readOnly={releaseDateLocked}
          hint={releaseDateLocked ? L.releaseDateLocked : L.releaseDateHint}
          error={errorFor('releaseDate')}
          onChange={(e) => update({ ...payload, releaseDate: e.target.value || null })}
        />
      </div>

      <fieldset id={fieldId('territories')} tabIndex={-1}>
        <legend className="text-sm font-semibold text-ink">{L.territories}</legend>
        <p className="mt-0.5 text-xs text-ink-subtle">{L.territoriesHint}</p>
        {errorFor('territories') && <p className="mt-1 text-xs font-medium text-danger">{errorFor('territories')}</p>}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {TERRITORIES.map((t) => {
            const on = payload.territories.includes(t.code);
            return (
              <CheckboxField
                key={t.code}
                id={`${fieldId('territories')}-${t.code}`}
                label={t.label}
                checked={on}
                disabled={on && lockedTerritories.includes(t.code)}
                onChange={(e) =>
                  update({ ...payload, territories: e.target.checked ? [...payload.territories, t.code] : payload.territories.filter((c) => c !== t.code) })
                }
              />
            );
          })}
        </div>
      </fieldset>

      <CheckboxField
        id={fieldId('allowFanSupport')}
        label={L.fanSupport}
        hint={L.fanSupportHint}
        checked={payload.allowFanSupport}
        onChange={(e) => update({ ...payload, allowFanSupport: e.target.checked })}
      />
    </div>
  );
}

/**
 * Step 5, "Release and price / Leases / Price and licence" (RL §5.5; numbers
 * from CREDITS-MODEL through credits/config.ts): pack prices on a 10-credit
 * slider with the seller earnings line, beat lease tiers by card, song downloads
 * by card from €3, release date and territories.
 */
export default function LicensePriceStep({
  payload,
  update,
  errorFor,
  releaseDateLocked,
  lockedTerritories,
}: StepProps & { releaseDateLocked: boolean; lockedTerritories: readonly string[] }) {
  switch (payload.kind) {
    case 'sample_pack':
    case 'preset_pack':
      return <PackPrice payload={payload} update={update} errorFor={errorFor} />;
    case 'beat':
      return <BeatLeases payload={payload} update={update} errorFor={errorFor} />;
    case 'song':
      return <SongRelease payload={payload} update={update} errorFor={errorFor} releaseDateLocked={releaseDateLocked} lockedTerritories={lockedTerritories} />;
    default:
      return null;
  }
}
