import { createShoppingListFromTemplate } from "../data/shopping-list.js";

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
    position: { spaceId: "payday", context: "outer" },
    isActive: index === 0,
  }));
}

const BOARD_ORDER = [
  "payday",
  "events",
  "penalty",
  "sale",
  "dept_a",
  "dept_b",
  "furn_a",
  "furn_b",
  "pets",
  "tag_sale",
];

export function createInitialShoppingList() {
  return createShoppingListFromTemplate();
}

export function buildBoardGraph() {
  const spaces = {
    payday: {
      id: "payday",
      type: "payday",
      label: "Payday",
      nextIds: ["events"],
    },
    events: {
      id: "events",
      type: "events",
      label: "Events",
      nextIds: ["penalty"],
    },
    penalty: {
      id: "penalty",
      type: "penalty",
      label: "Penalty",
      nextIds: ["sale"],
    },
    sale: {
      id: "sale",
      type: "sale",
      label: "Sale",
      nextIds: ["dept_a"],
    },
    dept_a: {
      id: "dept_a",
      type: "store_entrance",
      label: "Dept A",
      storeId: "dept_a",
      nextIds: ["dept_b"],
    },
    dept_b: {
      id: "dept_b",
      type: "store_entrance",
      label: "Dept B",
      storeId: "dept_b",
      nextIds: ["furn_a"],
    },
    furn_a: {
      id: "furn_a",
      type: "store_entrance",
      label: "Furn A",
      storeId: "furn_a",
      nextIds: ["furn_b"],
    },
    furn_b: {
      id: "furn_b",
      type: "store_entrance",
      label: "Furn B",
      storeId: "furn_b",
      nextIds: ["pets"],
    },
    pets: {
      id: "pets",
      type: "store_entrance",
      label: "Pets",
      storeId: "pets",
      nextIds: ["tag_sale"],
    },
    tag_sale: {
      id: "tag_sale",
      type: "tag_sale",
      label: "Tag Sale",
      nextIds: ["payday"],
    },
  };

  return {
    spaces,
    outerStartId: "payday",
  };
}

export function getNextSpaceId(currentSpaceId, spin) {
  const movementPath = getMovementPath(currentSpaceId, spin);
  return movementPath[movementPath.length - 1] ?? currentSpaceId;
}

export function getMovementPath(currentSpaceId, spin) {
  const currentIndex = BOARD_ORDER.indexOf(currentSpaceId);
  if (currentIndex === -1 || spin <= 0) {
    return [];
  }

  return Array.from({ length: spin }, (_, stepIndex) => {
    const nextIndex = (currentIndex + stepIndex + 1) % BOARD_ORDER.length;
    return BOARD_ORDER[nextIndex];
  });
}
