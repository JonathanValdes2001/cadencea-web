'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { fill } from '@/lib/v2-demo/format';
import { PERSONA, PERSONA_LINE, SIGNED_IN_NOTE } from '@/lib/v2-demo/sellers';
import CoverArt from '@/components/ui/CoverArt';

/**
 * Names the demo account on Credits, Studio and Publish (WEB-V2-SPEC §2.5). This
 * is the one v2 file allowed to read the auth context, and only for a display
 * name: it makes no request and never shows the visitor's own data.
 */
export default function PersonaBanner({ className = '' }: { className?: string }) {
  const { user, profile } = useAuth();
  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : user?.email ?? '';

  return (
    <div className={`flex items-center gap-3 rounded-md border border-line bg-elevated px-4 py-3 ${className}`}>
      <div className="w-9 shrink-0">
        <CoverArt seed={PERSONA.sellerHandle} kind="avatar" title={PERSONA.personName} decorative rounded="full" />
      </div>
      <div className="text-sm">
        <p className="font-medium text-ink">{PERSONA_LINE}</p>
        {user && displayName && (
          <p className="mt-0.5 text-ink-muted">{fill(SIGNED_IN_NOTE, { displayName })}</p>
        )}
      </div>
    </div>
  );
}
