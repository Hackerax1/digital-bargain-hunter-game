/**
 * board.js
 * Defines the game board layout for Bargain Hunter.
 *
 * The board is a loop of spaces around a mall. Each space has a type:
 *   - "store"   : a shop where players can buy items
 *   - "parking" : start/corner spaces
 *   - "sale"    : draw a sale card (discount event)
 *   - "tax"     : pay a small tax/fee
 *   - "move"    : move forward or backward extra spaces
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
 *   id       {number}  unique index (0 = start)
 *   type     {string}  one of SPACE_TYPES
 *   label    {string}  display name
 *   storeId  {string|null}  which store this maps to (for STORE spaces)
 *   effect   {object|null}  extra data used by the game engine
 */
const BOARD_SPACES = [
  // ── Bottom row (left → right) ──────────────────────────────────────────────
  { id: 0,  type: SPACE_TYPES.PARKING, label: "🅿 Start",          storeId: null, effect: null },
  { id: 1,  type: SPACE_TYPES.STORE,   label: "Grocery Mart",      storeId: "grocery",   effect: null },
  { id: 2,  type: SPACE_TYPES.SALE,    label: "📢 Sale!",           storeId: null, effect: null },
  { id: 3,  type: SPACE_TYPES.STORE,   label: "Electronics Hub",   storeId: "electronics", effect: null },
  { id: 4,  type: SPACE_TYPES.STORE,   label: "Fashion Outlet",    storeId: "fashion",   effect: null },
  { id: 5,  type: SPACE_TYPES.TAX,     label: "💸 Tax",             storeId: null, effect: { amount: 5 } },
  { id: 6,  type: SPACE_TYPES.STORE,   label: "Toy World",         storeId: "toys",      effect: null },
  { id: 7,  type: SPACE_TYPES.STORE,   label: "Book Nook",         storeId: "books",     effect: null },
  { id: 8,  type: SPACE_TYPES.PARKING, label: "🅿 Corner",          storeId: null, effect: null },

  // ── Right column (bottom → top) ───────────────────────────────────────────
  { id: 9,  type: SPACE_TYPES.STORE,   label: "Sports Gear",       storeId: "sports",    effect: null },
  { id: 10, type: SPACE_TYPES.MOVE,    label: "↗ Move +2",         storeId: null, effect: { spaces: 2 } },
  { id: 11, type: SPACE_TYPES.STORE,   label: "Home Depot",        storeId: "home",      effect: null },
  { id: 12, type: SPACE_TYPES.STORE,   label: "Pet Palace",        storeId: "pets",      effect: null },
  { id: 13, type: SPACE_TYPES.SALE,    label: "📢 Sale!",           storeId: null, effect: null },
  { id: 14, type: SPACE_TYPES.STORE,   label: "Bakery Fresh",      storeId: "bakery",    effect: null },
  { id: 15, type: SPACE_TYPES.PARKING, label: "🅿 Corner",          storeId: null, effect: null },

  // ── Top row (right → left) ────────────────────────────────────────────────
  { id: 16, type: SPACE_TYPES.STORE,   label: "Jewellery Box",     storeId: "jewellery", effect: null },
  { id: 17, type: SPACE_TYPES.TAX,     label: "💸 Tax",             storeId: null, effect: { amount: 5 } },
  { id: 18, type: SPACE_TYPES.STORE,   label: "Shoe Shack",        storeId: "shoes",     effect: null },
  { id: 19, type: SPACE_TYPES.MOVE,    label: "↙ Move -2",         storeId: null, effect: { spaces: -2 } },
  { id: 20, type: SPACE_TYPES.STORE,   label: "Candy Corner",      storeId: "candy",     effect: null },
  { id: 21, type: SPACE_TYPES.STORE,   label: "Music & More",      storeId: "music",     effect: null },
  { id: 22, type: SPACE_TYPES.PARKING, label: "🅿 Corner",          storeId: null, effect: null },

  // ── Left column (top → bottom) ────────────────────────────────────────────
  { id: 23, type: SPACE_TYPES.STORE,   label: "Garden Centre",     storeId: "garden",    effect: null },
  { id: 24, type: SPACE_TYPES.SALE,    label: "📢 Sale!",           storeId: null, effect: null },
  { id: 25, type: SPACE_TYPES.STORE,   label: "Pharmacy Plus",     storeId: "pharmacy",  effect: null },
  { id: 26, type: SPACE_TYPES.STORE,   label: "Hardware Haven",    storeId: "hardware",  effect: null },
  { id: 27, type: SPACE_TYPES.MOVE,    label: "↗ Move +1",         storeId: null, effect: { spaces: 1 } },
  { id: 28, type: SPACE_TYPES.STORE,   label: "Café Delight",      storeId: "cafe",      effect: null },
  // Space 0 closes the loop (Start / Parking)
];

