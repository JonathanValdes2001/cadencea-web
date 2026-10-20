/**
 * What the website says about each plugin. Prices here are the FALLBACK shown
 * when the licensing API can't be reached; the API's store list wins whenever
 * it answers (lib/plugins/store-products.ts). Product ids never change once
 * shipped: they are in license tokens, the catalog, Vault and the plugins'
 * compiled `cadencea.app/activate/<id>` links.
 *
 * Every claim below comes from the plugin spec (pantheon `docs/spec/athena.md`)
 * or the launch decisions (docs/plugins/PLUGIN-LAUNCH-PLAN.md S0). Don't add
 * claims that aren't there: no update promises, no performance figures.
 */

import type { ListedProduct, StoreProduct } from './catalog';

export type PluginTier = 'mini' | 'complex';

export interface PluginScreenshot {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface PluginProduct {
  id: string;
  /** The family page: /vst-plugins/<slug>. */
  slug: string;
  tier: PluginTier;
  /** Full product name, as in the DAW. */
  name: string;
  family: string;
  /** "Mini" / "Complex". */
  edition: string;
  tagline: string;
  features: readonly string[];
  screenshot: PluginScreenshot;
  /** The family's color. Decorative only (a mark or a rule), never text on white. */
  accent: string;
  fallback: StoreProduct;
}

export const ATHENA_ACCENT = '#ddb45c';

/** The seats every launch license has (S0 decision 4). */
export const SEATS_PER_LICENSE = 3;

export const PLUGIN_PRODUCTS: readonly PluginProduct[] = [
  {
    id: 'cadencea.athena-complex',
    slug: 'athena',
    tier: 'complex',
    name: 'ATHENA EQ Complex',
    family: 'ATHENA EQ',
    edition: 'Complex',
    tagline: 'The full ATHENA: 24 bands, dynamics, sidechain, stereo placement and EQ Match.',
    features: [
      'Up to 24 bands, placed by clicking in the Aegis display',
      'Dynamic bands with threshold and ratio',
      'Sidechain input: a dynamic band can duck under a kick or a vocal',
      'Per-band placement: stereo, mid, side, left or right',
      'Auto gain keeps the level while you shape the tone',
      'Real-time analyzer in the Aegis display',
      'EQ Match: make your track’s tonal balance meet a reference',
      'Zero latency',
    ],
    screenshot: {
      src: '/plugins/athena/athena-complex-dynamic.png',
      width: 2160,
      height: 1320,
      alt: 'ATHENA EQ Complex: the Aegis display with an EQ curve, a dynamic band selected and its threshold and ratio controls',
    },
    accent: ATHENA_ACCENT,
    fallback: {
      id: 'cadencea.athena-complex',
      name: 'ATHENA EQ Complex',
      type: 'effect',
      isFree: false,
      priceMinor: 4999,
      currency: 'EUR',
      maxActivations: SEATS_PER_LICENSE,
      trialDays: null,
      purchasable: false,
    },
  },
  {
    id: 'cadencea.athena-mini',
    slug: 'athena',
    tier: 'mini',
    name: 'ATHENA EQ Mini',
    family: 'ATHENA EQ',
    edition: 'Mini',
    tagline: 'An eight-band EQ for every track. Free.',
    features: [
      '8 bands, each with its own on/off switch',
      'Low cut, low shelf, bell, notch, high shelf and high cut on any band',
      'Gain scale: turn every move up or down at once',
      'Output gain',
      'Zero latency',
      'The same filters as ATHENA EQ Complex',
    ],
    screenshot: {
      src: '/plugins/athena/athena-mini-shaped.png',
      width: 1760,
      height: 1120,
      alt: 'ATHENA EQ Mini: an EQ curve shaped with several bands in the Aegis display, with the band strip and knobs below',
    },
    accent: ATHENA_ACCENT,
    fallback: {
      id: 'cadencea.athena-mini',
      name: 'ATHENA EQ Mini',
      type: 'effect',
      isFree: true,
      priceMinor: 0,
      currency: 'EUR',
      maxActivations: SEATS_PER_LICENSE,
      trialDays: null,
      purchasable: false,
    },
  },
];

/** The fallback store list, in display order (ATHENA first; Complex before Mini). */
export const FALLBACK_STORE_PRODUCTS: readonly StoreProduct[] = PLUGIN_PRODUCTS.map((product) => product.fallback);

export function pluginById(id: string): PluginProduct | undefined {
  return PLUGIN_PRODUCTS.find((product) => product.id === id);
}

export function pluginBySlugAndTier(slug: string, tier: PluginTier): PluginProduct | undefined {
  return PLUGIN_PRODUCTS.find((product) => product.slug === slug && product.tier === tier);
}

/** The product page and anchor for a product id: /vst-plugins/athena#complex. */
export function productPageHref(id: string): string {
  const product = pluginById(id);
  return product ? `/vst-plugins/${product.slug}#${product.tier}` : '/vst-plugins';
}

/** The local copy paired with the listed (API or fallback) price. */
export function withListing(listed: readonly ListedProduct[], id: string): ListedProduct | undefined {
  return listed.find((product) => product.id === id);
}

/** Formats and platforms, identical for both ATHENA editions (S0 decision 2). */
export const ATHENA_REQUIREMENTS = [
  { label: 'Windows', value: 'Windows 10 or later, 64-bit (x64). VST3 and CLAP.' },
  { label: 'macOS', value: 'macOS 12 or later, universal (Apple Silicon and Intel). VST3, CLAP and Audio Unit.' },
  { label: 'Install and activate', value: 'Cadencea Vault, free for Windows and macOS, signed in with your Cadencea account.' },
  { label: 'Computers', value: `Up to ${SEATS_PER_LICENSE} computers per license. Free a computer any time in Cadencea Vault or on your account page.` },
] as const;
