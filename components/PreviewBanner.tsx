import { getPreviewDetails } from "@/lib/site-channel.mjs";

/**
 * Shown at the top of every page on preview deployments (never in production),
 * so a reviewer always knows they are looking at a draft of the next site.
 */
export default function PreviewBanner() {
  const { branch, commit, isLocal } = getPreviewDetails();
  const build = isLocal
    ? "Local development"
    : [branch, commit].filter(Boolean).join(" · ");

  return (
    <div
      role="note"
      aria-label="Preview site"
      className="bg-dark text-dark-text text-xs"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
        <p>
          <span className="font-semibold uppercase tracking-wider">Preview</span>
          <span className="text-dark-muted">
            {" "}
            · Not the live site. Nothing here changes cadencea.app.
          </span>
        </p>
        {build && <p className="font-mono text-dark-muted">{build}</p>}
      </div>
    </div>
  );
}