const TOTAL_SPACES = BOARD_SPACES.length; // 29 unique spaces (0..28, then wraps to 0)

/**
 * Stores available in the mall, with inventory and prices.
 * Each item on the player's shopping list can appear in multiple stores at
 * different prices so players must decide where to shop.
 */
const STORES = {
  grocery:     { name: "Grocery Mart",    items: { "Milk": 3, "Bread": 2, "Eggs": 4 } },
  electronics: { name: "Electronics Hub", items: { "Headphones": 35, "USB Cable": 8, "Batteries": 5 } },
  fashion:     { name: "Fashion Outlet",  items: { "T-Shirt": 15, "Jeans": 40, "Jacket": 65 } },
  toys:        { name: "Toy World",       items: { "Puzzle": 12, "Action Figure": 18, "Board Game": 25 } },
  books:       { name: "Book Nook",       items: { "Novel": 10, "Cookbook": 20, "Magazine": 5 } },
  sports:      { name: "Sports Gear",     items: { "Football": 22, "Racket": 30, "Yoga Mat": 28 } },
  home:        { name: "Home Depot",      items: { "Lamp": 45, "Pillow": 18, "Candle": 8 } },
  pets:        { name: "Pet Palace",      items: { "Dog Toy": 10, "Cat Food": 6, "Fish Bowl": 20 } },
  bakery:      { name: "Bakery Fresh",    items: { "Croissant": 2, "Cake": 15, "Muffin": 3 } },
  jewellery:   { name: "Jewellery Box",   items: { "Necklace": 55, "Ring": 80, "Bracelet": 35 } },
  shoes:       { name: "Shoe Shack",      items: { "Sneakers": 60, "Sandals": 30, "Boots": 75 } },
  candy:       { name: "Candy Corner",    items: { "Chocolate Bar": 2, "Gummy Bears": 3, "Lollipop": 1 } },
  music:       { name: "Music & More",    items: { "CD": 12, "Vinyl Record": 25, "Poster": 8 } },
  garden:      { name: "Garden Centre",   items: { "Seeds": 4, "Pot Plant": 15, "Watering Can": 12 } },
  pharmacy:    { name: "Pharmacy Plus",   items: { "Vitamins": 18, "Bandages": 6, "Sunscreen": 10 } },
  hardware:    { name: "Hardware Haven",  items: { "Screwdriver": 8, "Paint Brush": 5, "Nails": 3 } },
  cafe:        { name: "Café Delight",    items: { "Coffee": 4, "Sandwich": 7, "Smoothie": 6 } },
};

/** Shopping lists – one per player slot. Randomly assigned at game start. */
const SHOPPING_LISTS = [
  ["Milk", "Headphones", "T-Shirt", "Puzzle", "Novel"],
  ["Bread", "USB Cable", "Jeans", "Football", "Lamp"],
  ["Eggs", "Batteries", "Jacket", "Racket", "Pillow"],
  ["Croissant", "Sneakers", "Chocolate Bar", "Dog Toy", "Seeds"],
];

export {
  SPACE_TYPES,
  BOARD_SPACES,
  TOTAL_SPACES,
  STORES,
  SHOPPING_LISTS,
};
