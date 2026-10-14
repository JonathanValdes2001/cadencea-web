/**
 * Maya Lind's historical demo wallet from CREDITS-MODEL §10,
 * with the current allowance and rollover policy. Historical grants stay intact.
 * 29 included + 260 bought = 289 credits (€28.90) on Standard. The /credits
 * page, the Navbar chip and Market purchases all start from it (WEB-V2-SPEC §2.5).
 */
import type { Wallet } from './types.ts';

export const WALLET_SEED: Wallet = {
  "schema": "cadencea.credits.wallet.v1",
  "preview": true,
  "as_of": "2026-10-10T09:00:00Z",
  "user": { "id": "demo-maya", "display_name": "Maya Lind" },
  "unit": { "currency": "EUR", "eur_cents_per_credit": 10, "vat_included": true },
  "plan": {
    "id": "standard",
    "name": "Standard",
    "billing": "monthly",
    "monthly_credits": 10,
    "rollover_cap": null,
    "next_grant_at": "2026-11-03T00:00:00Z",
    "introductory": true
  },
  "balances": { "included": 29, "bought": 260, "total": 289, "total_eur_cents": 2890 },
  "buckets": {
    "included": {
      "label": "Included",
      "cap": null,
      "cap_counts": "monthly_grant",
      "lots": [
        { "lot_id": "inc_welcome", "source": "welcome", "scope": "cadencea_originals", "granted": 30, "remaining": 0, "granted_at": "2026-08-03T10:12:00Z", "expires_at": "2026-10-02T10:12:00Z", "status": "expired" },
        { "lot_id": "inc_2026_08", "source": "monthly_grant", "scope": "all", "granted": 30, "remaining": 0, "granted_at": "2026-08-03T10:14:00Z", "expires_at": null, "status": "spent" },
        { "lot_id": "inc_2026_09", "source": "monthly_grant", "scope": "all", "granted": 30, "remaining": 0, "granted_at": "2026-09-03T00:00:00Z", "expires_at": null, "status": "spent" },
        { "lot_id": "inc_2026_10", "source": "monthly_grant", "scope": "all", "granted": 30, "remaining": 29, "granted_at": "2026-10-03T00:00:00Z", "expires_at": null, "status": "active" }
      ]
    },
    "bought": {
      "label": "Bought",
      "cap": 2000,
      "lots": [
        { "lot_id": "buy_2026_08_20", "source": "topup", "credits": 250, "paid_eur_cents": 2500, "remaining": 160, "purchased_at": "2026-08-20T18:40:00Z", "refundable_until": "2026-09-03T18:40:00Z", "expires_at": null, "status": "active" },
        { "lot_id": "buy_2026_10_05", "source": "topup", "credits": 100, "paid_eur_cents": 1000, "remaining": 100, "purchased_at": "2026-10-05T12:05:00Z", "refundable_until": "2026-10-19T12:05:00Z", "expires_at": null, "status": "active" }
      ]
    }
  },
  "ledger": [
    { "id": "led_001", "at": "2026-08-03T10:12:00Z", "type": "platform_adjust", "reason": "welcome_credits", "wallet": "included", "credits": 30, "eur_cents": 300, "lots": [{ "lot_id": "inc_welcome", "credits": 30 }], "balance_after": { "included": 30, "bought": 0 }, "memo": "Welcome credits for Cadencea Originals" },
    { "id": "led_002", "at": "2026-08-03T10:14:00Z", "type": "monthly_grant", "reason": "plan_start", "wallet": "included", "credits": 30, "eur_cents": 300, "lots": [{ "lot_id": "inc_2026_08", "credits": 30 }], "ref": { "plan": "standard", "invoice": "in_demo_0803" }, "balance_after": { "included": 60, "bought": 0 }, "memo": "Standard: 30 included credits" },
    { "id": "led_003", "at": "2026-08-05T20:31:00Z", "type": "purchase", "credits": -20, "eur_cents": -200, "split": { "included": -20, "bought": 0 }, "lots": [{ "lot_id": "inc_welcome", "credits": -20 }], "item": { "id": "orig_tape_drums_v1", "title": "Tape Drums Vol. 1", "kind": "sample_pack", "seller": "Cadencea Originals", "first_party": true, "price_credits": 20, "seller_earns_eur_cents": 0 }, "balance_after": { "included": 40, "bought": 0 }, "memo": "Tape Drums Vol. 1" },
    { "id": "led_004", "at": "2026-08-20T18:40:00Z", "type": "topup", "wallet": "bought", "credits": 250, "eur_cents": 2500, "paid_eur_cents": 2500, "lots": [{ "lot_id": "buy_2026_08_20", "credits": 250 }], "ref": { "checkout": "cs_demo_0820" }, "balance_after": { "included": 40, "bought": 250 }, "memo": "Top-up €25" },
    { "id": "led_005", "at": "2026-08-21T21:02:00Z", "type": "purchase", "credits": -120, "eur_cents": -1200, "split": { "included": -30, "bought": -90 }, "lots": [{ "lot_id": "inc_2026_08", "credits": -30 }, { "lot_id": "buy_2026_08_20", "credits": -90 }], "item": { "id": "pk_dusty_keys", "title": "Dusty Keys: Lo-fi Sample Pack", "kind": "sample_pack", "seller": "Arlo Beats", "first_party": false, "price_credits": 120, "seller_earns_eur_cents": 600 }, "balance_after": { "included": 10, "bought": 160 }, "memo": "Dusty Keys: Lo-fi Sample Pack" },
    { "id": "led_006", "at": "2026-09-03T00:00:00Z", "type": "monthly_grant", "reason": "renewal", "wallet": "included", "credits": 30, "eur_cents": 300, "lots": [{ "lot_id": "inc_2026_09", "credits": 30 }], "ref": { "plan": "standard", "invoice": "in_demo_0903" }, "balance_after": { "included": 40, "bought": 160 }, "memo": "Standard: 30 included credits" },
    { "id": "led_007", "at": "2026-09-12T16:20:00Z", "type": "purchase", "credits": -60, "eur_cents": -600, "split": { "included": -30, "bought": -30 }, "lots": [{ "lot_id": "inc_2026_09", "credits": -30 }, { "lot_id": "buy_2026_08_20", "credits": -30 }], "item": { "id": "pp_analog_bass", "title": "Analog Bass (Serum 2)", "kind": "preset_pack", "seller": "Nadia Waves", "first_party": false, "price_credits": 60, "seller_earns_eur_cents": 300 }, "balance_after": { "included": 10, "bought": 130 }, "memo": "Analog Bass (Serum 2)" },
    { "id": "led_008", "at": "2026-09-14T09:05:00Z", "type": "refund", "reason": "not_downloaded_within_14_days", "refund_of": "led_007", "credits": 60, "eur_cents": 600, "split": { "included": 30, "bought": 30 }, "lots": [{ "lot_id": "inc_2026_09", "credits": 30 }, { "lot_id": "buy_2026_08_20", "credits": 30 }], "seller_reversal_eur_cents": -300, "balance_after": { "included": 40, "bought": 160 }, "memo": "Returned: Analog Bass (not downloaded)" },
    { "id": "led_009", "at": "2026-10-02T10:12:00Z", "type": "expiry", "wallet": "included", "credits": -10, "eur_cents": -100, "lots": [{ "lot_id": "inc_welcome", "credits": -10 }], "balance_after": { "included": 30, "bought": 160 }, "memo": "Welcome credits expired" },
    { "id": "led_010", "at": "2026-10-03T00:00:00Z", "type": "monthly_grant", "reason": "renewal", "wallet": "included", "credits": 30, "eur_cents": 300, "lots": [{ "lot_id": "inc_2026_10", "credits": 30 }], "ref": { "plan": "standard", "invoice": "in_demo_1003" }, "balance_after": { "included": 60, "bought": 160 }, "memo": "Standard: 30 included credits" },
    { "id": "led_011", "at": "2026-10-05T12:05:00Z", "type": "topup", "wallet": "bought", "credits": 100, "eur_cents": 1000, "paid_eur_cents": 1000, "lots": [{ "lot_id": "buy_2026_10_05", "credits": 100 }], "ref": { "checkout": "cs_demo_1005" }, "balance_after": { "included": 60, "bought": 260 }, "memo": "Top-up €10" },
    { "id": "led_012", "at": "2026-10-06T22:47:00Z", "type": "purchase", "credits": -1, "eur_cents": -10, "split": { "included": -1, "bought": 0 }, "lots": [{ "lot_id": "inc_2026_09", "credits": -1 }], "item": { "id": "lp_midnight_rhodes", "title": "Midnight Rhodes 92 BPM", "kind": "loop", "seller": "Arlo Beats", "first_party": false, "price_credits": 1, "seller_earns_eur_cents": 5 }, "balance_after": { "included": 59, "bought": 260 }, "memo": "Midnight Rhodes 92 BPM" },
    { "id": "led_013", "at": "2026-10-07T19:15:00Z", "type": "purchase", "credits": -30, "eur_cents": -300, "split": { "included": -30, "bought": 0 }, "lots": [{ "lot_id": "inc_2026_09", "credits": -29 }, { "lot_id": "inc_2026_10", "credits": -1 }], "item": { "id": "pp_velvet_pads", "title": "Velvet Pads (Vital)", "kind": "preset_pack", "seller": "Kofi Sound", "first_party": false, "price_credits": 30, "seller_earns_eur_cents": 150 }, "balance_after": { "included": 29, "bought": 260 }, "memo": "Velvet Pads (Vital)" }
  ]
};
