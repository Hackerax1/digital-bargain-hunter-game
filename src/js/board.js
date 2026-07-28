/**
 * board.js
 * Board order follows src/data/board.md (40 spaces).
 */

const SPACE_TYPES = {
  STORE: "store",
  PARKING: "parking",
  SALE: "sale",
  TAX: "tax",
  MOVE: "move",
};

/**
 * Each space definition:
 *   id       {number}  unique index (0-based)
 *   type     {string}  one of SPACE_TYPES
 *   label    {string}  display name
 *   storeId  {string|null}  which store this maps to (for STORE spaces)
 *   effect   {object|null}  extra data used by the game engine
 */
const BOARD_SPACES = [
  { id: 0, type: SPACE_TYPES.PARKING, label: "Payday! 10% interest due", storeId: null, effect: { action: "payday", amount: 300 } },
  { id: 1, type: SPACE_TYPES.MOVE, label: "Go to any store space", storeId: null, effect: { action: "choose_store_space" } },
  { id: 2, type: SPACE_TYPES.TAX, label: "Restaurant: Pay $10 x spinner", storeId: null, effect: { amount: 10, perSpin: true } },
  { id: 3, type: SPACE_TYPES.SALE, label: "Sale!", storeId: null, effect: null },
  { id: 4, type: SPACE_TYPES.STORE, label: "Purple Department Store Entrance", storeId: "dept_b", effect: null },
  { id: 5, type: SPACE_TYPES.PARKING, label: "Window Shopping", storeId: null, effect: null },
  { id: 6, type: SPACE_TYPES.PARKING, label: "Take a Bargain Finder card", storeId: null, effect: { action: "draw_bargain_finder" } },
  { id: 7, type: SPACE_TYPES.MOVE, label: "Go back in Purple Store or draw Events", storeId: null, effect: { action: "store_or_events", storeId: "dept_b" } },
  { id: 8, type: SPACE_TYPES.TAX, label: "Auto Repairs: Pay $50 x spinner", storeId: null, effect: { amount: 50, perSpin: true } },
  { id: 9, type: SPACE_TYPES.STORE, label: "Blue Furniture Store Entrance", storeId: "furn_b", effect: null },
  { id: 10, type: SPACE_TYPES.PARKING, label: "Window Shopping", storeId: null, effect: null },
  { id: 11, type: SPACE_TYPES.PARKING, label: "Events Card", storeId: null, effect: { action: "draw_events" } },
  { id: 12, type: SPACE_TYPES.PARKING, label: "Take a Bargain Finder card", storeId: null, effect: { action: "draw_bargain_finder" } },
  { id: 13, type: SPACE_TYPES.SALE, label: "Sale!", storeId: null, effect: null },
  { id: 14, type: SPACE_TYPES.MOVE, label: "Go back in Blue Store or draw Events", storeId: null, effect: { action: "store_or_events", storeId: "furn_b" } },
  { id: 15, type: SPACE_TYPES.MOVE, label: "Hunger Strikes: Go back to Restaurant", storeId: null, effect: { action: "move_to_space", targetId: 2 } },
  { id: 16, type: SPACE_TYPES.TAX, label: "Doctor's Office: Pay $10 x spinner", storeId: null, effect: { amount: 10, perSpin: true } },
  { id: 17, type: SPACE_TYPES.STORE, label: "Pet Shop Entrance", storeId: "pets", effect: null },
  { id: 18, type: SPACE_TYPES.PARKING, label: "Window Shopping", storeId: null, effect: null },
  { id: 19, type: SPACE_TYPES.SALE, label: "Sale!", storeId: null, effect: null },
  { id: 20, type: SPACE_TYPES.PARKING, label: "Events Card", storeId: null, effect: { action: "draw_events" } },
  { id: 21, type: SPACE_TYPES.PARKING, label: "Take a Bargain Finder card", storeId: null, effect: { action: "draw_bargain_finder" } },
  { id: 22, type: SPACE_TYPES.MOVE, label: "Go back in Pet Shop or draw Events", storeId: null, effect: { action: "store_or_events", storeId: "pets" } },
  { id: 23, type: SPACE_TYPES.TAX, label: "Charity: Give x spinner", storeId: null, effect: { amount: 10, perSpin: true } },
  { id: 24, type: SPACE_TYPES.STORE, label: "Olive Department Store Entrance", storeId: "dept_a", effect: null },
  { id: 25, type: SPACE_TYPES.PARKING, label: "Window Shopping", storeId: null, effect: null },
  { id: 26, type: SPACE_TYPES.MOVE, label: "Best Friend's Birthday: Advance to Gift Shop", storeId: null, effect: { action: "move_to_space", targetId: 37 } },
  { id: 27, type: SPACE_TYPES.MOVE, label: "Go back in Olive Store or draw Events", storeId: null, effect: { action: "store_or_events", storeId: "dept_a" } },
  { id: 28, type: SPACE_TYPES.MOVE, label: "Go to Payday", storeId: null, effect: { action: "move_to_space", targetId: 0 } },
  { id: 29, type: SPACE_TYPES.STORE, label: "Green Furniture Store Entrance", storeId: "furn_a", effect: null },
  { id: 30, type: SPACE_TYPES.PARKING, label: "Window Shopping", storeId: null, effect: null },
  { id: 31, type: SPACE_TYPES.PARKING, label: "Events Card", storeId: null, effect: { action: "draw_events" } },
  { id: 32, type: SPACE_TYPES.PARKING, label: "Take a Bargain Finder card", storeId: null, effect: { action: "draw_bargain_finder" } },
  { id: 33, type: SPACE_TYPES.SALE, label: "Sale!", storeId: null, effect: null },
  { id: 34, type: SPACE_TYPES.MOVE, label: "Go back in Green Store or draw Events", storeId: null, effect: { action: "store_or_events", storeId: "furn_a" } },
  { id: 35, type: SPACE_TYPES.TAX, label: "Lottery: Win $100", storeId: null, effect: { amount: -100 } },
  { id: 36, type: SPACE_TYPES.PARKING, label: "Take a Bargain Finder card", storeId: null, effect: { action: "draw_bargain_finder" } },
  { id: 37, type: SPACE_TYPES.TAX, label: "Gift Shop: Pay $10 x spinner", storeId: null, effect: { amount: 10, perSpin: true } },
  { id: 38, type: SPACE_TYPES.MOVE, label: "Go back to any store space", storeId: null, effect: { action: "choose_store_space" } },
  { id: 39, type: SPACE_TYPES.SALE, label: "Tag Sale: Any item for $10 x spinner", storeId: null, effect: { action: "tag_sale" } },
];

