# v2 website: parallel work packages

The foundation (package W0, WEB-V2-SPEC §8.2) is on `cadencea-v2-beta`. Packages A,
B and C now run **in parallel in this same checkout**. They never edit the same
file: each package touches only the paths listed for it below. The specs are in
`docs/v2/` of the Cadencea workspace (one folder above this repo); WEB-V2-SPEC §8.3–§8.5
has each package's full scope and "done when".

## Rules for every package

1. **Frozen** (read and import, never edit): `app/layout.tsx`, `app/globals.css`,
   `app/not-found.tsx`, `app/(v2)/layout.tsx`, `components/Navbar.tsx`,
   `components/Footer.tsx`, `components/ui/**`, `components/v2/common/**`,
   `next.config.ts`, `tsconfig.json`, `.github/**`, `package.json`,
   `package-lock.json`, every W0 file in `lib/v2-demo/` (list below), the six
   existing tests and the three W0 tests. Need a change? Describe it in your
   report; the polish pass (P) applies it.
2. Style with Tailwind classes in your own components; only W0/P touch `globals.css`.
3. Nothing under `app/(v2)/`, `components/ui/`, `components/v2/` or `lib/v2-demo/`
   may call the network, read `isPreviewSite`/`site-channel` in client code, or
   import `lib/auth-context` (PersonaBanner is the one exception).
   `tests/v2-no-network.test.mjs` and `tests/v2-preview-gate.test.mjs` enforce it.
4. **Keep the page gate.** Every `page.tsx` under `app/(v2)/` stays a server
   component whose default export (and `generateMetadata`, if any) starts with
   `if (!isPreviewSite()) notFound();`, as the stubs do. Next renders a page in
   parallel with the gated layout, so without it the page's content and title
   ride along in production's 404. Put client UI in components under
   `components/v2/<area>/`.
5. Files under `lib/v2-demo/` use relative imports with `.ts` extensions,
   `import type` for type-only imports, no `@/` paths and no React in anything a
   test loads (Node type stripping, WEB-V2-SPEC §2.7).
6. Packages talk only through the W0 seams: `credits/store.ts` + `credits/wallet.ts`
   (A, B), `release-lifecycle/public.ts` (B reads, C implements), `seeds.ts`'s
   `seedPublicView(releaseId)` (B reads, C creates), the slug/id contract of
   WEB-V2-SPEC §6.5, and URLs (`/credits#top-up`, `/credits#history`,
   `/market/{slug}`, `/studio`, `/studio/{releaseId}`, `/publish`).
7. Don't run `next build` (it would upload source maps). Verify with `npm test`,
   `npx tsc --noEmit` and `next dev`. Don't commit unless your task says to, and
   then stage only your own paths.

## Package A: existing pages, pricing and credits, `/credits`, `/stream`

May create or edit:

- `app/page.tsx`, `app/cadenceavault/page.tsx`, `app/software/page.tsx`
- `app/pricing/page.tsx` (only the edits WEB-V2-SPEC §5.5 allows), `app/pricing/layout.tsx` (new)
- `app/login/page.tsx`, `app/login/layout.tsx` (new), `app/signup/page.tsx`, `app/signup/layout.tsx` (new)
- `app/terms/page.tsx` (§5.1 prices only; W0 already changed its `metadata.title`)
- `app/account/settings/page.tsx` (Security rows only), `app/account/cloud-storage/page.tsx`
- `components/CookieBanner.tsx`
- `app/(v2)/credits/page.tsx`, `app/(v2)/stream/page.tsx` (replace the stubs; only the stream page may read `STREAM_DEMO_URL`)
- `components/v2/credits/**`, `components/v2/stream/**`, `components/v2/home/**`, `components/v2/vault/**`
- `lib/v2-demo/stream-teaser.ts` (new)
- `tests/v2-copy-guards.test.mjs`, `tests/v2-pricing-invariants.test.mjs`, `tests/v2-wallet-actions.test.mjs`

## Package B: Market

May create or edit:

