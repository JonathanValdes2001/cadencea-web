import { CREDITS } from '@/lib/v2-demo/credits/config';
import { formatCreditPrice, formatDate, formatDuration, formatEurCents, formatKey, formatMoney } from '@/lib/v2-demo/format';
import { PRICE_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { CREDIT_ROLE_LABEL, SYNTH_LABEL, TERRITORIES, VITAL_TIERS } from '@/lib/v2-demo/release-lifecycle/options';
import type { CreditEntry, KeyValue, LeaseTierId, Price, ReleasePayload, SplitTerms } from '@/lib/v2-demo/release-lifecycle/types';
import { FIELD_LABEL } from '@/lib/v2-demo/release-lifecycle/ui-copy';

const NONE = '—';

/** A price as text, the way the Price component reads it. */
export function priceText(price: Price | { kind: 'stream_only' } | undefined): string {
  if (!price) return NONE;
  switch (price.kind) {
    case 'credits':
      return formatCreditPrice(price.credits);
    case 'free':
      return PRICE_COPY.zeroCredits;
    case 'card':
      return formatMoney(price.amount);
    case 'stream_only':
      return PRICE_COPY.streamOnly;
    case 'per_tier':
      return NONE;
  }
}

function creditsText(entries: readonly CreditEntry[]): string {
  if (entries.length === 0) return NONE;
  return entries
    .map((c) => {
      const roles = c.roles.map((r) => CREDIT_ROLE_LABEL[r]).join(', ');
      const shares = [c.masterSharePct !== null ? `${c.masterSharePct}% master` : '', c.compositionSharePct !== null ? `${c.compositionSharePct}% composition` : '']
        .filter(Boolean)
        .join(', ');
      return `${c.name}${roles ? ` (${roles})` : ''}${shares ? `: ${shares}` : ''}`;
    })
    .join('; ');
}

function list(value: unknown): string {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : NONE;
}

/** The label of a changed field ("Stems lease price", "Track 3 audio"). */
export function fieldLabel(field: string, payload?: ReleasePayload): string {
  const parts = field.split('.');
  if (parts[0] === 'tiers' && parts.length === 3) {
    const tier = CREDITS.beatTiers[parts[1] as LeaseTierId].label;
    return parts[2] === 'price' ? `${tier} price` : parts[2] === 'enabled' ? tier : `${tier} terms`;
  }
  if (parts[0] === 'tracks' && parts.length === 3 && payload?.kind === 'song') {
    const track = payload.tracks.find((t) => t.id === parts[1]);
    const name = track ? `"${track.title}"` : 'Track';
    const what = { audio: 'audio', title: 'title', explicit: 'explicit label', language: 'language', isrc: 'ISRC', previewStartMs: 'preview start' }[parts[2]] ?? parts[2];
    return `${name} ${what}`;
  }
  return FIELD_LABEL[field] ?? field;
}

/** A field value as short text for the live-vs-pending table. */
export function fieldValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === '') {
    if (field === 'releaseDate') return 'On approval';
    if (field === 'key') return value === null ? formatKey(null) : 'Not set';
    return NONE;
  }
  const leaf = field.split('.').pop() ?? field;
  if (field.startsWith('tiers.')) {
    if (leaf === 'enabled') return value ? 'On' : 'Off';
    if (leaf === 'price') return formatEurCents(value as number, { trimZeros: true });
    if (leaf === 'terms' && Array.isArray(value)) return `${value[0]}% publishing · "${value[1]}"`;
  }
  switch (leaf) {
    case 'bpm':
      return `${value} BPM`;
    case 'key':
      return formatKey(value as KeyValue);
    case 'tags':
    case 'moods':
    case 'categories':
      return list(value);
    case 'territories':
      return (value as string[]).map((code) => TERRITORIES.find((t) => t.code === code)?.label ?? code).join(', ');
    case 'releaseDate':
      return formatDate(`${value}T00:00:00Z`);
    case 'allowFanSupport':
    case 'explicit':
    case 'previewHasProducerTag':
      return value ? 'Yes' : 'No';
    case 'price':
      return priceText(value as Price);
    case 'previewStartMs':
      return formatDuration(value as number);
    case 'synth':
      return SYNTH_LABEL[value as keyof typeof SYNTH_LABEL] ?? String(value);
    case 'vitalTier':
      return VITAL_TIERS.find((t) => t.value === value)?.label ?? String(value);
    case 'credits':
      return Array.isArray(value) ? creditsText((value as CreditEntry[][])[0] ?? []) : NONE;
    case 'coProducers':
      return creditsText(value as CreditEntry[]);
    case 'licensedMaterial':
      return Array.isArray(value) && value.length > 0 ? (value as { description: string }[]).map((m) => m.description).join(', ') : NONE;
    case 'terms': {
      const t = value as SplitTerms;
      return `${t.publishingSharePct}% publishing · ${t.advanceSharePct}% advances · "${t.creditLine}"`;
    }
    case 'tracks':
      return (value as string[]).join(' · ');
    case 'embedsAudio':
      return Array.isArray(value) ? (value[0] === null ? NONE : value[0] ? `Yes${value[1] ? `: ${value[1]}` : ''}` : 'No') : NONE;
    case 'mainMix':
    case 'audio':
      return String(value).slice(0, 7);
    default:
      return String(value);
  }
}
