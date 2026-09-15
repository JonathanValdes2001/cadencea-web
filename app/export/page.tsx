'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildExportDownloadAction,
  clearedExportLocation,
  parseExportDownloadLocation,
} from '@/lib/export-download.mjs';

type DownloadCapability = {
  exportId: string;
  exportCode: string;
  action: string;
};

export default function ExportDownloadPage() {
  const [capability, setCapability] = useState<DownloadCapability | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const parsed = parseExportDownloadLocation(window.location.href);
    window.history.replaceState(null, '', clearedExportLocation(window.location.href));
    if (!parsed) {
      setInvalid(true);
      return;
    }
    try {
      setCapability({
        ...parsed,
        action: buildExportDownloadAction(
          parsed.exportId,
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api',
        ),
      });
    } catch {
      setInvalid(true);
    }
  }, []);

  const download = () => {
    if (!capability || !formRef.current || submitted) return;
    setSubmitted(true);
    formRef.current.submit();
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-20">
      <section className="w-full rounded-md border border-line bg-canvas p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          Data export
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Download your Cadencea data</h1>
        {invalid ? (
          <p className="mt-4 text-sm text-rose-400">
            This one-time export link is invalid, incomplete, expired, or already used.
          </p>
        ) : capability ? (
          <>
            <p className="mt-4 text-sm text-ink-muted">
              The download code has been removed from the address bar. It will be sent once
              in the protected request body and cannot be reused after a successful claim.
            </p>
            <form ref={formRef} action={capability.action} method="post">
              <input type="hidden" name="export_code" value={capability.exportCode} />
              <button
                type="button"
                onClick={download}
                disabled={submitted}
                className="mt-6 inline-flex h-10 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {submitted ? 'Starting download…' : 'Download export'}
              </button>
            </form>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">Preparing the secure download…</p>
        )}
      </section>
    </main>
  );
}
