import type { Card } from "../types";

/**
 * Bargain Finder deck — 17 cards total.
 * Players may hold up to 3 at a time; drawing a 4th forces discarding the oldest.
 * Cards are tagged "move" (shortcuts) or "discount" (price reductions) per design doc §5.
 *
 * Flavor text is original content.
 */
export const bargainFinderCards: Card[] = [
  // ── Move / shortcut cards ──────────────────────────────────────────────────
  {
    id: "bf_01",
    deck: "bargainFinder",
    kind: "move",
    title: "Shortcut to Dept A",
    text: "Use this card to teleport directly to the Department Store A entrance.",
    effect: { type: "move", targetSpaceId: "entrance_dept_a" },
  },
  {
    id: "bf_02",
    deck: "bargainFinder",
    kind: "move",
    title: "Shortcut to Dept B",
    text: "Use this card to teleport directly to the Department Store B entrance.",
    effect: { type: "move", targetSpaceId: "entrance_dept_b" },
  },
  {
    id: "bf_03",
    deck: "bargainFinder",
    kind: "move",
    title: "Shortcut to Furniture A",
    text: "Use this card to teleport directly to the Furniture Store A entrance.",
    effect: { type: "move", targetSpaceId: "entrance_furn_a" },
  },
  {
    id: "bf_04",
    deck: "bargainFinder",
    kind: "move",
    title: "Shortcut to Furniture B",
    text: "Use this card to teleport directly to the Furniture Store B entrance.",
    effect: { type: "move", targetSpaceId: "entrance_furn_b" },
  },
  {
    id: "bf_05",
    deck: "bargainFinder",
    kind: "move",
    title: "Pet Store Express",
    text: "Use this card to teleport directly to the Pet Store entrance.",
    effect: { type: "move", targetSpaceId: "entrance_pets" },
  },
  {
    id: "bf_06",
    deck: "bargainFinder",
    kind: "move",
    title: "Advance to Payday",
    text: "Move directly to the Payday space and collect $300.",
    effect: { type: "move", targetSpaceId: "payday" },
  },
  {
    id: "bf_07",
    deck: "bargainFinder",
    kind: "move",
    title: "Skip to Tag Sale",
    text: "Move directly to the Tag Sale space.",
    effect: { type: "move", targetSpaceId: "tag_sale" },
  },
  {
    id: "bf_08",
    deck: "bargainFinder",
    kind: "move",
    title: "Leap Ahead",
    text: "Advance 5 spaces from your current position.",
    effect: { type: "move", targetSpaceId: "FORWARD_5" }, // resolved by engine
  },

  // ── Discount cards ─────────────────────────────────────────────────────────
  {
    id: "bf_09",
    deck: "bargainFinder",
    kind: "discount",
    title: "$10 Off Any Item",
    text: "Play before purchasing any item. Deduct $10 from its price.",
    effect: { type: "discount", amount: 10 },
  },
  {
    id: "bf_10",
    deck: "bargainFinder",
    kind: "discount",
    title: "$20 Off Any Item",
    text: "Play before purchasing any item. Deduct $20 from its price.",
    effect: { type: "discount", amount: 20 },
  },
  {
    id: "bf_11",
    deck: "bargainFinder",
    kind: "discount",
    title: "$30 Off Any Item",
    text: "Play before purchasing any item. Deduct $30 from its price.",
    effect: { type: "discount", amount: 30 },
  },
  {
    id: "bf_12",
    deck: "bargainFinder",
    kind: "discount",
    title: "$50 Off Any Item",
    text: "Play before purchasing any item. Deduct $50 from its price.",
    effect: { type: "discount", amount: 50 },
  },
  {
    id: "bf_13",
    deck: "bargainFinder",
    kind: "discount",
    title: "$20 Off at Dept A",
    text: "Play before purchasing at Department Store A. Deduct $20.",
    effect: { type: "discount", amount: 20, storeId: "dept_a" },
  },
  {
    id: "bf_14",
    deck: "bargainFinder",
    kind: "discount",
    title: "$20 Off at Dept B",
    text: "Play before purchasing at Department Store B. Deduct $20.",
    effect: { type: "discount", amount: 20, storeId: "dept_b" },
  },
  {
    id: "bf_15",
    deck: "bargainFinder",
    kind: "discount",
    title: "$20 Off at Furniture A",
    text: "Play before purchasing at Furniture Store A. Deduct $20.",
    effect: { type: "discount", amount: 20, storeId: "furn_a" },
  },
  {
    id: "bf_16",
    deck: "bargainFinder",
    kind: "discount",
    title: "$20 Off at Furniture B",
    text: "Play before purchasing at Furniture Store B. Deduct $20.",
    effect: { type: "discount", amount: 20, storeId: "furn_b" },
  },
  {
    id: "bf_17",
    deck: "bargainFinder",
    kind: "discount",
    title: "Pet Store Deal",
    text: "Play before purchasing at the Pet Store. Deduct $25.",
    effect: { type: "discount", amount: 25, storeId: "pets" },
  },
];
