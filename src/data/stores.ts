import type { Store } from "../types";

/**
 * The 19 shopping-list items (17 general goods + 2 pet slots).
 *
 * NOTE: The exact original item catalog was not published in the rulebook (see
 * design doc §14).  These are original-content stand-ins that cover the same
 * categories and quantity. Replace / extend freely.
 */
export const ITEM_IDS = [
  // General goods (17)
  "toaster",
  "blender",
  "coffee_maker",
  "hair_dryer",
  "iron",
  "vacuum",
  "lamp",
  "alarm_clock",
  "telephone",
  "camera",
  "bicycle",
  "running_shoes",
  "backpack",
  "sofa",
  "dining_table",
  "bookshelf",
  "bed_frame",
  // Pet slots (2)
  "pet_slot_1",
  "pet_slot_2",
] as const;

export type ItemId = (typeof ITEM_IDS)[number];

/**
 * Five stores × four price cards each.
 * index 0 of priceDeck = the currently active (top) card.
 * A "Sale!" space rotates index 0 to the back (splice + push).
 *
 * Bargain-space items in each store share the same itemId as the regular space
 * but appear on darker/marked spaces on the board — the engine automatically
 * looks up the same itemId from the active PriceCard (the board space type
 * determines whether it qualifies as a "bargain find" for stats).
 */
