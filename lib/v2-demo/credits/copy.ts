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
  subheading: '1 credit = €0.10. Every price shows credits and euros side by side.',
  cards: [
    {
      title: 'Included with your plan',
      body: "Basic 10, Standard 30 and Pro 50 credits every month. Unused credits roll over, up to two months' worth.",
    },
    {
      title: 'Top up when you need more',
      body: "€10, €25 or €50, or any amount up to €100. Credits you buy don't expire, and unspent ones are refundable for 14 days.",
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
    free: '30 welcome credits for Cadencea Originals',
    basic: '10 Market credits a month (€1)',
    standard: '30 Market credits a month (€3)',
    pro: '50 Market credits a month (€5)',
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
    body: 'Paid plans include credits every month. Every new account gets 30 welcome credits for Cadencea Originals. Anyone can top up from €10.',
  },
  { title: 'See the euros.', body: '1 credit = €0.10, VAT included. Every price shows both.' },
  {
    title: 'Spend them.',
    body: 'We use your included credits first, then the credits you bought, oldest first. Checkout shows exactly which ones.',
  },
  {
    title: 'Keep them.',
    body: "Credits you buy don't expire. Included credits roll over up to two months' worth while you're subscribed.",
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
  includedHint: 'Rolls over up to {cap}',
  boughtRow: 'Bought · {bought}',
  boughtHint: "Don't expire",
  nextGrant: '+{monthly} included on {date}',
  refundHint: '{n} bought credits refundable until {date}',
  welcomeHint: '{n} welcome credits for Cadencea Originals · until {date}',
  atCap: "You're at your rollover limit ({cap}). Spend some before {date} so your next {monthly} aren't capped.",
  nearCap: "You're near your rollover limit ({cap}), so only {n} of your next {monthly} would be added. Spend some before {date} to get them all.",
  freePlan: 'No included credits on Free. Paid plans include 10–50 a month, or top up from €10.',
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
    a: 'Basic includes 10 credits a month, Standard 30 and Pro 50. Every new account gets 30 welcome credits for Cadencea Originals. Anyone, on any plan, can top up from €10.',
  },
  {
    q: 'Do my credits expire?',
    a: "Credits you buy don't expire. Included credits roll over up to two months' worth while you're subscribed. If you cancel, they stay usable for 30 days after your last paid day. Welcome credits last 60 days. We always spend included credits before the ones you bought.",
  },
  {
    q: 'Can I get a refund?',
    a: "Unspent credits from a top-up are refunded to your card in full within 14 days. A purchase you haven't downloaded can be returned within 14 days. After download, purchases are final unless the files are broken, misdescribed or taken down for rights reasons. If you delete your account, we refund the credits you bought and haven't spent.",
  },
  {
    q: "Why can't I use credits for beats, songs or fan support?",
    a: 'Credits buy tools for making music, and money buys music. Beat leases, songs and fan support are paid by card at one all-in price, and the artist keeps 90% after VAT and card fees.',
  },
  {
    q: 'What happens if the Market closes?',
    a: "We'd give at least 90 days' notice and stop selling credits on day one. Credits you bought stay spendable during the notice period, and anything left is refunded at the price you paid. Licences are perpetual, files in your vault stay yours, and re-downloads stay open for 12 months.",
  },
] as const;
