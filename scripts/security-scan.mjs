import { readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TEXT_EXTENSIONS = new Set([
  '', '.css', '.env', '.html', '.js', '.json', '.jsx', '.md', '.mjs',
  '.sql', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml',
]);
const SENSITIVE_NAMES = [
  'DATABASE_PASSWORD',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SENTRY_AUTH_TOKEN',
  'SMTP_PASS',
  'B2_APPLICATION_KEY',
  'B2_S3_SECRET_ACCESS_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'NEWSLETTER_TOKEN_SECRET',
];
const ASSIGNMENT_PATTERN = new RegExp(
  "\\b(" + SENSITIVE_NAMES.join('|') + ")\\b\\s*(?:=|:)\\s*[`'\"]?([^\\s`'\",}]+)",
  'gi',
);

function isPlaceholder(value) {
  const normalized = value.replace(/^[<\[]|[>\]]$/g, '').toLowerCase();
  return !normalized || [
    'your', 'example', 'placeholder', 'test', 'dummy', 'fake', 'sample',
    'redacted', 'secret', 'password', 'ci-', '${{', 'process.env', 'changeme',
  ].some((part) => normalized.includes(part));
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

export function scanText(text, file = '<memory>') {
  const findings = [];
  if (/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(text)) {
    findings.push({ file, line: 1, kind: 'private key material' });
  }
  for (const match of text.matchAll(ASSIGNMENT_PATTERN)) {
    if (!isPlaceholder(match[2])) {
      findings.push({
        file,
        line: lineNumber(text, match.index || 0),
        kind: `non-placeholder ${match[1].toUpperCase()}`,
      });
    }
  }
  for (const match of text.matchAll(/postgres(?:ql)?:\/\/[^\s:'"`]+:([^@\s'"`]+)@/gi)) {
    if (!isPlaceholder(match[1])) {
      findings.push({
        file,
        line: lineNumber(text, match.index || 0),
        kind: 'credential-bearing database URL',
      });
    }
  }
  for (const match of text.matchAll(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g)) {
    findings.push({
      file,
      line: lineNumber(text, match.index || 0),
      kind: 'AWS-compatible access key id',
    });
  }
  for (const match of text.matchAll(/\bsntrys_[A-Za-z0-9_-]{20,}\b/g)) {
    findings.push({
      file,
      line: lineNumber(text, match.index || 0),
      kind: 'Sentry authentication token',
    });
  }
  return findings;
}

function candidateFiles(repositoryRoot) {
  const result = spawnSync(
    'git',
    [
      '-c',
      `safe.directory=${repositoryRoot.replaceAll('\\', '/')}`,
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error('Could not enumerate tracked files for the credential scan');
  }
  return result.stdout.split('\0').filter(Boolean);
}

export function scanRepository(repositoryRoot = process.cwd()) {
  const findings = [];
  for (const relativePath of candidateFiles(repositoryRoot)) {
    const path = resolve(repositoryRoot, relativePath);
    let stats;
    try {
      stats = statSync(path);
    } catch {
      continue;
    }
    if (!stats.isFile() || stats.size > 1024 * 1024) continue;
    if (!TEXT_EXTENSIONS.has(extname(relativePath).toLowerCase())) continue;
    const text = readFileSync(path, 'utf8');
    if (text.includes('\0')) continue;
    findings.push(...scanText(text, relativePath));
  }
  return findings;
}

function main() {
  const findings = scanRepository(resolve(process.cwd()));
  if (!findings.length) {
    console.log('Credential scan passed: no high-confidence tracked secret patterns found.');
    return;
  }
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: ${finding.kind} (value withheld)`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
