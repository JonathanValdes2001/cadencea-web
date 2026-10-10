import React from 'react';

/**
 * A phone-shaped HTML/CSS mock for the /stream hero (WEB-V2-SPEC §4.9). The
 * screen is a picture, hidden from assistive tech; `description` says in words
 * what it shows.
 */
export default function PhoneFrame({ description, children }: { description: string; children: React.ReactNode }) {
  return (
    <figure className="w-60 shrink-0 snap-center">
      <figcaption className="sr-only">{description}</figcaption>
      <div aria-hidden="true" className="rounded-lg border border-white/15 bg-dark p-1.5 shadow-brand-glow">
        <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-md bg-showroom-to text-dark-text">
          <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[10px] font-semibold tabular-nums">
            <span>9:41</span>
            <span className="h-1.5 w-10 rounded-sm bg-white/20" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5 pt-2">{children}</div>
        </div>
      </div>
    </figure>
  );
}
