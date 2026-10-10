import React from 'react';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { formatEurCents, formatNok } from '@/lib/v2-demo/format';
import { PAYOUT_EXAMPLE, oreToEurCents, payoutRow, type PayoutRow } from '@/lib/v2-demo/stream-teaser';

type SegmentId = Exclude<PayoutRow['id'], 'price' | 'net'>;

/**
 * Where each part of the price goes, in the waterfall's order. A categorical
 * palette checked with the dataviz validator (adjacent CVD ΔE ≥ 8 in both sets):
 * light for the page, darker-surface steps for the phone mock. Artists keep the
 * brand violet. Colour is never alone: the table and labels name every part.
 */
const SEGMENTS: readonly { id: SegmentId; light: string; dark: string }[] = [
  { id: 'vat', light: '#2a78d6', dark: '#3987e5' },
  { id: 'card', light: '#eb6834', dark: '#d95926' },
  { id: 'songwriters', light: '#1baf7a', dark: '#199e70' },
  { id: 'delivery', light: '#eda100', dark: '#c98500' },
  { id: 'artists', light: 'var(--color-brand-700)', dark: 'var(--color-brand-500)' },
  { id: 'cadencea', light: '#e87ba4', dark: '#d55181' },
];

const PRICE = payoutRow('price');
const nok = (ore: number) => formatNok(ore / 100);
const aboutEur = (ore: number) => `about ${formatEurCents(Math.abs(oreToEurCents(ore)))}`;

/** The series colour of a payout row; undefined for the price and the net, which aren't segments. */
export function segmentColor(id: PayoutRow['id'], onDark = false): string | undefined {
  const segment = SEGMENTS.find((s) => s.id === id);
  return onDark ? segment?.dark : segment?.light;
}

/** One stacked bar for the whole price: VAT, fees, songwriters, delivery, then the artists' and Cadencea's shares. */
export function PayoutBar({ onDark = false, className = '' }: { onDark?: boolean; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`How ${nok(PRICE.ore)} splits: ${SEGMENTS.map((s) => {
        const row = payoutRow(s.id);
        return `${row.label} ${nok(Math.abs(row.ore))}`;
      }).join(', ')}`}
      className={`flex h-3 w-full gap-0.5 overflow-hidden rounded-sm ${className}`}
    >
      {SEGMENTS.map((s) => {
        const row = payoutRow(s.id);
        return (
          <span
            key={s.id}
            title={`${row.label}: ${nok(Math.abs(row.ore))}`}
            className="h-full"
            style={{ flex: `${Math.abs(row.ore)} 1 0%`, backgroundColor: onDark ? s.dark : s.light }}
          />
        );
      })}
    </div>
  );
}

/** "Where your NOK 49 goes" on /stream (WEB-V2-SPEC §4.9): the bar, then the full table. */
export default function PayoutBreakdown() {
  return (
    <section id="payouts" className="scroll-mt-24 border-b border-line py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader title={`Where your NOK ${PRICE.ore / 100} goes`} />
        <div className="mt-10 max-w-3xl">
          <PayoutBar />
          <table className="mt-8 w-full border-collapse text-left text-sm">
            <caption className="sr-only">Illustrative payout for one month of the Supporter plan</caption>
            <thead>
              <tr className="border-b border-line-strong text-xs uppercase tracking-widest text-ink-subtle">
                <th scope="col" className="py-3 pr-4 font-semibold">Where it goes</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Amount</th>
                <th scope="col" className="hidden py-3 text-right font-semibold sm:table-cell">In euros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PAYOUT_EXAMPLE.rows.map((row) => {
                const color = segmentColor(row.id);
                const strong = row.kind === 'net' || row.id === 'artists';
                return (
                  <tr key={row.id} className={row.kind === 'net' ? 'bg-elevated' : ''}>
                    <th scope="row" className={`py-3 pr-4 ${strong ? 'font-semibold text-ink' : 'font-normal text-ink-muted'}`}>
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 shrink-0 rounded-sm ${color ? '' : 'invisible'}`}
                          style={color ? { backgroundColor: color } : undefined}
                        />
                        {row.label}
                      </span>
                    </th>
                    <td className={`whitespace-nowrap py-3 pr-4 text-right tabular-nums ${strong ? 'font-semibold text-ink' : 'text-ink'}`}>
                      {nok(row.ore)}
                      <span className="block text-xs font-normal text-ink-muted sm:hidden">{aboutEur(row.ore)}</span>
                    </td>
                    <td className="hidden py-3 text-right tabular-nums text-ink-muted sm:table-cell">{aboutEur(row.ore)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-6 text-sm leading-relaxed text-ink-muted">
            Illustrative numbers for the Supporter plan in the Cadencea Stream demo (NOK 49 a month, Norway first),
            not final pricing. There&rsquo;s no per-stream rate: your money follows your listening.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Assumes a negotiated songwriter rate. TONO&rsquo;s published per-minute minimum would cost more at this
            price, and we haven&rsquo;t agreed a rate yet.
          </p>
        </div>
      </Container>
    </section>
  );
}
