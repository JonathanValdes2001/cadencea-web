import React from 'react';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/ui/CoverArt';
import { fill } from '@/lib/v2-demo/format';
import { WIZARD_COPY } from '@/lib/v2-demo/release-lifecycle/copy';
import { RELEASE_TYPE_SLUG } from '@/lib/v2-demo/release-lifecycle/types';
import { PUBLISH_UI } from '@/lib/v2-demo/release-lifecycle/ui-copy';
import { VAULT_PROJECTS } from '@/lib/v2-demo/release-lifecycle/vault-projects';
import { ProjectFacts } from './SourceStep';

/** "Start from a Vault project" on /publish: each demo project opens the wizard it suits, prefilled. */
export default function ProjectShortcuts({ className = '' }: { className?: string }) {
  return (
    <section aria-labelledby="projects-heading" className={className}>
      <h2 id="projects-heading" className="text-base font-semibold text-ink md:text-lg">
        {WIZARD_COPY.source.start}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{PUBLISH_UI.projectsLead}</p>
      <ul className="mt-4 divide-y divide-line rounded-md border border-line">
        {VAULT_PROJECTS.map((project) => (
          <li key={project.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="w-14 shrink-0">
                <CoverArt seed={project.coverSeed} kind={project.suggestedType} decorative rounded="sm" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{project.name}</p>
                <ProjectFacts project={project} />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              href={`/publish/${RELEASE_TYPE_SLUG[project.suggestedType]}?project=${project.id}`}
            >
              {fill(PUBLISH_UI.openWizard, { type: WIZARD_COPY.typeName[project.suggestedType] })}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
