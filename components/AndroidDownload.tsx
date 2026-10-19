import { androidRelease } from '@/lib/cadencea-mobile-release';

export default function AndroidDownload() {
  return (
    <section id="android" className="scroll-mt-24 border-b border-line bg-elevated">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            Cadencea mobile companion
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Your cloud projects, on Android.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Browse your synced projects, play audio and manage sharing from
            your phone. Sign in with your Cadencea account to access the
            projects you have synced from Cadencea Vault on your computer.
          </p>
        </div>
        <div className="rounded-md border border-line bg-canvas p-6 sm:p-8">
          <p className="text-sm font-semibold text-ink">
            Android 7.0 or later · Version {androidRelease.version}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Direct APK download · {Math.round(androidRelease.bytes / 1_000_000)} MB
          </p>
          <a
            href={androidRelease.downloadUrl}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover sm:w-auto"
          >
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" />
            </svg>
            Download for Android (APK)
          </a>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Open the downloaded APK on your phone. If Android asks, allow
            installation from your browser to install Cadencea.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            To update, download and install the latest APK from this page.
          </p>
        </div>
      </div>
    </section>
  );
}
