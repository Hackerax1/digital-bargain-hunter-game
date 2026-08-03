import { createShoppingListFromTemplate } from "../data/shopping-list.js";
import { BOARD_SPACES } from "./board.js";
import { stores } from "../data/stores.ts";

export const BOARD_STORE_SEQUENCE = ["dept_b", "furn_b", "pets", "dept_a", "furn_a"];
const PAYDAY_SPACE_ID = "0";

// Map outer ring entrance space index to exit space index (per design doc §17-A)
const STORE_EXIT_MAP = {
  4: 7,   // Purple Dept: entrance 5 (index 4) → exit 8 (index 7)
  9: 14,  // Blue Furn: entrance 10 (index 9) → exit 15 (index 14)
  17: 22, // Pets: entrance 18 (index 17) → exit 23 (index 22)
  24: 27, // Olive Dept: entrance 25 (index 24) → exit 28 (index 27)
  29: 34, // Green Furn: entrance 30 (index 29) → exit 35 (index 34)
};

const BOARD_SPACE_SEQUENCE = Array.from({ length: 40 }, (_, index) => index);
export const BOARD_ORDER = BOARD_SPACE_SEQUENCE.map((index) => String(index));

function deriveSpaceType(space) {
  if (space.storeId) {
    return "store_entrance";
  }

  const label = space.label.toLowerCase();
  if (label.includes("payday")) {
    return "payday";
  }
  if (label.includes("tag sale")) {
    return "tag_sale";
  }
  if (label.includes("sale")) {
    return "sale";
  }
  if (label.includes("events card")) {
    return "events";
  }
  if (label.includes("window shopping")) {
    return "window_shopping";
  }
  if (label.includes("go back") || label.includes("go to")) {
    return "move";
  }
  if (label.includes("restaurant") || label.includes("auto repairs") || label.includes("doctor") || label.includes("charity") || label.includes("gift shop") || label.includes("lottery")) {
    return "penalty";
  }
  if (label.includes("bargain finder")) {
    return "bargain_finder";
  }
  return "move";
}

export function createInitialPlayers(names) {
  const colors = ["#e63946", "#2a9d8f", "#e9c46a", "#457b9d"];

  return names.map((name, index) => ({
    id: `${index + 1}`,
    name,
    pawnColor: colors[index] ?? "#888",
    cash: 1000,
    loanBalance: 0,
    inFinancialDisaster: false,
    shoppingList: createInitialShoppingList(),
    bargainFinderHand: [],
    holdableEvents: [],
    position: { spaceId: PAYDAY_SPACE_ID, context: "outer" },
    isActive: index === 0,
  }));
}

export function createInitialShoppingList() {
  return createShoppingListFromTemplate();
}

export function buildBoardGraph() {
  const spaces = {};

  // Build outer ring (40 spaces)
  BOARD_SPACES.forEach((space, index) => {
    const id = String(index);
    const type = deriveSpaceType(space);
    const nextIndex = (index + 1) % BOARD_SPACES.length;

    spaces[id] = {
      id,
      type,
      label: space.label,
      context: "outer",
      effect: space.effect || null,
      ...(space.storeId ? { storeId: space.storeId } : {}),
      nextIds: [String(nextIndex)],
    };
  });

  // Build store branches
  stores.forEach((store) => {
    // Find entrance space on outer ring
    const entranceSpace = Object.values(spaces).find(
      (s) => s.storeId === store.id && s.type === "store_entrance"
    );
    if (!entranceSpace) return;

    const entranceIndex = parseInt(entranceSpace.id);
    const exitIndex = STORE_EXIT_MAP[entranceIndex];
    if (exitIndex === undefined) return;

    // Create internal store spaces
    const storeSpaces = [];
    store.itemOrder.forEach((itemId, idx) => {
      const spaceId = `${store.id}_${idx}`;
      const isSale = itemId === "SALE";
      const isYourChoice = itemId === "YOUR_CHOICE";
      
      spaces[spaceId] = {
        id: spaceId,
        type: isSale ? "sale" : isYourChoice ? "your_choice" : "item",
        label: isSale ? "SALE!" : isYourChoice ? "Your Choice" : itemId.replace(/_/g, " "),
        context: store.id,
        itemId: isSale || isYourChoice ? undefined : itemId,
        storeId: store.id,
        nextIds: [], // Will be set below
      };
      storeSpaces.push(spaceId);
    });

    // Create store exit space (links back to outer ring)
    const exitSpaceId = `${store.id}_exit`;
    spaces[exitSpaceId] = {
      id: exitSpaceId,
      type: "store_exit",
      label: `Exit ${store.name}`,
      context: store.id,
      storeId: store.id,
      outerExitId: String(exitIndex), // Where to return on outer ring
      nextIds: [String(exitIndex)],
    };
    storeSpaces.push(exitSpaceId);

    // Link store entrance to first internal space
    entranceSpace.storeEntryId = storeSpaces[0];

    // Link internal spaces counter-clockwise
    for (let i = 0; i < storeSpaces.length; i++) {
      const nextIdx = (i + 1) % storeSpaces.length;
      spaces[storeSpaces[i]].nextIds = [storeSpaces[nextIdx]];
    }
    // Last space (exit) links back to outer ring
    spaces[storeSpaces[storeSpaces.length - 1]].nextIds = [String(exitIndex)];
  });

  return {
    spaces,
    outerStartId: PAYDAY_SPACE_ID,
    order: BOARD_ORDER,
  };
}

export function getMovementPath(currentSpaceId, spin, boardGraph) {
  if (!boardGraph || spin <= 0) {
    return [];
  }

  const path = [];
  let currentId = currentSpaceId;

  for (let step = 0; step < spin; step++) {
    const currentSpace = boardGraph.spaces[currentId];
    if (!currentSpace || currentSpace.nextIds.length === 0) {
      break;
    }

    // Always follow the first nextId (linear path)
    const nextId = currentSpace.nextIds[0];
    path.push(nextId);
    currentId = nextId;
  }

  return path;
}

export function getNextSpaceId(currentSpaceId, spin, boardGraph) {
  const movementPath = getMovementPath(currentSpaceId, spin, boardGraph);
  return movementPath[movementPath.length - 1] ?? currentSpaceId;
}
