'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DEMO_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { Info } from '@/components/ui/Icons';

/**
 * The strip under the navbar on every v2 page (WEB-V2-SPEC §4.1). Publish and
 * Studio get RELEASE-LIFECYCLE §9.9's notice; Market, Credits and Stream get the
 * general one. A client component only so one server layout can pick the variant.
 */
export default function DemoNotice() {
  const pathname = usePathname() ?? '';
  const releaseArea = /^\/(publish|studio)(\/|$)/.test(pathname);
  return (
    <div role="note" aria-label="Demo notice" className="border-b border-brand-100 bg-brand-50 text-sm text-brand-800">
      <div className="mx-auto flex max-w-7xl items-start gap-2 px-6 py-2.5 lg:px-8">
        <Info size={16} className="mt-0.5 shrink-0" />
        {releaseArea ? (
          <p>{DEMO_COPY.notice}</p>
        ) : (
          <p>
            <strong className="font-semibold">Demo</strong> · Everything here is sample data. Nothing is bought, sold or
            published, and changes stay in this browser.
          </p>
        )}
      </div>
    </div>
  );
}
