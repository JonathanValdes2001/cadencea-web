import React from 'react';
import Container from '@/components/ui/Container';
import { ITEM_COPY } from '@/lib/v2-demo/market/copy';
import Breadcrumb from './Breadcrumb';

/** "Market / {Category}", then the H1 and lead (WEB-V2-SPEC §4.3); also used for "All results". */
export default function CategoryHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="border-b border-line bg-canvas py-10">
      <Container>
        <Breadcrumb trail={[{ label: ITEM_COPY.market, href: '/market' }, { label: title }]} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-muted">{lead}</p>
      </Container>
    </header>
  );
}
