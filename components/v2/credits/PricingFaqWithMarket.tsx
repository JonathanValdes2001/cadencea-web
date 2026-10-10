import React from 'react';
import Faq from '@/components/ui/Faq';
import { PRICING_MARKET_FAQ } from '@/lib/v2-demo/credits/copy';

/**
 * The pricing FAQ plus the preview-only "What are Market credits?" item
 * (WEB-V2-SPEC §5.5). Loaded with next/dynamic behind showV2, so production
 * doesn't announce the Market even in its JavaScript.
 */
export default function PricingFaqWithMarket({
  items,
  className,
}: {
  items: readonly { q: string; a: React.ReactNode }[];
  className?: string;
}) {
  return <Faq items={[...items, PRICING_MARKET_FAQ]} className={className} />;
}
