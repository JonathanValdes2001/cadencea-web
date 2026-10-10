/**
 * Every credit number the v2 demo uses, transcribed once from
 * docs/v2/CREDITS-MODEL.md (section numbers in the comments) as WEB-V2-SPEC §6.2
 * lays it out. Copy and UI never hardcode these numbers; they read them here.
 * tests/v2-foundation.test.mjs pins the values, so a change to the model updates
 * this file and the test together.
 */
export const CREDITS = {
  source: 'docs/v2/CREDITS-MODEL.md',
  eurCentsPerCredit: 10,                                   // §2
  monthly: { free: 0, basic: 10, standard: 30, pro: 50 },  // §3
  rolloverMultiple: 2,                                     // §3: cap = 2 × monthly
  welcome: { credits: 30, validDays: 60, scope: 'cadencea_originals' }, // §3
  topUp: { quickPicks: [{ credits: 100, eurCents: 1000 }, { credits: 250, eurCents: 2500 }, { credits: 500, eurCents: 5000 }],
           exact: { minEurCents: 1000, maxEurCents: 10000, stepEurCents: 500 }, bonus: 0 },  // §4
  boughtCap: 2000,                                         // §5.4
  refundDays: { topUp: 14, undownloadedItem: 14 },         // §5.3
  cancelGraceDays: 30,                                     // §5.5
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

/** Rollover cap for a plan's included credits (§3): 2 × the monthly amount. */
export function rolloverCap(plan: PlanId): number {
  return CREDITS.monthly[plan] * CREDITS.rolloverMultiple;
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
