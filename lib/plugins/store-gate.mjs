/**
 * The launch switch for the plugin store (docs/plugins/PLUGIN-LAUNCH-PLAN.md S6:
 * "the store stays preview-only until go-live").
 *
 * The store (/vst-plugins catalog, /vst-plugins/<family>, /cart and the cart
 * button) is served when EITHER:
 *   1. this is a preview deployment (`isPreviewSite()`, lib/site-channel.mjs):
 *      the v2 preview, branch previews and `npm run dev`; or
 *   2. PLUGIN_STORE_LIVE is true: the go-live switch, flipped at launch.
 * On production with the switch off, /vst-plugins keeps the "coming" page and
 * the product page and cart answer 404, even after cadencea-v2-beta is merged
 * into main.
 *
 * Not gated: /account (Vault links to it) and /activate/<id> (compiled into
 * the plugins). They work on every deployment and simply hide store links
 * while the store is closed.
 *
 * Server-only by convention, like the site channel: client components get the
 * result as a prop (VERCEL_ENV doesn't exist in the browser).
 */

import { isPreviewSite } from '../site-channel.mjs'

/** THE GO-LIVE SWITCH. false: production shows the "coming" page; previews show the store. */
export const PLUGIN_STORE_LIVE = false

/**
 * @param {Record<string, string | undefined>} [env]
 * @param {boolean} [live] the switch; a parameter only so tests can try both positions
 * @returns {boolean}
 */
export function pluginStoreOpen(env = process.env, live = PLUGIN_STORE_LIVE) {
  return live === true || isPreviewSite(env)
}

/**
 * Which Cadencea Vault this deployment sends people to: previews offer the
 * CadenceaVault Beta downloads (lib/cadencea-vault-releases.mjs), so their
 * "Open Cadencea Vault" links use the beta URL scheme too.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {'stable' | 'beta'}
 */
export function siteVaultChannel(env = process.env) {
  return isPreviewSite(env) ? 'beta' : 'stable'
}
