# Cadencea v2 website preview

The v2 website is developed on the `cadencea-v2-beta` branch while the live
site keeps running from `main`. Both are deployed by Vercel from the same
project; they never share a deployment.

| Branch | What it is | Where it runs |
|---|---|---|
| `main` | The live v1 website | Vercel **production** → https://cadencea.app |
| `cadencea-v2-beta` | The v2 website in progress | Vercel **preview** deployment for that branch |
| `v2/<topic>` (optional) | One v2 change at a time, merged into `cadencea-v2-beta` | Its own preview deployment |

## Viewing the v2 site

Every push to `cadencea-v2-beta` builds a preview deployment. In the Vercel
dashboard open the `cadencea-web` project, then **Deployments**, and filter by
the `cadencea-v2-beta` branch. Each branch also gets a stable URL that always
points at its latest build:

```
https://cadencea-web-git-cadencea-v2-beta-<team-slug>.vercel.app
```

For a nicer address, assign a domain to the branch: **Settings → Domains → Add**
`v2.cadencea.app`, choose **Git branch: cadencea-v2-beta**, and add the CNAME
record Vercel shows at your DNS provider. It stays a preview deployment, so the
protections below still apply.

Keep Vercel **Deployment Protection** on for previews (the default Standard
Protection asks visitors to sign in to Vercel). Use a shareable link from the
deployment page when someone outside the team should review it.

## What keeps a preview from affecting the live site

`lib/site-channel.mjs` decides which copy is running. Only the Vercel production
deployment (`VERCEL_ENV=production`, or `SITE_CHANNEL=production` when built
outside Vercel) is the live site. Everything else, including `npm run dev`, is a
preview and gets:

- a **Preview** banner on every page with the branch and commit it was built from;
- `<meta name="robots" content="noindex, nofollow">` on every page;
- an `X-Robots-Tag: noindex, nofollow, noarchive` header from the middleware;
- a `robots.txt` that disallows everything.

The download buttons follow the same rule (`lib/cadencea-vault-releases.mjs`):
the live site reads the released app's update feed (`updates/cadencea-vault/`),
while previews read the v2 beta feed (`updates/cadencea-vault-beta/`), where
"CadenceaVault Beta" builds are published. Until the first beta build is
uploaded there, the preview's download buttons show as unavailable instead of
offering the v1 installers.

None of this needs to be removed at launch. When `cadencea-v2-beta` is merged
into `main` and deployed to production, the banner and the noindex rules switch
off by themselves and `robots.txt` allows crawling.

## v2-only pages and how they're gated

The new v2 pages (Market, Publish, Studio, Credits, the Stream teaser) exist
only on previews, so merging this branch early can't publish them:

- **Routes.** They live in the `app/(v2)/` route group. Its server layout calls
  `notFound()` unless `isPreviewSite()` is true, and so does every page in it
  and its `generateMetadata`: Next renders a page alongside its layout, so a
  layout-only gate would still stream the page's content inside production's
  404. `tests/v2-preview-gate.test.mjs` checks all three.
- **Read at runtime.** `RootLayout` awaits `headers()`, so every route renders
  per request and the gate reads `VERCEL_ENV` (or `SITE_CHANNEL`) when the page
  is served. A local production check needs `SITE_CHANNEL=production` for both
  `npm run build` and `npm start`; otherwise the gate stays open.
- **Navigation.** `RootLayout` computes `isPreviewSite()` once and passes it as
  `showV2` to the `Navbar` and `Footer` and through `V2FlagProvider`
  (`useShowV2()`) to client components. Client code never calls
  `isPreviewSite()`: `VERCEL_ENV` doesn't exist in the browser, so it would
  always answer "preview".
- **Redirects.** On previews `next.config.ts` sends `/vst-plugins` and `/cart` to
  `/market` (307). The rule is evaluated at build time; production keeps both pages.
- **Demo data only.** Everything under `app/(v2)/`, `components/ui/`,
  `components/v2/` and `lib/v2-demo/` is local demo data with no API, Supabase
  or payment calls (`tests/v2-no-network.test.mjs`). Demo changes are kept in
  `localStorage` under `cadencea.v2-demo.*` keys, per browser, and every v2 page
  shows a demo notice.

`docs/V2-WORK-PACKAGES.md` lists which files each v2 work package may change.

## Preview environment variables

Vercel scopes each environment variable to Production, Preview and/or
Development. Preview deployments use the **Preview** values. Check them in
**Settings → Environment Variables** before relying on the v2 preview:

| Variable | Preview value |
|---|---|
| `NEXT_PUBLIC_API_URL` | The staging API once it exists. Until then it may point at the production API: sign in only with a test account and don't buy anything. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The staging Supabase project once it exists. |
| `SUPABASE_SERVICE_ROLE_KEY` | Never the production key once staging exists: server routes in a v2 draft run with it. |
| `SMTP_*`, `NEWSLETTER_*` | A test inbox, or leave unset so previews can't email real subscribers. |

If a variable is set for Production only, preview builds won't have it and the
page that needs it will fail; that is safer than silently using production.

## Day-to-day workflow

```bash
git checkout cadencea-v2-beta
npm run dev            # http://localhost:3000, shows the Preview banner
git push               # Vercel builds a new v2 preview
```

Fixes for the live site still go to `main` (directly or through a short-lived
branch). Bring them into v2 regularly so the two don't drift:

```bash
git checkout cadencea-v2-beta
git merge main
```

Never merge `cadencea-v2-beta` into `main` before the v2 launch: a push to `main`
deploys to cadencea.app.
