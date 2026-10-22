/**
 * Which copy of the website this deployment is.
 *
 * Production (cadencea.app) is the Vercel production deployment of `main`.
 * Every other deployment is a preview: the Cadencea v2 site built from the
 * `cadencea-v2-beta` branch, any other branch preview, and local `next dev` or
 * `next start`. Previews are kept out of search engines and labelled on every
 * page, so a v2 draft can never be mistaken for, or compete with, the live site.
 *
 * Vercel sets VERCEL_ENV to "production" only for production deployments.
 * SITE_CHANNEL=production forces production when the site is built outside
 * Vercel; nothing else can turn a preview into production.
 */

/** @typedef {'production' | 'preview'} SiteChannel */

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {SiteChannel}
 */
export function getSiteChannel(env = process.env) {
  if (env.SITE_CHANNEL === 'production' || env.VERCEL_ENV === 'production') {
    return 'production'
  }
  return 'preview'
}

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function isPreviewSite(env = process.env) {
  return getSiteChannel(env) === 'preview'
}

/**
 * What a reviewer needs to know about a preview: which branch and commit it
 * was built from. Empty strings when not deployed by Vercel (local runs).
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ branch: string, commit: string, isLocal: boolean }}
 */
export function getPreviewDetails(env = process.env) {
  return {
    branch: env.VERCEL_GIT_COMMIT_REF || '',
    commit: (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
    isLocal: !env.VERCEL_ENV,
  }
}

/** Robots directive sent with every preview page (header and meta tag). */
export const PREVIEW_ROBOTS_DIRECTIVE = 'noindex, nofollow, noarchive'
