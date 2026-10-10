import { isPreviewSite } from './site-channel.mjs';

const UPDATE_BASE = 'https://s3.eu-central-003.backblazeb2.com/cadencea-products/updates/';

/**
 * The live site offers the released app (CadenceaVault). Previews, i.e. the
 * v2 site built from cadencea-v2-beta, offer the v2 beta builds, which publish
 * to their own feed as "CadenceaVault Beta". When v2 ships to main, the live
 * site switches back to the released feed by itself.
 */
export function releaseFeedRoot(env = process.env) {
  return `${UPDATE_BASE}${isPreviewSite(env) ? 'cadencea-vault-beta' : 'cadencea-vault'}/`;
}

function releaseChannels(feedRoot) {
  return {
    windows: { feedUrl: `${feedRoot}win/`, manifest: 'latest.yml', extension: '.exe' },
    macArm64: {
      feedUrl: `${feedRoot}mac/arm64/`,
      manifest: 'latest-mac.yml',
      extension: '.dmg',
    },
    macX64: {
      feedUrl: `${feedRoot}mac/x64/`,
      manifest: 'latest-mac.yml',
      extension: '.dmg',
    },
  };
}

function yamlScalar(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return match?.[1]?.replace(/^['"]|['"]$/g, '');
}

/**
 * Parse only the two electron-builder fields the download page needs. Keeping
 * this deliberately narrow avoids executing or broadly interpreting a remote
 * YAML document.
 */
export function parseUpdaterManifest(text) {
  const version = yamlScalar(text, 'version');
  const artifacts = Array.from(text.matchAll(/^\s*-\s*url:\s*(.+?)\s*$/gm), (match) =>
    match[1].replace(/^['"]|['"]$/g, ''),
  );
  const legacyPath = yamlScalar(text, 'path');
  if (legacyPath && !artifacts.includes(legacyPath)) artifacts.push(legacyPath);

  if (!version || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Updater manifest has an invalid version');
  }
  if (!artifacts.length || artifacts.some((artifactName) =>
    !artifactName ||
      artifactName === '.' ||
      artifactName === '..' ||
      artifactName.includes('/') ||
      artifactName.includes('\\') ||
      /[\u0000-\u001f\u007f?#]/.test(artifactName)
  )) {
    throw new Error('Updater manifest has an unsafe artifact name');
  }

  return { version, artifacts };
}

async function loadReleaseChannel(channel, fetchImpl) {
  const response = await fetchImpl(`${channel.feedUrl}${channel.manifest}`, {
    cache: 'no-store',
    headers: { accept: 'application/yaml, text/yaml, text/plain' },
  });
  if (!response.ok) {
    throw new Error(`Updater manifest returned HTTP ${response.status}`);
  }

  const manifest = parseUpdaterManifest(await response.text());
  const artifactName = manifest.artifacts.find((name) =>
    name.toLowerCase().endsWith(channel.extension),
  );
  if (!artifactName) {
    throw new Error(`Updater manifest has no ${channel.extension} artifact`);
  }
  return {
    version: manifest.version,
    downloadUrl: `${channel.feedUrl}${encodeURIComponent(artifactName)}`,
  };
}

/**
 * Resolve each platform independently so one unavailable update feed disables
 * only its own button. This function is server-only by convention: the page is
 * a Next server component and never exposes the manifest fetch to the browser.
 */
export async function loadCadenceaVaultReleases(fetchImpl = fetch, { env = process.env } = {}) {
  const releases = await Promise.all(
    Object.entries(releaseChannels(releaseFeedRoot(env))).map(async ([platform, channel]) => {
      try {
        return [platform, await loadReleaseChannel(channel, fetchImpl)];
      } catch {
        return [platform, null];
      }
    }),
  );

  return Object.fromEntries(releases);
}
