import React from 'react';
import Container from '@/components/ui/Container';
import PersonaBanner from '@/components/v2/common/PersonaBanner';
import { CreatorDemoControls } from './CreatorGate';
import ProjectShortcuts from './ProjectShortcuts';

/**
 * The page around the Publish window (PUBLISH-PROCEDURE §3): the window centered
 * on a quiet band, the demo person and the creator demo controls under it, and
 * on /publish the project shortcuts below.
 */
export default function PublishScreen({ children, shortcuts = false }: { children: React.ReactNode; shortcuts?: boolean }) {
  return (
    <>
      <div className="border-b border-line bg-elevated">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 lg:px-8">
          {children}
          <div className="mx-auto mt-4 flex max-w-5xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <PersonaBanner className="lg:flex-1" />
            <CreatorDemoControls />
          </div>
        </div>
      </div>
      {shortcuts && (
        <Container className="py-10 lg:py-12">
          <ProjectShortcuts className="mx-auto max-w-5xl" />
        </Container>
      )}
    </>
  );
}
