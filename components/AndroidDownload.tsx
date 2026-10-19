import AndroidIcon from '@/components/AndroidIcon';
import { androidRelease } from '@/lib/cadencea-mobile-release';

export default function AndroidDownload() {
  return (
    <section id="android" aria-labelledby="android-title" className="scroll-mt-24 border-b border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="relative isolate overflow-hidden rounded-2xl border border-[#a78bfa]/20 bg-[#15121c] p-6 text-white sm:p-8 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.18),transparent_65%),radial-gradient(ellipse_at_bottom_right,rgba(61,220,132,0.12),transparent_60%)]" />
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#3ddc84]/25 bg-[#3ddc84]/10 sm:h-16 sm:w-16">
                <AndroidIcon className="h-9 w-9 text-[#3ddc84] sm:h-10 sm:w-10" />
              </div>
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3ddc84]">Cadencea for Android</p>
                <h2 id="android-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Take your music with you.</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#c6c0d0] sm:text-base">
                  Your synced projects, ready when inspiration strikes.
                  Listen, browse and share from your phone with your Cadencea account.
                </p>
              </div>
            </div>
            <div className="shrink-0 lg:w-64">
              <a href={androidRelease.downloadUrl} className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-[#3ddc84] px-5 py-3.5 text-base font-bold text-[#102219] transition-colors hover:bg-[#67e5a0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3ddc84]">
                <AndroidIcon className="h-7 w-7 shrink-0" />
                Download for Android
              </a>
              <p className="mt-3 text-center text-xs leading-5 text-[#c6c0d0]">
                APK · v{androidRelease.version} · {Math.round(androidRelease.bytes / 1_000_000)} MB<br />
                Android 7.0 or later
              </p>
            </div>
          </div>
          <details className="mt-6 border-t border-white/10 pt-4 text-sm text-[#c6c0d0]">
            <summary className="w-fit cursor-pointer rounded-sm font-medium text-[#e4dfec] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3ddc84]">Installing &amp; updating the app</summary>
            <p className="mt-3 max-w-3xl leading-relaxed">
              Open the downloaded APK on your phone. If Android asks, allow installation from your browser.
              To update, download and install the latest APK from this page.
              Use the same Cadencea account as on your computer to access your synced projects.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
