/**
 * Every credit number the v2 demo uses, kept in sync with
 * docs/V2-CREDITS.md. Earlier section numbers describe the legacy demo model. Copy and UI never hardcode these numbers; they read them here.
 * tests/v2-foundation.test.mjs pins the values, so a change to the model updates
 * this file and the test together.
 */
export const CREDITS = {
  source: 'docs/V2-CREDITS.md',
  eurCentsPerCredit: 10,                                   // §2
  monthly: { free: 0, basic: 5, standard: 10, pro: 20 },
  rolloverMultiple: null,                                  // Unlimited rollover
  welcome: { credits: 0, validDays: 60, scope: 'cadencea_originals' },
  topUp: {
    quickPicks: [{ credits: 100, eurCents: 1000 }, { credits: 300, eurCents: 2850 }, { credits: 1000, eurCents: 9000 }],
    exact: { minCredits: 100, maxCredits: 1000, stepCredits: 50 },
    discounts: [{ minCredits: 1000, percent: 10 }, { minCredits: 300, percent: 5 }],
  },
  boughtCap: 2000,                                         // §5.4
  refundDays: { topUp: 14, undownloadedItem: 14 },         // §5.3
  spendOrder: ['included', 'bought'],                      // §5.1
  priceList: {                                             // §6.1
    oneShot: 1, loop: 1, midiFile: 1, preset: 2,
    pack: { min: 20, max: 300, step: 10 },                 // sample and preset packs
    midiPack: { min: 10, max: 300, step: 10 },             // §6.1, DECISIONS.md D3
    splitsLoop: { min: 0, max: 1 }, splitsPack: { min: 0, max: 100, step: 10 },
    themeStandard: 30, themePremium: 80, originalsPack: { min: 20, max: 100 },
  },
  beatTiers: {                                             // §6.2, card, euros incl. VAT; keys = RL LEASE_TIER_IDS
    wav:       { label: 'WAV lease',       defaultEur: 30,  minEur: 20,  maxEur: 60,  streams: 500_000 },
    stems:     { label: 'Stems lease',     defaultEur: 75,  minEur: 50,  maxEur: 150, streams: 2_000_000 },
    unlimited: { label: 'Unlimited lease', defaultEur: 150, minEur: 100, maxEur: 300, streams: null },
    exclusive: { label: 'Exclusive',       defaultEur: 500, minEur: 300, maxEur: null, streams: null },
  },
  cardOrderMinEurCents: 300, fanSupportMinEurCents: 300,  // §6.2
  cardFeeEea: { pct: 0.024, fixedEurCents: 17 },           // §8.1, for the "You earn about" line
  vatRate: 0.25,                                           // §8.1 worked examples (Norway)
  sellerEurCentsPerCredit: 5,                              // §7
  cardSellerShare: { default: 0.9, pro: 0.95 },            // §6.2
  detectCostCredits: 0,                                    // locked: Detect is free
} as const;

export type PlanId = keyof typeof CREDITS.monthly;

/** null is serialized explicitly: every plan has unlimited rollover. */
export function rolloverCap(_plan: PlanId): null {
  return null;
}

/** A bulk discount reduces the payment, keeping the seller's credit payout fixed. */
export function topUpQuote(credits: number): { credits: number; eurCents: number; discountPercent: number } {
  const discountPercent = CREDITS.topUp.discounts.find((tier) => credits >= tier.minCredits)?.percent ?? 0;
  return { credits, eurCents: Math.round(credits * CREDITS.eurCentsPerCredit * (100 - discountPercent) / 100), discountPercent };
}

/** What a seller earns for a credit sale, in euro cents (§7): €0.05 per credit. */
export function sellerEarnsEurCents(credits: number): number {
  return credits * CREDITS.sellerEurCentsPerCredit;
}

/**
 * "You earn about €{x} per lease" (§6.2, §8.1): 90% (95% for Pro sellers) of the
 * price after VAT and the EEA card fee, in euro cents. €30 → 2080 (€20.80).
 */
export function cardSellerEarnsEurCents(priceEurCents: number, pro = false): number {
  const net = priceEurCents / (1 + CREDITS.vatRate);
  const fee = priceEurCents * CREDITS.cardFeeEea.pct + CREDITS.cardFeeEea.fixedEurCents;
  const share = pro ? CREDITS.cardSellerShare.pro : CREDITS.cardSellerShare.default;
  return Math.round(Math.round(net - fee) * share);
}
