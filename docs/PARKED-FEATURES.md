# Parked features: Market, Publish, Studio, Credits, Stream

On 2026-10-15 the v2 scope became **Vault 2.0 = Detect + Plugins + the new
website** (`docs/v2/README.md`, "Scope"). Market, Publish, Studio, Credits and
the Stream teaser are **parked**: hidden, not deleted. Their code, demo data and
tests stay in the repo.

## What is hidden today

| Surface | State |
|---|---|
| `/market` (and `/market/<slug>`, `/market/u/<handle>`), `/publish` (`/publish/<type>`), `/studio` (`/studio/<id>`, `/studio/<id>/edit`), `/credits`, `/stream` | **404 everywhere**: previews and production. |
| Navbar, footer, account menu, mobile menu | No links to them, no demo credits chip, no Publish button. The preview adds a **Plugins** link. |
| Home "Coming in Cadencea 2.0" band (preview only) | Detect and Cadencea plugins. |
| `/software` cards (preview only) | Cadencea Vault, plus a "Coming soon" Cadencea plugins card. |
| `/pricing` | No credits lines, credits section or Market FAQ item. It imports no v2 code. |
| `/vst-plugins` | A plain "Cadencea plugins are coming" page. It no longer redirects to `/market`. |
| `/cart` | Deleted: 404. The placeholder cart was an empty page with fake €0.00 totals. |

## The switch

`PARKED_FEATURES_OPEN` in `lib/parked-features.mjs`. A parked route is served
only when **both** gates are open:

1. the **v2 gate**, `isPreviewSite()` (`lib/site-channel.mjs`): v2 pages stay off
   production until the launch decides otherwise; and
2. the **switch**, `PARKED_FEATURES_OPEN`, which is `false`.

So opening the v2 gate at launch (or merging `cadencea-v2-beta` into `main`)
cannot publish a parked route. Two locks enforce it, both through
`parkedRoutesOpen()`:

- `middleware.ts` rewrites any parked path (`isParkedPath()`: decoded,
  case-insensitive, covers every sub-route) to a 404 before a page renders and
  before the Supabase session refresh;
- the `app/(v2)/` layout and every page in it (and its `generateMetadata`) call
  `notFound()` themselves.

`tests/v2-preview-gate.test.mjs` pins all of it, including the switch being off.

## Credits stay out of the live bundles

Nothing a live page, the shared layout, the navbar or the middleware imports
(statically or through `import()`) may lead into `components/v2/{credits,market,
publish,studio,stream}`, `lib/v2-demo/{credits,market,release-lifecycle}` or the
credit-aware UI primitives. A test walks the module graph from every non-`(v2)`
page to check it.

One leak was found and closed while parking: the shared `Field` component, used
by `/login` and `/signup`, imported the whole Studio and Publish copy file (which
mentions credits) for four labels. Those labels now live in
`lib/v2-demo/prefill-copy.ts`; `release-lifecycle/copy.ts` re-exports them.

## Reopening them later

1. **Flip the switch.** Set `PARKED_FEATURES_OPEN = true` in
   `lib/parked-features.mjs` and update the "parked switch is off" test in
   `tests/v2-preview-gate.test.mjs`. The routes work again on previews and
   `npm run dev`. They still 404 on production: that needs the v2 gate opened
   too, which is a separate launch decision.
2. **Put the links back.** The switch brings routes back, not navigation. Take
   the removed links from the commit that added `lib/parked-features.mjs`
   (find it with `git log -1 --format=%H -- lib/parked-features.mjs`, then
   `git show <hash> -- <file>`):
   - `components/Navbar.tsx`: Market and Stream links, the `CreditsChip` and
     Publish button group, "Studio (demo)" and "Credits (demo)" in the account
     and mobile menus;
   - `components/Footer.tsx`: Market, Stream, Credits, and the Creators column;
   - `components/v2/home/WhatsNext.tsx`: the Market and Stream cards;
   - `app/software/page.tsx`: the Market and Stream cards.
3. **Credits on `/pricing`.** Re-add the lazy load that keeps the credits chunk
   out of production (`components/useLazyModule.ts`, kept for this):
   ```tsx
   const showV2 = useShowV2();
   const preview = useLazyModule(() => import('@/components/v2/credits/PricingPreview'), showV2);
   // in each plan card's feature list:  {showV2 && preview && <preview.PlanCreditsLine plan={plan.name} check={<Check />} />}
   // after the plans section:           {showV2 && preview && <preview.PricingCreditsSection />}
   // in place of <Faq … />:             {showV2 && preview ? <preview.PricingFaqWithMarket className="mt-10" items={pricingFaq} /> : <Faq … />}
   ```
   and restore the credits tests in `tests/v2-pricing-invariants.test.mjs`.
   Do not add a static import of the Navbar `CreditsChip`: it put the demo wallet
   in every page's JavaScript.
4. **Redirects.** Don't bring back `/vst-plugins` → `/market`: `/vst-plugins` is
   the plugin store. `/market/songs` → `/stream` was dropped with the routes; add
   it back with them if Songs still points at Stream.
5. **`/cart`** returns with the plugin checkout, built for it.

The matching Vault switch and the parked specs are in `docs/v2/README.md`
("Hidden, not deleted", "Parked: Market, Publish and credits").
