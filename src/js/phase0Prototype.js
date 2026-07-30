import { createShoppingListFromTemplate } from "../data/shopping-list.js";
import { BOARD_SPACES } from "./board.js";

export const BOARD_STORE_SEQUENCE = ["dept_b", "furn_b", "pets", "dept_a", "furn_a"];
const PAYDAY_SPACE_ID = "0";

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
  const spaces = Object.fromEntries(
    BOARD_SPACES.map((space, index) => {
      const id = String(index);
      const type = deriveSpaceType(space);

      return [
        id,
        {
          id,
          type,
          label: space.label,
          ...(space.storeId ? { storeId: space.storeId } : {}),
          nextIds: [BOARD_ORDER[(index + 1) % BOARD_ORDER.length]],
        },
      ];
    })
  );

  return {
    spaces,
    outerStartId: PAYDAY_SPACE_ID,
    order: BOARD_ORDER,
  };
}

export function getNextSpaceId(currentSpaceId, spin) {
  const movementPath = getMovementPath(currentSpaceId, spin);
  return movementPath[movementPath.length - 1] ?? currentSpaceId;
}

export function getMovementPath(currentSpaceId, spin) {
  const currentIndex = BOARD_ORDER.indexOf(String(currentSpaceId));
  if (currentIndex === -1 || spin <= 0) {
    return [];
  }

  return Array.from({ length: spin }, (_, stepIndex) => {
    const nextIndex = (currentIndex + stepIndex + 1) % BOARD_ORDER.length;
    return BOARD_ORDER[nextIndex];
  });
}
