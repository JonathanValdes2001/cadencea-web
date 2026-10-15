/**
 * The Market, Publish, Studio, Credits and Stream routes are parked (v2
 * re-scope, 2026-10-15; docs/v2/README.md "Hidden, not deleted"). Their code
 * stays in the repo, and this module holds the one switch that decides whether
 * their routes exist.
 *
 * A parked route is served only when BOTH gates are open:
 *   1. the v2 gate: `isPreviewSite()` (lib/site-channel.mjs), which keeps v2
 *      pages off production until the v2 launch decides otherwise; and
 *   2. this switch, PARKED_FEATURES_OPEN, which stays false until the Market
 *      work resumes.
 * Opening the v2 gate at launch therefore cannot publish a parked route.
 * See docs/PARKED-FEATURES.md for what flipping it brings back, and what it
 * doesn't.
 */

import { isPreviewSite } from './site-channel.mjs'

/** THE SWITCH. false: every parked route answers 404, on previews and production alike. */
export const PARKED_FEATURES_OPEN = false

/**
 * The URL spaces owned by parked features. Each also covers its sub-routes
 * (/market/<slug>, /market/u/<handle>, /publish/<type>, /studio/<id>/edit).
 */
export const PARKED_ROUTE_PREFIXES = ['/market', '/publish', '/studio', '/credits', '/stream']

/**
 * Where the middleware sends a blocked request. No route lives here, so Next
 * renders app/not-found.tsx; the middleware also forces the 404 status.
 */
export const PARKED_NOT_FOUND_PATH = '/_parked-feature-not-found'

/**
 * @param {Record<string, string | undefined>} [env]
 * @param {boolean} [open] the switch; a parameter only so tests can try both positions
 * @returns {boolean}
 */
export function parkedRoutesOpen(env = process.env, open = PARKED_FEATURES_OPEN) {
  return open === true && isPreviewSite(env)
}

/**
 * Whether `pathname` belongs to a parked feature. Decodes and normalizes first,
 * because the router matches the decoded path: `/%6Darket` is /market.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isParkedPath(pathname) {
  let path = String(pathname)
  try {
    path = decodeURIComponent(path)
  } catch {
    // A malformed escape can't name a route; match what's literally there.
  }
  path = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/').toLowerCase()
  return PARKED_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
