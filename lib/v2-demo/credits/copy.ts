/**
 * Credit UI strings, verbatim from docs/v2/CREDITS-MODEL.md §9. Fill "{name}"
 * placeholders with `fill()` from ../format.ts; don't retype these strings.
 * Rules (§9): credits are "included", never "free"; no absolutes about prices
 * or rates; every credit price carries its euro price; Detect is the only thing
 * called free.
 */

/** §9.1: the credits section on /pricing and the per-plan lines. */
export const PRICING_CREDITS = {
  eyebrow: 'Market credits · Preview',
  heading: 'Credits for sounds, presets and MIDI',
  subheading: 'Standard price: 1 credit = €0.10. Bulk top-ups cost less; every item shows credits and euros.',
  cards: [
    {
      title: 'Included with your plan',
      body: "Free 0, Basic 5, Standard 10 and Pro 20 credits every month. Unused credits roll over without a cap.",
    },
    {
      title: 'Top up when you need more',
      body: "100 credits for €10, 300 for €28.50 (save 5%) or 1,000 for €90 (save 10%). Bought credits do not expire; unspent credits are refundable for 14 days at the price paid.",
    },
    {
      title: 'Money buys music',
      body: 'Credits buy tools for making music. Beats, songs and fan support are paid by card, so artists get one clear price.',
    },
  ],
  priceStrip:
    'One-shot, loop or MIDI file: 1 credit (€0.10) · Preset: 2 credits (€0.20) · Packs: 10–300 credits (€1–€30)',
  footnote:
    "Detect (key, BPM and tags) is free on every plan. Credits are spent only at Cadencea and are never paid out or sent between users. Prices include VAT. Included amounts are introductory. Preview: credits aren't on sale yet.",
  planLines: {
    free: '0 monthly Market credits',
    basic: '5 Market credits a month (€0.50)',
    standard: '10 Market credits a month (€1)',
    pro: '20 Market credits a month (€2)',
  },
} as const;

/** The preview-only pricing FAQ item (WEB-V2-SPEC §5.5); production doesn't announce the Market yet. */
export const PRICING_MARKET_FAQ = {
  q: 'What are Market credits?',
  a: 'Credits for sounds, presets, MIDI and themes on Cadencea Market, planned for Cadencea 2.0. Paid plans are planned to include some every month. See the credits section above.',
} as const;

/** §9.2: the seven-step explainer. */
export const CREDITS_EXPLAINER = [
  {
    title: 'Get credits.',
    body: 'Paid plans include 5, 10 or 20 credits every month. Free accounts receive no included or welcome credits. Anyone can top up from €10.',
  },
  { title: 'See the euros.', body: 'Standard top-up price: €0.10 per credit, VAT included. Buy 300 or more to save 5%, or 1,000 to save 10%.' },
  {
    title: 'Spend them.',
    body: 'We use your included credits first, then the credits you bought, oldest first. Checkout shows exactly which ones.',
  },
  {
    title: 'Keep them.',
    body: "Unused included credits roll over without a cap. Already earned and bought credits stay available when you downgrade or cancel.",
  },
  {
    title: 'Change your mind.',
    body: "Unspent credits from a top-up are refundable for 14 days. A purchase you haven't downloaded can be returned within 14 days.",
  },
  {
    title: 'Where your credits go.',
    body: 'Creators earn €0.05 for every credit you spend on their work, paid monthly in euros.',
  },
  {
    title: 'Complete a pack.',
    body: 'Valid purchases of individual files reduce the remaining pack price. You never pay for the same purchase twice.',
  },
  {
    title: 'Closed loop.',
    body: "Credits are spent only at Cadencea. They can't be cashed out, sent to other users or used to buy beats, songs, fan support or plans.",
  },
] as const;

/** §9.3: the wallet card (Vault beta card and the /credits balance row). */
export const WALLET_COPY = {
  title: 'Credits',
  badge: 'Preview',
  balance: '{total} credits',
  euroLine: '€{total_eur} at Market prices',
  includedRow: 'Included · {included}',
  includedHint: 'Unlimited rollover',
  boughtRow: 'Bought · {bought}',
  boughtHint: "Don't expire",
  nextGrant: '+{monthly} included on {date}',
  refundHint: '{n} bought credits refundable until {date}',
  welcomeHint: '{n} welcome credits for Cadencea Originals · until {date}',
  freePlan: 'No included credits on Free. Paid plans include 5–20 a month, or top up from €10.',
  detectLine: 'Detect key, BPM and tags: free on every plan',
  primaryButton: 'Top up on cadencea.app',
  secondaryButton: 'History',
  footer: "Preview data. Credits aren't on sale yet, and nothing here is charged.",
} as const;

/** §9.3: checkout and Publish strings. */
export const CHECKOUT_COPY = {
  buyFor: 'Buy for {credits} credits (€{eur})',
  usesSplit: 'Uses {i} included + {b} bought credits (€{eur})',
  boughtCap: 'You can hold up to 2,000 bought credits (€200). Spend some to top up again.',
  downloadConsent:
    'I want the download now. I understand that I lose my 14-day right to cancel once the download starts.',
  sellerEarnings: 'Buyers pay {credits} credits (€{eur}). You earn €{earn} per sale.',
} as const;

/** §9.4: the six Q&As. */
export const CREDITS_FAQ = [
  {
    q: 'What is a credit worth?',
    a: '1 credit is €0.10, VAT included, and every price shows both. One-shots, loops and MIDI files cost 1 credit, a preset costs 2, and creators price packs from 10 to 300 credits (€1–€30).',
  },
  {
    q: 'How do I get credits?',
    a: 'Free includes 0 credits, Basic 5, Standard 10 and Pro 20 a month. There is no welcome grant. Anyone, on any plan, can buy top-ups, with 5% off from 300 credits and 10% off at 1,000.',
  },
  {
    q: 'Do my credits expire?',
    a: "Unused included credits roll over without a cap. Already earned and bought credits remain available after downgrading or cancelling. We spend included credits before bought credits.",
  },
  {
    q: 'Can I get a refund?',
    a: "Unspent credits from a top-up are refundable to your card within 14 days at the rate you actually paid, including any bulk discount. A purchase you haven't downloaded can be returned within 14 days. After download, purchases are final unless the files are broken, misdescribed or taken down for rights reasons. If you delete your account, we refund the credits you bought and haven't spent.",
  },
  {
    q: "Why can't I use credits for beats, songs or fan support?",
    a: 'Credits buy tools for making music, and money buys music. Beat leases, songs and fan support are paid by card at one all-in price, and the artist keeps 90% after card fees (and VAT, if it applies).',
  },
  {
    q: 'Do earlier sample purchases count toward the full pack?',
    a: 'Yes. We deduct what you paid for files in the current pack from its price, never below zero. Returned purchases do not count. For a 500-credit pack, 30 credits of valid earlier purchases leave 470 to pay.',
  },
  {
    q: 'What happens if the Market closes?',
    a: "We'd give at least 90 days' notice and stop selling credits on day one. Credits you bought stay spendable during the notice period, and anything left is refunded at the price you paid. Licenses are perpetual, files in your vault stay yours, and re-downloads stay open for 12 months.",
  },
] as const;
