/**
 * tests/player.test.mjs
 * Unit tests for src/js/player.js
 * Run with: node tests/player.test.mjs
 */
import {
  createPlayer,
  movePlayer,
  buyItem,
  remainingBudget,
  hasCompletedList,
  calculateScore,
} from "../src/js/player.js";
import { SHOPPING_LISTS, TOTAL_SPACES } from "../src/js/board.js";

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

// ── createPlayer ──────────────────────────────────────────────────────────────
console.log("createPlayer");
const p = createPlayer(0, "Alice", SHOPPING_LISTS[0], 200);
assert("name is Alice",              p.name === "Alice");
assert("id is 0",                    p.id === 0);
assert("starts at position 0",       p.position === 0);
assert("budget is 200",              p.budget === 200);
assert("spent starts at 0",          p.spent === 0);
assert("shoppingList has 5 items",   p.shoppingList.length === 5);
assert("purchased array is empty",   p.purchased.length === 0);
assert("lapsCompleted is 0",         p.lapsCompleted === 0);
assert("isActive is false",          p.isActive === false);
assert("shoppingList is a copy",     p.shoppingList !== SHOPPING_LISTS[0]);

// Default budget = 200 when omitted
const p2 = createPlayer(1, "Bob", SHOPPING_LISTS[1]);
assert("default budget is 200",      p2.budget === 200);

// ── movePlayer ────────────────────────────────────────────────────────────────
console.log("movePlayer");
const mover = createPlayer(0, "Mover", SHOPPING_LISTS[0]);
const { newPosition: pos1, lapped: l1 } = movePlayer(mover, 5, TOTAL_SPACES);
assert("moves forward 5",            pos1 === 5 && mover.position === 5);
assert("no lap on short move",       !l1);

// Wrap around
mover.position = TOTAL_SPACES - 2;
const { newPosition: pos2, lapped: l2 } = movePlayer(mover, 5, TOTAL_SPACES);
assert("wraps around the board",     pos2 === 3);
assert("detected lap on wrap",       l2 === true);
assert("lap counter incremented",    mover.lapsCompleted === 1);

// Negative move (MOVE space going backwards)
mover.position = 5;
const { newPosition: pos3 } = movePlayer(mover, -3, TOTAL_SPACES);
assert("moves backward 3",           pos3 === 2);

// Negative wrap (moving before start)
mover.position = 1;
const { newPosition: pos4 } = movePlayer(mover, -3, TOTAL_SPACES);
assert("negative wrap resolves to positive index", pos4 >= 0 && pos4 < TOTAL_SPACES);

// ── buyItem ───────────────────────────────────────────────────────────────────
console.log("buyItem");
const buyer = createPlayer(0, "Buyer", ["Milk", "Bread", "Eggs"]);
buyer.budget = 100;

const ok = buyItem(buyer, "Milk", "Grocery Mart", 3);
assert("buys an item on the list",          ok);
assert("spent increases by price",          buyer.spent === 3);
assert("item removed from shoppingList",    !buyer.shoppingList.includes("Milk"));
assert("item added to purchased",           buyer.purchased.some((r) => r.item === "Milk"));
assert("purchase record has correct store", buyer.purchased[0].store === "Grocery Mart");
assert("purchase record has correct price", buyer.purchased[0].price === 3);

// Item not on list
const notOnList = buyItem(buyer, "Chocolate Bar", "Candy Corner", 2);
assert("rejects item not on list", !notOnList);

// Insufficient budget
buyer.spent = 99; // only $1 left
const tooExpensive = buyItem(buyer, "Bread", "Grocery Mart", 2);
assert("rejects purchase with insufficient budget", !tooExpensive);

// ── remainingBudget ───────────────────────────────────────────────────────────
console.log("remainingBudget");
const rb = createPlayer(0, "Rich", ["Milk"]);
rb.budget = 200;
rb.spent = 60;
assert("returns 140", remainingBudget(rb) === 140);

rb.spent = 200;
assert("returns 0 when all spent", remainingBudget(rb) === 0);

// ── hasCompletedList ──────────────────────────────────────────────────────────
console.log("hasCompletedList");
const hcl = createPlayer(0, "Tester", ["Milk", "Bread"]);
assert("not complete with items remaining", !hasCompletedList(hcl));
hcl.shoppingList = [];
assert("complete when list is empty",       hasCompletedList(hcl));

// ── calculateScore ────────────────────────────────────────────────────────────
console.log("calculateScore");
const scorer = createPlayer(0, "Scorer", []);
scorer.budget = 200;
scorer.spent = 80;
// List is empty so bonus applies
const score = calculateScore(scorer, 50);
assert("score = remaining budget + bonus",  score === 170);

scorer.shoppingList = ["Milk"]; // incomplete
const score2 = calculateScore(scorer, 50);
assert("score = remaining budget only when list incomplete", score2 === 120);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
