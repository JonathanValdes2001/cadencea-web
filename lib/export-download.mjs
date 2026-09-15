const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

/** @returns {{ exportId: string, exportCode: string } | null} */
export function parseExportDownloadLocation(href) {
  const url = new URL(href);
  const exportIds = url.searchParams.getAll('export_id');
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const exportCodes = fragment.getAll('export_code');
  const queryKeys = [...url.searchParams.keys()];
  const fragmentKeys = [...fragment.keys()];
  if (
    url.pathname !== '/export' ||
    exportIds.length !== 1 ||
    exportCodes.length !== 1 ||
    queryKeys.length !== 1 ||
    fragmentKeys.length !== 1 ||
    queryKeys[0] !== 'export_id' ||
    fragmentKeys[0] !== 'export_code'
  ) {
    return null;
  }
  const [exportId] = exportIds;
  const [exportCode] = exportCodes;
  if (!UUID_PATTERN.test(exportId) || !CODE_PATTERN.test(exportCode)) return null;
  return { exportId: String(exportId), exportCode: String(exportCode) };
}

export function clearedExportLocation(href) {
  const url = new URL(href);
  const exportIds = url.searchParams.getAll('export_id');
  return exportIds.length === 1 && UUID_PATTERN.test(exportIds[0])
    ? `/export?export_id=${encodeURIComponent(exportIds[0])}`
    : '/export';
}

export function buildExportDownloadAction(exportId, apiBaseUrl) {
  if (!UUID_PATTERN.test(exportId || '')) throw new Error('Invalid export id');
  const base = new URL(apiBaseUrl || 'http://localhost:8001/api');
  const isLocal = ['localhost', '127.0.0.1'].includes(base.hostname);
  if (base.protocol !== 'https:' && !(isLocal && base.protocol === 'http:')) {
    throw new Error('Export API URL must use HTTPS outside local development');
  }
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname.replace(/\/$/, '') !== '/api'
  ) {
    throw new Error('Export API URL must be an origin with the /api base path');
  }
  const normalizedBase = base.toString().replace(/\/$/, '');
  return `${normalizedBase}/auth/me/export/${encodeURIComponent(exportId)}/download`;
}
