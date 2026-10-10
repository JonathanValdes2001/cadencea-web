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

/** How long the home page and /software wait for each updater manifest before rendering without it. */
export const RELEASE_FEED_TIMEOUT_MS = 1500;

/**
 * How long the home page and /software reuse a fetched manifest (Next's Data
 * Cache). /cadenceavault fetches fresh, so a new release shows there at once.
 */
export const RELEASE_FEED_REVALIDATE_S = 300;

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

/** True when the feed offers at least one download. */
export function anyDownload(releases: VaultReleases): boolean {
  return Boolean(releases.windows?.downloadUrl || releases.macArm64?.downloadUrl || releases.macX64?.downloadUrl);
}

/** "Windows and macOS", "Windows (macOS coming back soon)", … for the given feed. */
export function availabilityLabel(releases: VaultReleases, { preview }: { preview: boolean }): string {
  const windows = Boolean(releases.windows?.downloadUrl);
  const mac = Boolean(releases.macArm64?.downloadUrl || releases.macX64?.downloadUrl);
  if (windows && mac) return 'Windows and macOS';
  if (windows) return 'Windows (macOS coming back soon)';
  if (mac) return 'macOS (Windows coming back soon)';
  // The preview offers the beta feed, which may simply not have builds yet.
  if (preview) return 'Beta builds coming soon';
  // A timed-out or failing feed on the live site says nothing about the app,
  // so the strip names the platforms; /cadenceavault reports live availability.
  return 'Windows and macOS';
}
