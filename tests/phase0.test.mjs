import {
  createInitialPlayers,
  createInitialShoppingList,
  buildBoardGraph,
  getMovementPath,
  getNextSpaceId,
  BOARD_ORDER,
  BOARD_STORE_SEQUENCE,
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
assert("includes the payday space", Boolean(board.spaces["0"]));
assert("uses a 40-space board order", BOARD_ORDER.length === 40);
assert("uses the board-image store sequence", BOARD_STORE_SEQUENCE.join(",") === "dept_b,furn_b,pets,dept_a,furn_a");

// Test store branches exist
assert("includes store internal spaces", Object.keys(board.spaces).length > 40);
assert("dept_a has internal spaces", board.spaces["dept_a_0"] !== undefined);
assert("pets has YOUR_CHOICE space", Object.values(board.spaces).some(s => s.type === "your_choice"));

const list = createInitialShoppingList();
assert("creates a full 19-item shopping list", list.length === 19);
assert("creates exactly two pet slots", list.filter((item) => item.isPetSlot).length === 2);

const movementPath = getMovementPath("0", 3, board);
assert(
  "movement path includes intermediate spaces and wraps board order",
  movementPath.length === 3 && movementPath[0] === "1" && movementPath[1] === "2" && movementPath[2] === "3"
);
assert("getNextSpaceId returns the final step in movement path", getNextSpaceId("0", 3, board) === "3");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
