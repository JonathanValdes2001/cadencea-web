'use client';

import React, { useId, useState } from 'react';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { fill } from '@/lib/v2-demo/format';
import { PUBLISH_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { sellerProfileStore } from '@/lib/v2-demo/release-lifecycle/viewer-prefs';
import { useDemoStore } from '@/lib/v2-demo/use-demo-store';
import { useHydrated } from '@/components/v2/studio/useHydrated';

const S = PUBLISH_UI.seller;
const NAME_MIN = 2;
const NAME_MAX = 40;

/**
 * The first-time seller step (RL §5.1), shown once per browser on /publish:
 * handle and display name, prefilled as Nightjar. The handle is locked because
 * Nightjar already has approved releases (ADR-0042 `handle_locked`).
 */
export default function SellerSetup({ className = '' }: { className?: string }) {
  const hydrated = useHydrated();
  const profile = useDemoStore(sellerProfileStore);
  const [name, setName] = useState(profile.displayName);
  const [error, setError] = useState<string | null>(null);
  const handleId = useId();
  const nameId = useId();
  if (!hydrated || profile.confirmed) return null;

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setError(S.displayNameError);
      return;
    }
    sellerProfileStore.update((p) => ({ ...p, displayName: trimmed, confirmed: true }));
  };

  return (
    <section aria-labelledby={`${nameId}-title`} className={`rounded-md border border-brand-200 bg-brand-50 p-5 ${className}`}>
      <h2 id={`${nameId}-title`} className="text-base font-semibold text-ink md:text-lg">
        {S.title}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{S.body}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField id={handleId} label={S.handle} value={`@${profile.handle}`} readOnly hint={S.handleHint} />
        <TextField
          id={nameId}
          label={S.displayName}
          value={name}
          maxLength={NAME_MAX}
          hint={fill(S.displayNameHint, { name: name.trim() || profile.displayName })}
          error={error ?? undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
      </div>
      <Button className="mt-4" onClick={save}>
        {S.save}
      </Button>
    </section>
  );
}
