/**
 * tests/board.test.mjs
 * Unit tests for src/js/board.js
 * Run with: node tests/board.test.mjs
 */
import {
  SPACE_TYPES,
  BOARD_SPACES,
  TOTAL_SPACES,
  STORES,
  SHOPPING_LISTS,
} from "../src/js/board.js";

let passed = 0;
let failed = 0;

function assert(desc, cond) {
  if (cond) {
    console.log("  ✅", desc);
    passed++;
  } else {
    console.error("  ❌", desc);
    failed++;
  }
}

// ── SPACE_TYPES ───────────────────────────────────────────────────────────────
console.log("SPACE_TYPES");
assert("has STORE",   SPACE_TYPES.STORE === "store");
assert("has PARKING", SPACE_TYPES.PARKING === "parking");
assert("has SALE",    SPACE_TYPES.SALE === "sale");
assert("has TAX",     SPACE_TYPES.TAX === "tax");
assert("has MOVE",    SPACE_TYPES.MOVE === "move");

// ── BOARD_SPACES ──────────────────────────────────────────────────────────────
console.log("BOARD_SPACES");
assert("has 29 spaces",         BOARD_SPACES.length === 29);
assert("TOTAL_SPACES equals 29", TOTAL_SPACES === 29);

// Space IDs are sequential
const allIds = BOARD_SPACES.map((s) => s.id);
assert("IDs are 0–28 in order", allIds.join(",") === [...Array(29).keys()].join(","));

// Space 0 is the start (parking)
assert("space 0 is parking",    BOARD_SPACES[0].type === SPACE_TYPES.PARKING);
assert("space 0 label contains 'Start'", BOARD_SPACES[0].label.includes("Start"));

// All spaces have required fields
const requiredFields = ["id", "type", "label", "storeId", "effect"];
const allHaveFields = BOARD_SPACES.every((s) =>
  requiredFields.every((f) => Object.prototype.hasOwnProperty.call(s, f))
);
assert("every space has required fields",  allHaveFields);

// All types are valid
const validTypes = Object.values(SPACE_TYPES);
const allValidTypes = BOARD_SPACES.every((s) => validTypes.includes(s.type));
assert("all spaces have valid types",      allValidTypes);

// Store spaces reference a real store id
const storeSpaces = BOARD_SPACES.filter((s) => s.type === SPACE_TYPES.STORE);
const allStoreIdsExist = storeSpaces.every((s) => s.storeId && s.storeId in STORES);
assert("all store spaces reference a valid storeId", allStoreIdsExist);

// TAX spaces have an 'amount' effect
const taxSpaces = BOARD_SPACES.filter((s) => s.type === SPACE_TYPES.TAX);
assert("at least one TAX space",        taxSpaces.length > 0);
assert("tax spaces have amount effect", taxSpaces.every((s) => typeof s.effect?.amount === "number"));

// MOVE spaces have a 'spaces' effect
const moveSpaces = BOARD_SPACES.filter((s) => s.type === SPACE_TYPES.MOVE);
assert("at least one MOVE space",        moveSpaces.length > 0);
assert("move spaces have spaces effect", moveSpaces.every((s) => typeof s.effect?.spaces === "number"));

// ── STORES ────────────────────────────────────────────────────────────────────
console.log("STORES");
assert("has at least 10 stores", Object.keys(STORES).length >= 10);

// Every store has a name and items object
const allStoresValid = Object.entries(STORES).every(
  ([, store]) =>
    typeof store.name === "string" &&
    typeof store.items === "object" &&
    Object.keys(store.items).length > 0
);
assert("all stores have name and items", allStoresValid);

// Every item price is a positive number
const allPricesValid = Object.values(STORES).every((store) =>
  Object.values(store.items).every((p) => typeof p === "number" && p > 0)
);
assert("all item prices are positive numbers", allPricesValid);

// ── SHOPPING_LISTS ────────────────────────────────────────────────────────────
console.log("SHOPPING_LISTS");
assert("has 4 lists",              SHOPPING_LISTS.length === 4);
assert("each list has 5 items",    SHOPPING_LISTS.every((l) => l.length === 5));
assert("all items are non-empty strings",
  SHOPPING_LISTS.every((l) => l.every((item) => typeof item === "string" && item.length > 0))
);

// Every item in a shopping list exists in at least one store
const allItemsInStores = SHOPPING_LISTS.flat().every((item) =>
  Object.values(STORES).some((store) => item in store.items)
);
assert("every shopping list item exists in a store", allItemsInStores);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
