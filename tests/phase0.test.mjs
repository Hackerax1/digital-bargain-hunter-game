import {
  createInitialPlayers,
  createInitialShoppingList,
  buildBoardGraph,
  getMovementPath,
  getNextSpaceId,
} from "../src/js/phase0Prototype.js";

let passed = 0;
let failed = 0;

function assert(desc, cond) {
  if (cond) {
    console.log("  ✅", desc);
    passed += 1;
  } else {
    console.error("  ❌", desc);
    failed += 1;
  }
}

const players = createInitialPlayers(["Alice", "Bob"]);
assert("creates two players with starting cash", players.length === 2 && players[0].cash === 1000 && players[1].cash === 1000);
assert("marks the first player active", players[0].isActive === true && players[1].isActive === false);

const board = buildBoardGraph();
assert("builds a board with spaces", Object.keys(board.spaces).length > 0);
assert("includes the payday space", Boolean(board.spaces.payday));

const list = createInitialShoppingList();
assert("creates a full 19-item shopping list", list.length === 19);
assert("creates exactly two pet slots", list.filter((item) => item.isPetSlot).length === 2);

const movementPath = getMovementPath("pets", 3);
assert(
  "movement path includes intermediate spaces and wraps board order",
  movementPath.length === 3 && movementPath[0] === "tag_sale" && movementPath[1] === "payday" && movementPath[2] === "events"
);
assert("getNextSpaceId returns the final step in movement path", getNextSpaceId("pets", 3) === "events");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
