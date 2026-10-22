import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { Check } from '@/components/ui/Icons';
import Price from '@/components/ui/Price';
import { CREDITS } from '@/lib/v2-demo/credits/config';
import { fill } from '@/lib/v2-demo/format';
import { COMING_LATER_COPY, SPLITS_COPY, WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { RELEASE_TYPE_INFO } from '@/lib/v2-demo/release-lifecycle/types';
import { COMING_LATER_RULES } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { PERSONA } from '@/lib/v2-demo/sellers';
import { ReviewDepthChip } from '@/components/v2/studio/LiveVsPending';

/**
 * /publish/splits-pack and /publish/midi-pack (RL §5.1): the type's rules from
 * §3.2 and §3.4 and the "Coming later" note. No wizard, and no draft is created.
 */
export default function ComingLaterType({ type }: { type: 'splits_pack' | 'midi_pack' }) {
  const rules = COMING_LATER_RULES[type];
  const range = type === 'splits_pack' ? CREDITS.priceList.splitsPack : CREDITS.priceList.midiPack;
  const typeName = WIZARD_COPY.tiles[type].title;
  const creditLine = `co-prod. by ${PERSONA.artistName}`;
  return (
    <Container className="py-10 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{WIZARD_COPY.comingLaterTitle}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">{fill(COMING_LATER_COPY.title, { Type: typeName })}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">{rules.lead}</p>
      {type === 'splits_pack' && (
        <div className="mt-4">
          <Badge tone="warning">{SPLITS_COPY.badge}</Badge>
        </div>
      )}

      <ul className="mt-8 max-w-3xl space-y-3">
        {rules.rules.map((rule) => (
          <li key={rule} className="flex gap-3 text-sm leading-relaxed text-ink">
            <Check size={16} className="mt-1 shrink-0 text-tone-success" />
            {fill(rule, { min: range.min, max: range.max, step: range.step })}
          </li>
        ))}
      </ul>

      <div className="mt-6 max-w-3xl">
        <ReviewDepthChip depth={RELEASE_TYPE_INFO[type].firstReviewDepth} />
      </div>

      {type === 'splits_pack' && (
        <section aria-labelledby="splits-example" className="mt-8 max-w-3xl rounded-md border border-line p-5">
          <h2 id="splits-example" className="text-sm font-semibold text-ink">
            {COMING_LATER_RULES.exampleTerms}
          </h2>
          <div className="mt-2">
            <Price price={{ kind: 'free' }} splitTerms={{ publishing: 50, advance: 50 }} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{fill(SPLITS_COPY.sellerSummary, { publishing: 50, advance: 50, creditLine })}</p>
        </section>
      )}

      <p className="mt-8 max-w-3xl rounded-md bg-elevated px-4 py-3 text-sm text-ink-muted">{COMING_LATER_COPY.body}</p>
      <Button className="mt-6" variant="secondary" href="/publish">
        {COMING_LATER_COPY.back}
      </Button>
    </Container>
  );
}
