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
  /** The product's own page: /vst-plugins/<slug>. */
  slug: string;
  /** What kind of plugin it is; the store's Type filter. */
  category: string;
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
export const LOKI_ACCENT = '#58de78';

/** The seats every launch license has (S0 decision 4). */
export const SEATS_PER_LICENSE = 3;

export const PLUGIN_PRODUCTS: readonly PluginProduct[] = [
  {
    id: 'cadencea.athena-complex',
    slug: 'athena-eq-complex',
    category: 'EQ',
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
    slug: 'athena-eq-mini',
    category: 'EQ',
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
  {
    id: 'cadencea.loki-complex',
    slug: 'loki-delay-complex',
    category: 'Delay',
    tier: 'complex',
    name: 'LOKI Delay Complex',
    family: 'LOKI Delay',
    edition: 'Complex',
    tagline: 'A dark digital, tape and BBD echo with six taps, four Sorcery effects on the repeats and the Ragnarök build.',
    features: [
      'Everything in LOKI Delay Mini',
      'Six taps on a sixteen-step lap',
      'Sorcery on the repeats: Shapeshift, Haze, Mirror and Serpent',
      'Ragnarök: hold it and the repeats build into a storm',
      'Drive, Width and Freeze',
      '24 factory presets',
      'Zero latency',
    ],
    screenshot: {
      src: '/plugins/loki/loki-complex-default.png',
      width: 2000,
      height: 1760,
      alt: 'LOKI Delay Complex: the echo display, delay, feedback and character controls, the taps, Sorcery and Ragnarök',
    },
    accent: LOKI_ACCENT,
    fallback: {
      id: 'cadencea.loki-complex',
      name: 'LOKI Delay Complex',
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
    id: 'cadencea.loki-mini',
    slug: 'loki-delay-mini',
    category: 'Delay',
    tier: 'mini',
    name: 'LOKI Delay Mini',
    family: 'LOKI Delay',
    edition: 'Mini',
    tagline: 'A dark digital, tape and BBD echo with tempo sync, tap tempo, LoFi, modulation and ducking. Free.',
    features: [
      'Five character voices: Clean, Warm, Tape, BBD and Broken',
      'Sync to the host, set your own BPM, or set the time in milliseconds',
      'Tap tempo',
      'Feedback up to 200 %, with an endless loop past 100 %',
      'LoFi, modulation, and high-pass and low-pass filters you can link',
      'Ducking and ping-pong',
      '14 factory presets',
      'Zero latency',
    ],
    screenshot: {
      src: '/plugins/loki/loki-mini-default.png',
      width: 2000,
      height: 1120,
      alt: 'LOKI Delay Mini: the echo display with delay, feedback, modulation, filters, character and duck controls',
    },
    accent: LOKI_ACCENT,
    fallback: {
      id: 'cadencea.loki-mini',
      name: 'LOKI Delay Mini',
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

export function pluginBySlug(slug: string): PluginProduct | undefined {
  return PLUGIN_PRODUCTS.find((product) => product.slug === slug);
}

/** A product's own page: /vst-plugins/athena-eq-complex. */
export function productPageHref(id: string): string {
  const product = pluginById(id);
  return product ? `/vst-plugins/${product.slug}` : '/vst-plugins';
}

/** The local copy paired with the listed (API or fallback) price. */
export function withListing(listed: readonly ListedProduct[], id: string): ListedProduct | undefined {
  return listed.find((product) => product.id === id);
}

/** Formats and platforms, the same for every plugin (S0 decision 2). */
export const PLUGIN_REQUIREMENTS = [
  { label: 'Windows', value: 'Windows 10 or later, 64-bit (x64). VST3 and CLAP.' },
  { label: 'macOS', value: 'macOS 12 or later, universal (Apple Silicon and Intel). VST3, CLAP and Audio Unit.' },
  { label: 'Install and activate', value: 'Cadencea Vault, free for Windows and macOS, signed in with your Cadencea account.' },
  { label: 'Computers', value: `Up to ${SEATS_PER_LICENSE} computers per license. Free a computer any time in Cadencea Vault or on your account page.` },
] as const;

/** @deprecated Use PLUGIN_REQUIREMENTS. */
export const ATHENA_REQUIREMENTS = PLUGIN_REQUIREMENTS;
