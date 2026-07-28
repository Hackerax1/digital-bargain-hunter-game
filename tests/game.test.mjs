/**
 * tests/game.test.mjs
 * Unit tests for src/js/game.js
 * Run with: node tests/game.test.mjs
 */
import { Game, rollDice, MIN_PLAYERS, MAX_PLAYERS, SALE_DISCOUNT, MAX_ROUNDS } from "../src/js/game.js";
import { SPACE_TYPES, BOARD_SPACES } from "../src/js/board.js";

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

// ── rollDice ──────────────────────────────────────────────────────────────────
console.log("rollDice");
let diceOk = true;
for (let i = 0; i < 500; i++) {
  const { die1, die2, total } = rollDice();
  if (die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6 || total !== die1 + die2) {
    diceOk = false;
    break;
  }
}
assert("500 rolls are valid d6 pairs summing correctly", diceOk);

// ── Constants ─────────────────────────────────────────────────────────────────
console.log("Constants");
assert("MIN_PLAYERS is 2",    MIN_PLAYERS === 2);
assert("MAX_PLAYERS is 4",    MAX_PLAYERS === 4);
assert("MAX_ROUNDS is 10",    MAX_ROUNDS === 10);
assert("SALE_DISCOUNT is 0.25", SALE_DISCOUNT === 0.25);

// ── Game.setup validation ─────────────────────────────────────────────────────
console.log("Game.setup");
const g = new Game();
let threw = false;
try { g.setup(["Solo"]); } catch (_) { threw = true; }
assert("throws RangeError with 1 player",    threw);

threw = false;
try { g.setup(["A", "B", "C", "D", "E"]); } catch (_) { threw = true; }
assert("throws RangeError with 5 players",   threw);

// ── 2-player game setup ───────────────────────────────────────────────────────
console.log("Game setup — 2 players");
const events = [];
const g2 = new Game();
["gameStarted", "playerMoved", "turnReady", "turnEnded", "nextTurn",
 "newRound", "gameOver", "saleActivated", "taxCharged", "extraMove",
 "itemPurchased", "parking"].forEach((ev) =>
  g2.on(ev, (d) => events.push({ type: ev, ...d }))
);

g2.setup(["Alice", "Bob"]);
assert("emits gameStarted",           events.some((e) => e.type === "gameStarted"));
assert("phase is 'playing'",          g2.phase === "playing");
assert("currentPlayerIndex is 0",     g2.currentPlayerIndex === 0);
assert("2 players exist",             g2.players.length === 2);
assert("round is 1",                  g2.round === 1);
assert("player 0 isActive",           g2.players[0].isActive === true);
assert("player 1 is not active",      g2.players[1].isActive === false);

// ── takeTurn ──────────────────────────────────────────────────────────────────
console.log("takeTurn");
g2.takeTurn();
assert("emits playerMoved",  events.some((e) => e.type === "playerMoved"));
assert("emits turnReady",    events.some((e) => e.type === "turnReady"));
assert("lastDiceRoll set",   g2.lastDiceRoll !== null);
const roll = g2.lastDiceRoll;
assert("dice total is 2–12", roll.total >= 2 && roll.total <= 12);

// ── endTurn ───────────────────────────────────────────────────────────────────
console.log("endTurn");
g2.endTurn();
assert("emits turnEnded",    events.some((e) => e.type === "turnEnded"));
assert("currentPlayerIndex is now 1", g2.currentPlayerIndex === 1);
assert("Bob is active",      g2.currentPlayer.name === "Bob");

// Bob takes turn, then back to Alice → new round
g2.takeTurn();
g2.endTurn();
assert("round advanced to 2", g2.round === 2);
assert("emits newRound",      events.some((e) => e.type === "newRound"));

// ── purchaseItem ──────────────────────────────────────────────────────────────
console.log("purchaseItem");
// Non-store space
g2.players[0].position = 0; // parking
g2.currentPlayerIndex = 0;
const noStore = g2.purchaseItem("Milk");
assert("fails on non-store space",   !noStore.success);

// Store space — Grocery Mart is space 1 (storeId: 'grocery', has Milk)
g2.players[0].position = 1;
g2.saleActive = false;
const okBuy = g2.purchaseItem("Milk");
assert("buys Milk at Grocery Mart",  okBuy.success);
assert("emits itemPurchased",        events.some((e) => e.type === "itemPurchased"));
assert("Milk off shopping list",     !g2.players[0].shoppingList.includes("Milk"));

// Item not in this store
const wrongStore = g2.purchaseItem("Necklace"); // Necklace is in Jewellery, not Grocery
assert("fails if item not in store", !wrongStore.success);

// ── Sale discount ─────────────────────────────────────────────────────────────
console.log("Sale discount");
const sg = new Game();
sg.setup(["Alice", "Bob"]);
sg.players[0].position = 1; // Grocery Mart
sg.saleActive = true;

const basePrice = 3; // Milk costs $3
const discountedPrice = Math.floor(basePrice * (1 - SALE_DISCOUNT));
const beforeSpent = sg.players[0].spent;
const saleResult = sg.purchaseItem("Milk");
assert("sale purchase succeeds", saleResult.success);
assert("sale price is discounted",
  sg.players[0].spent - beforeSpent === discountedPrice
);

// ── Game over — shopping list completed ───────────────────────────────────────
console.log("Game over — list completion");
const wg = new Game();
const wEvents = [];
wg.on("gameOver", (d) => wEvents.push(d));
wg.setup(["Alice", "Bob"]);

// Clear both lists so the next endTurn check triggers a win
wg.players[0].shoppingList = [];
wg.players[1].shoppingList = [];

// Simulate end of turn — _checkWin is called inside endTurn
// We need to advance player and let checkWin run
wg.endTurn(); // Alice ends, Bob starts → _checkWin sees Bob's empty list
assert("gameOver emitted",        wEvents.length > 0);
assert("phase is 'gameover'",     wg.phase === "gameover");
assert("winner is identified",    wEvents[0]?.winner !== undefined);

// ── takeTurn after gameover is a no-op ────────────────────────────────────────
console.log("Post-gameover no-op");
const result = wg.takeTurn();
assert("takeTurn returns null after gameover", result === null);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
