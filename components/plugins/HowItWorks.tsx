import React from 'react';
import { StepNumber } from '@/components/ui/Chip';
import SectionHeader from '@/components/ui/SectionHeader';

const STEPS = [
  {
    title: 'Get it here',
    body: 'Buy ATHENA EQ Complex, or get ATHENA EQ Mini for free. The license goes to your Cadencea account.',
  },
  {
    title: 'Open Cadencea Vault',
    body: 'Sign in with the same account. Cadencea Vault is free for Windows and macOS.',
  },
  {
    title: 'Go to Plugins',
    body: 'Your plugins are listed in Vault under Plugins, ready to activate on this computer.',
  },
  {
    title: 'Install',
    body: 'Vault activates the license on this computer and installs the plugin for your DAW.',
  },
];

/** Buy → open Vault → Plugins → Install, the same four steps on the store and product pages. */
export default function HowItWorks({ id, className = '' }: { id?: string; className?: string }) {
  return (
    <div id={id} className={`scroll-mt-24 ${className}`}>
      <SectionHeader eyebrow="How it works" title="Installed and activated by Cadencea Vault." />
      <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="border-t border-line-strong pt-6">
            <StepNumber n={i + 1} />
            <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
