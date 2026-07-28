import type { Card } from "../types";

/**
 * Events deck — 17 cards total.
 * 3 of these are "holdable" (kind: "holdable") and can be saved for later;
 * the rest are "immediate" and resolve on draw.
 *
 * Flavor text is original content (not the copyrighted MB text).
 * Prices / amounts are illustrative — balance as needed.
 */
export const eventsCards: Card[] = [
  // ── Immediate — cash penalties ────────────────────────────────────────────
  {
    id: "ev_01",
    deck: "events",
    kind: "immediate",
    title: "Parking Ticket",
    text: "You forgot to feed the meter. Lose $20.",
    effect: { type: "cash", amount: -20 },
  },
  {
    id: "ev_02",
    deck: "events",
    kind: "immediate",
    title: "Slippery Floor",
    text: "You slipped on a wet floor display. Pay $50 for the embarrassment.",
    effect: { type: "cash", amount: -50 },
  },
  {
    id: "ev_03",
    deck: "events",
    kind: "immediate",
    title: "Cart Collision",
    text: "Your runaway shopping cart dented someone's bumper. Lose $30.",
    effect: { type: "cash", amount: -30 },
  },
  {
    id: "ev_04",
    deck: "events",
    kind: "immediate",
    title: "Lost Wallet",
    text: "You can't find your wallet. Lose $40 in the confusion.",
    effect: { type: "cash", amount: -40 },
  },
  {
    id: "ev_05",
    deck: "events",
    kind: "immediate",
    title: "Impulse Buy",
    text: "You couldn't resist the clearance rack. Lose $25.",
    effect: { type: "cash", amount: -25 },
  },

  // ── Immediate — cash bonuses ──────────────────────────────────────────────
  {
    id: "ev_06",
    deck: "events",
    kind: "immediate",
    title: "Found a Coupon",
    text: "Someone left a $30 gift card on the counter. Collect $30.",
    effect: { type: "cash", amount: 30 },
  },
  {
    id: "ev_07",
    deck: "events",
    kind: "immediate",
    title: "Price Mistake",
    text: "The cashier charged you less than the tag price. Keep the $20 difference.",
    effect: { type: "cash", amount: 20 },
  },
  {
    id: "ev_08",
    deck: "events",
    kind: "immediate",
    title: "Loyalty Reward",
    text: "Your store rewards points just hit the threshold. Collect $50 credit.",
    effect: { type: "cash", amount: 50 },
  },

  // ── Immediate — sale rotations ────────────────────────────────────────────
  {
    id: "ev_09",
    deck: "events",
    kind: "immediate",
    title: "Flash Sale!",
    text: "A store-wide flash sale kicks off. Rotate the top price card of any one store.",
    effect: { type: "sale", storeIds: [] }, // empty = player chooses
  },
  {
    id: "ev_10",
    deck: "events",
    kind: "immediate",
    title: "Double Markdown",
    text: "Two stores cycle their prices simultaneously.",
    effect: { type: "sale", storeIds: [] }, // player picks two
  },

  // ── Immediate — movement ──────────────────────────────────────────────────
  {
    id: "ev_11",
    deck: "events",
    kind: "immediate",
    title: "Elevator to Payday",
    text: "You catch the express elevator. Advance directly to the Payday space.",
    effect: { type: "move", targetSpaceId: "payday" },
  },
  {
    id: "ev_12",
    deck: "events",
    kind: "immediate",
    title: "Wrong Aisle",
    text: "You took a wrong turn. Move back 3 spaces.",
    effect: { type: "move", targetSpaceId: "BACK_3" }, // resolved by engine
  },

  // ── Immediate — skip ──────────────────────────────────────────────────────
  {
    id: "ev_13",
    deck: "events",
    kind: "immediate",
    title: "Long Checkout Line",
    text: "Every register has a line 10 deep. Skip your next turn.",
    effect: { type: "skip", turns: 1 },
  },
  {
    id: "ev_14",
    deck: "events",
    kind: "immediate",
    title: "Manager Needed",
    text: "A price check escalation eats your whole visit. Miss one turn.",
    effect: { type: "skip", turns: 1 },
  },

  // ── Holdable (max 3 specific cards can be held, per design doc) ───────────
  {
    id: "ev_15",
    deck: "events",
    kind: "holdable",
    title: "Rain Check",
    text: "Hold this card. Play it before any purchase to get the lowest price on that item regardless of the active price card.",
    effect: { type: "discount", amount: 0 }, // engine uses special logic for rain-check
  },
  {
    id: "ev_16",
    deck: "events",
    kind: "holdable",
    title: "VIP Pass",
    text: "Hold this card. Play it to skip directly to any store entrance of your choice.",
    effect: { type: "move", targetSpaceId: "CHOOSE_STORE_ENTRANCE" },
  },
  {
    id: "ev_17",
    deck: "events",
    kind: "holdable",
    title: "Double Payday",
    text: "Hold this card. Play it on your next Payday landing to collect $600 instead of $300.",
    effect: { type: "cash", amount: 300 }, // engine adds this on top of normal Payday
  },
];
