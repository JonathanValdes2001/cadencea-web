import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadCadenceaVaultReleases,
  parseUpdaterManifest,
} from '../lib/cadencea-vault-releases.mjs';

const manifest = (version, artifactNames) => `version: ${version}
files:
${artifactNames.map((artifactName) => `  - url: ${artifactName}
    sha512: ignored
`).join('')}path: ${artifactNames[0]}
sha512: ignored
releaseDate: '2026-07-11T00:00:00.000Z'
`;

test('parses the authoritative electron-builder version and artifact', () => {
  assert.deepEqual(
    parseUpdaterManifest(manifest('1.2.0', [
      'CadenceaVault-1.2.0-arm64.zip',
      'CadenceaVault-1.2.0-arm64.dmg',
    ])),
    {
      version: '1.2.0',
      artifacts: [
        'CadenceaVault-1.2.0-arm64.zip',
        'CadenceaVault-1.2.0-arm64.dmg',
      ],
    },
  );
});

test('rejects artifact paths that could escape or alter the update feed URL', () => {
  assert.throws(
    () => parseUpdaterManifest(manifest('1.2.0', ['../untrusted.exe'])),
    /unsafe artifact name/,
  );
  assert.throws(
    () => parseUpdaterManifest(manifest('1.2.0', ['installer.exe?download=1'])),
    /unsafe artifact name/,
  );
});

test('loads platform feeds server-side without caching and isolates failures', async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({ url, options });
    if (url.includes('/mac/x64/')) {
      return { ok: false, status: 503, text: async () => '' };
    }
    const artifacts = url.includes('/win/')
      ? ['CadenceaVault Setup 1.2.0.exe']
      : ['CadenceaVault-1.2.0-arm64.zip', 'CadenceaVault-1.2.0-arm64.dmg'];
    return { ok: true, status: 200, text: async () => manifest('1.2.0', artifacts) };
  };

  const releases = await loadCadenceaVaultReleases(fakeFetch);

  assert.equal(
    releases.windows.downloadUrl,
    'https://s3.eu-central-003.backblazeb2.com/cadencea-products/updates/cadencea-vault/win/CadenceaVault%20Setup%201.2.0.exe',
  );
  assert.equal(releases.macArm64.version, '1.2.0');
  assert.match(releases.macArm64.downloadUrl, /\.dmg$/);
  assert.equal(releases.macX64, null);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(({ options }) => options.cache === 'no-store'));
});
