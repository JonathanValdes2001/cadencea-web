import React from 'react';
import { StepNumber } from '@/components/ui/Chip';
import SectionHeader from '@/components/ui/SectionHeader';
import type { PluginProduct } from '@/lib/plugins/products';

const LICENSE_NOTE = 'The license goes to your Cadencea account.';

/** The first step names the plugin on its own page and stays general on the store page. */
function getItHere(product?: Pick<PluginProduct, 'name' | 'family'>, free = false): string {
  if (!product) return `Buy a Complex edition, or get a Mini edition for free. ${LICENSE_NOTE}`;
  if (free) return `Get ${product.name} for free. ${LICENSE_NOTE}`;
  return `Buy ${product.name}, or get ${product.family} Mini for free. ${LICENSE_NOTE}`;
}

const LATER_STEPS = [
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
export default function HowItWorks({
  id,
  className = '',
  product,
  free = false,
}: {
  id?: string;
  className?: string;
  product?: Pick<PluginProduct, 'name' | 'family'>;
  free?: boolean;
}) {
  const steps = [{ title: 'Get it here', body: getItHere(product, free) }, ...LATER_STEPS];
  return (
    <div id={id} className={`scroll-mt-24 ${className}`}>
      <SectionHeader eyebrow="How it works" title="Installed and activated by Cadencea Vault." />
      <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
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
