import React from 'react';
import Badge from '@/components/ui/Badge';
import { PRICING_CREDITS } from '@/lib/v2-demo/credits/copy';

type PlanId = keyof typeof PRICING_CREDITS.planLines;

/**
 * The preview-only credits line at the end of a plan card (WEB-V2-SPEC §5.5,
 * CREDITS-MODEL §9.1). /pricing loads it with next/dynamic behind showV2, so
 * production's pricing bundle carries neither this copy nor the credits data.
 */
export default function PlanCreditsLine({ plan, check }: { plan: string; check: React.ReactNode }) {
  const line = PRICING_CREDITS.planLines[plan.toLowerCase() as PlanId];
  if (!line) return null;
  return (
    <li className="flex items-start gap-2">
      {check}
      <span>
        {line}{' '}
        <Badge tone="demo" className="align-text-bottom">
          Preview
        </Badge>
      </span>
    </li>
  );
}