export const stores: Store[] = [
  // ── Department Store A ─────────────────────────────────────────────────────
  {
    id: "dept_a",
    name: "Department Store A",
    colorGroup: "deptA",
    priceDeck: [
      {
        id: "dept_a_price_1",
        label: "Regular Prices",
        prices: {
          toaster: 40,
          blender: 55,
          coffee_maker: 70,
          hair_dryer: 35,
          iron: 30,
          alarm_clock: 25,
          camera: 120,
          running_shoes: 65,
          backpack: 45,
        },
      },
      {
        id: "dept_a_price_2",
        label: "Spring Sale",
        prices: {
          toaster: 30,
          blender: 45,
          coffee_maker: 60,
          hair_dryer: 28,
          iron: 22,
          alarm_clock: 18,
          camera: 100,
          running_shoes: 55,
          backpack: 35,
        },
      },
      {
        id: "dept_a_price_3",
        label: "Clearance",
        prices: {
          toaster: 25,
          blender: 38,
          coffee_maker: 50,
          hair_dryer: 22,
          iron: 18,
          alarm_clock: 15,
          camera: 85,
          running_shoes: 48,
          backpack: 28,
        },
      },
      {
        id: "dept_a_price_4",
        label: "Holiday Blowout",
        prices: {
          toaster: 20,
          blender: 30,
          coffee_maker: 45,
          hair_dryer: 18,
          iron: 15,
          alarm_clock: 12,
          camera: 75,
          running_shoes: 40,
          backpack: 22,
        },
      },
    ],
  },

  // ── Department Store B ─────────────────────────────────────────────────────
  {
    id: "dept_b",
    name: "Department Store B",
    colorGroup: "deptB",
    priceDeck: [
      {
        id: "dept_b_price_1",
        label: "Regular Prices",
        prices: {
          vacuum: 110,
          telephone: 50,
          bicycle: 180,
          running_shoes: 70,
          backpack: 50,
          hair_dryer: 38,
          iron: 32,
          camera: 130,
        },
      },
      {
        id: "dept_b_price_2",
        label: "Summer Savings",
        prices: {
          vacuum: 95,
          telephone: 42,
          bicycle: 155,
          running_shoes: 58,
          backpack: 42,
          hair_dryer: 30,
          iron: 26,
          camera: 110,
        },
      },
      {
        id: "dept_b_price_3",
        label: "Back-to-School",
        prices: {
          vacuum: 82,
          telephone: 36,
          bicycle: 140,
          running_shoes: 50,
          backpack: 36,
          hair_dryer: 25,
          iron: 22,
          camera: 95,
        },
      },
      {
        id: "dept_b_price_4",
        label: "End-of-Season",
        prices: {
          vacuum: 70,
          telephone: 30,
          bicycle: 120,
          running_shoes: 42,
          backpack: 30,
          hair_dryer: 20,
          iron: 18,
          camera: 80,
        },
      },
    ],
  },

  // ── Furniture Store A ──────────────────────────────────────────────────────
  {
    id: "furn_a",
    name: "Furniture Store A",
    colorGroup: "furnA",
    priceDeck: [
      {
        id: "furn_a_price_1",
        label: "Regular Prices",
        prices: {
          sofa: 350,
          dining_table: 280,
          bookshelf: 120,
          bed_frame: 200,
          lamp: 45,
        },
      },
      {
        id: "furn_a_price_2",
        label: "Warehouse Sale",
        prices: {
          sofa: 300,
          dining_table: 240,
          bookshelf: 100,
          bed_frame: 170,
          lamp: 38,
        },
      },
      {
        id: "furn_a_price_3",
        label: "Floor Model",
        prices: {
          sofa: 260,
          dining_table: 200,
          bookshelf: 85,
          bed_frame: 145,
          lamp: 30,
        },
      },
      {
        id: "furn_a_price_4",
        label: "Going-Out-of-Business",
        prices: {
          sofa: 220,
          dining_table: 165,
          bookshelf: 70,
          bed_frame: 120,
          lamp: 22,
        },
      },
    ],
  },

  // ── Furniture Store B ──────────────────────────────────────────────────────
  {
    id: "furn_b",
    name: "Furniture Store B",
    colorGroup: "furnB",
    priceDeck: [
      {
        id: "furn_b_price_1",
        label: "Regular Prices",
        prices: {
          sofa: 380,
          dining_table: 310,
          bookshelf: 135,
          bed_frame: 225,
          lamp: 50,
        },
      },
      {
        id: "furn_b_price_2",
        label: "Seasonal Markdown",
        prices: {
          sofa: 320,
          dining_table: 265,
          bookshelf: 115,
          bed_frame: 190,
          lamp: 42,
        },
      },
      {
        id: "furn_b_price_3",
        label: "Manager's Special",
        prices: {
          sofa: 275,
          dining_table: 225,
          bookshelf: 95,
          bed_frame: 160,
          lamp: 34,
        },
      },
      {
        id: "furn_b_price_4",
        label: "Liquidation",
        prices: {
          sofa: 230,
          dining_table: 185,
          bookshelf: 78,
          bed_frame: 130,
          lamp: 26,
        },
      },
    ],
  },

  // ── Pet Store ──────────────────────────────────────────────────────────────
  {
    id: "pets",
    name: "Pet Store",
    colorGroup: "pets",
    priceDeck: [
      {
        id: "pets_price_1",
        label: "Regular Prices",
        prices: {
          pet_slot_1: 80,  // e.g. dog
          pet_slot_2: 60,  // e.g. cat
        },
      },
      {
        id: "pets_price_2",
        label: "Adoption Drive",
        prices: {
          pet_slot_1: 60,
          pet_slot_2: 45,
        },
      },
      {
        id: "pets_price_3",
        label: "Rescue Promo",
        prices: {
          pet_slot_1: 45,
          pet_slot_2: 35,
        },
      },
      {
        id: "pets_price_4",
        label: "Free to Good Home",
        prices: {
          pet_slot_1: 25,
          pet_slot_2: 20,
        },
      },
    ],
  },
];

/** Convenience: look up a store by id */
export function getStore(id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}

/** Return the currently active price card for a store */
export function activePrice(store: Store): Store["priceDeck"][0] {
  return store.priceDeck[0];
}

/** Rotate the top price card to the back (Sale! mechanic) */
export function rotatePriceDeck(store: Store): Store {
  const [top, ...rest] = store.priceDeck;
  return { ...store, priceDeck: [...rest, top] };
}
