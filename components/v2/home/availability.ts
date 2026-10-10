/**
 * Download availability as the home trust strip and the /software card say it
 * (WEB-V2-SPEC §5.3, §5.6). Pure: the pages load the release feed themselves
 * and pass the result in, so nothing here touches the network.
 */

export interface VaultRelease {
  version: string;
  downloadUrl: string;
}

/** The shape `loadCadenceaVaultReleases()` resolves to; a platform is null when its feed failed. */
export type VaultReleases = Partial<Record<'windows' | 'macArm64' | 'macX64', VaultRelease | null>>;

/** How long the home page waits for the three updater manifests before it renders without them. */
export const RELEASE_FEED_TIMEOUT_MS = 1500;

/**
 * Resolves to `fallback` if `work` takes longer than `ms` or rejects, so a slow
 * or unreachable release feed can't stall the page.
 */
export async function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([work.catch(() => fallback), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** "Windows and macOS", "Windows (macOS coming back soon)", … for the given feed. */
export function availabilityLabel(releases: VaultReleases, { preview }: { preview: boolean }): string {
  const windows = Boolean(releases.windows?.downloadUrl);
  const mac = Boolean(releases.macArm64?.downloadUrl || releases.macX64?.downloadUrl);
  if (windows && mac) return 'Windows and macOS';
  if (windows) return 'Windows (macOS coming back soon)';
  if (mac) return 'macOS (Windows coming back soon)';
  // The preview offers the beta feed, which may simply not have builds yet.
  return preview ? 'Beta builds coming soon' : 'Downloads temporarily unavailable';
}