const TOTAL_SPACES = BOARD_SPACES.length; // 40 unique spaces (0..39, then wraps to 0)

/**
 * Store fronts used by the board entrances.
 * Prices are the current demo defaults from the first price card in stores.md.
 */
const STORES = {
  dept_a: {
    name: "Olive Department Store",
    items: {
      Blender: 25,
      Clothes_Dryer: 325,
      Dishwasher: 300,
      Iron: 30,
      Radio: 40,
      Refrigerator: 525,
      Stove: 375,
      Television: 200,
      Toaster: 35,
      Washing_Machine: 375,
    },
  },
  dept_b: {
    name: "Purple Department Store",
    items: {
      Blender: 55,
      Clothes_Dryer: 400,
      Dishwasher: 250,
      Iron: 25,
      Radio: 15,
      Refrigerator: 450,
      Stove: 400,
      Television: 350,
      Toaster: 30,
      Washing_Machine: 450,
    },
  },
  furn_a: {
    name: "Green Furniture Store",
    items: {
      Armchair: 250,
      Bed: 250,
      Clock: 70,
      Dresser: 275,
      Kitchen_Set: 650,
      Lamp: 100,
      Sofa: 350,
    },
  },
  furn_b: {
    name: "Blue Furniture Store",
    items: {
      Armchair: 350,
      Bed: 350,
      Clock: 20,
      Dresser: 150,
      Kitchen_Set: 500,
      Lamp: 30,
      Sofa: 600,
    },
  },
  pets: {
    name: "Pet Store Yellow",
    items: {
      Cat: 150,
      Dog: 200,
      Fish: 50,
      Lizard: 45,
      Parrot: 100,
      Rabbit: 35,
    },
  },
};

/** Shopping lists – one per player slot. Randomly assigned at game start. */
const SHOPPING_LISTS = [
  ["Blender", "Sofa", "Lamp", "Television", "Toaster"],
  ["Refrigerator", "Dishwasher", "Armchair", "Clock", "Bed"],
  ["Stove", "Iron", "Kitchen_Set", "Dresser", "Washing_Machine"],
  ["Radio", "Clothes_Dryer", "Sofa", "Lamp", "Blender"],
];

export {
  SPACE_TYPES,
  BOARD_SPACES,
  TOTAL_SPACES,
  STORES,
  SHOPPING_LISTS,
};
