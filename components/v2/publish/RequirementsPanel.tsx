import React from 'react';
import { Check, Clock } from '@/components/ui/Icons';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { PUBLISH_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';

/**
 * "Before you publish" (RL §5.1): the draft requirements. In the demo every one
 * is met except payouts, which are needed before money is paid out, not to publish.
 */
export default function RequirementsPanel({ className = '' }: { className?: string }) {
  return (
    <section aria-labelledby="requirements-heading" className={`rounded-md border border-line p-5 ${className}`}>
      <h2 id="requirements-heading" className="text-base font-semibold text-ink md:text-lg">
        {WIZARD_COPY.requirementsTitle}
      </h2>
      <ul className="mt-3 space-y-2">
        {PUBLISH_UI.requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-sm text-ink">
            {req.met ? <Check size={16} className="text-tone-success" /> : <Clock size={16} className="text-tone-warning" />}
            <span>{req.label}</span>
            <span className="sr-only">: {req.met ? PUBLISH_UI.met : PUBLISH_UI.notMet}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-subtle">{PUBLISH_UI.requirementsNote}</p>
    </section>
  );
}
