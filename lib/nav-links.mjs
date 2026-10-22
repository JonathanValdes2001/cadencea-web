/**
 * The header links, shared by the navbar (desktop and mobile menu) and the
 * footer's Product column. `storeOpen` is RootLayout's server-side
 * pluginStoreOpen() (lib/plugins/store-gate.mjs), so Plugins is linked exactly
 * when /vst-plugins serves the store. Parked features are never linked.
 */

/**
 * @param {boolean} storeOpen
 * @returns {{ href: string, label: string }[]}
 */
export function navLinksFor(storeOpen) {
  return [
    { href: '/cadenceavault', label: 'Cadencea Vault' },
    ...(storeOpen === true ? [{ href: '/vst-plugins', label: 'Plugins' }] : []),
    { href: '/pricing', label: 'Pricing' },
  ]
}