- `app/(v2)/market/page.tsx`, `app/(v2)/market/[slug]/page.tsx`, `app/(v2)/market/u/[handle]/page.tsx` (replace the stubs)
- `components/v2/market/**`
- `lib/v2-demo/market/**` (new: `types.ts`, `items.ts`, `queries.ts`, …)
- `tests/v2-market-data.test.mjs`, `tests/v2-market-queries.test.mjs`

Library slugs in `credits/library-seed.ts` are fixed: `tape-drums-vol-1`,
`dusty-keys`, `copper-tape-loops` (file `midnight-rhodes-92`, anchor
`#file-midnight-rhodes-92`), `velvet-pads` and the returned `analog-bass`; the
Market seed must use them.

## Package C: Publish and Studio

May create or edit:

- `app/(v2)/publish/page.tsx`, `app/(v2)/publish/[type]/page.tsx`
- `app/(v2)/studio/page.tsx`, `app/(v2)/studio/[releaseId]/page.tsx`, `app/(v2)/studio/[releaseId]/edit/page.tsx` (replace the stubs)
- `components/v2/publish/**`, `components/v2/studio/**`
- `lib/v2-demo/release-lifecycle/machine.ts`, `seeds.ts`, `store.ts`, `diff.ts`, `vault-projects.ts` (new),
  plus any other new file in that folder (for example `reasons.ts` for the §4.11 reason titles)
- `lib/v2-demo/release-lifecycle/public.ts`: replace the stub bodies, keep the exported types and signatures
- `tests/v2-lifecycle-machine.test.mjs`, `tests/v2-lifecycle-seeds.test.mjs`

The lifecycle store uses `createDemoStore` from `lib/v2-demo/storage.ts` with
`DEMO_STORAGE_KEYS.releaseLifecycle` and `RELEASE_LIFECYCLE_SPEC_VERSION` as its
version, reads it with `useDemoStore`, and dates every action with `nextDemoTime()`
from `clock.ts`. Nightjar's `sellerId` is `PERSONA.userId` (`demo-maya`).

## What W0 provides (frozen)

| Path | What it is |
|---|---|
| `components/ui/` (`index.ts` exports all) | `Container`/`ShowroomGlow`, `SectionHeader`, `Button`, `Badge`, `Card`, `Field` (`TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `RangeField`, `StepperField`), `Tabs`, `Stepper`, `EmptyState`, `Price`, `CoverArt`, `PreviewPlayer`, `StatusChip`, `Dialog`, `Toast` (`useToast`), `Icons`, `Faq`, `Tooltip` |
| `components/v2/common/` | `V2Flag` (`useShowV2`), `DemoNotice`, `PersonaBanner`, `CreditsChip`, `DemoConfirm` (`demoLabel`), `HumanMadeStandard` |
| `lib/v2-demo/release-lifecycle/types.ts` | RELEASE-LIFECYCLE §8, verbatim |
| `lib/v2-demo/release-lifecycle/copy.ts` | RELEASE-LIFECYCLE §9 strings, §6.1 tab and §5.2 step labels |
| `lib/v2-demo/release-lifecycle/public.ts` | stub of `useCurrentRelease` / `usePublicReleases` (C fills it) |
| `lib/v2-demo/credits/` | `config.ts` (CREDITS-MODEL numbers), `copy.ts` (§9 strings), `types.ts`, `wallet-seed.ts` (§10 verbatim), `wallet.ts` (pure rules), `library-seed.ts`, `store.ts` (`useWallet`, `useMarketLibrary`, `buyWithCredits`, `recordCardPurchase`, `markDownloaded`, `returnPurchase`, `addTopUp`, `refundTopUpLot`, `resetWalletDemo`) |
| `lib/v2-demo/format.ts`, `clock.ts`, `cover.ts`, `audio-recipe.ts`, `categories.ts`, `sellers.ts`, `storage.ts`, `use-demo-store.ts` | formatting and key encoding, `DEMO_NOW`, cover and audio generators, the 7 categories, sellers and the persona, the localStorage store |
| `app/(v2)/layout.tsx` | the preview gate (`notFound()` unless `isPreviewSite()`) plus `DemoNotice` |
| `tests/v2-foundation.test.mjs`, `tests/v2-preview-gate.test.mjs`, `tests/v2-no-network.test.mjs` | W0's tests |
