// ─── Core type definitions for Bargain Hunter Digital ───────────────────────
// Based on design doc §8

export type StoreId = "dept_a" | "dept_b" | "furn_a" | "furn_b" | "pets";

export type CardDeck = "bargainFinder" | "events";

export type CardKind = "move" | "discount" | "immediate" | "holdable";

export type GamePhase = "lobby" | "playing" | "finished";

export type SpaceContext = "outer" | StoreId;

// ─── Card effects ─────────────────────────────────────────────────────────────

export interface MoveEffect {
  type: "move";
  /** Destination space id (shortcut) */
  targetSpaceId: string;
}

export interface DiscountEffect {
  type: "discount";
  /** Flat dollar amount off a single purchase */
  amount: number;
  /** Optional restriction to a specific store */
  storeId?: StoreId;
}

export interface CashEffect {
  type: "cash";
  /** Positive = receive money, negative = lose money */
  amount: number;
}

export interface SkipEffect {
  type: "skip";
  /** Number of turns the targeted player skips */
  turns: number;
}

export interface SaleEffect {
  type: "sale";
  /** Which stores' top price card is rotated; empty = player chooses */
  storeIds: StoreId[];
}

export type CardEffect =
  | MoveEffect
  | DiscountEffect
  | CashEffect
  | SkipEffect
  | SaleEffect;

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface Card {
  id: string;
  deck: CardDeck;
  kind: CardKind;
  title: string;
  text: string;
  effect: CardEffect;
}

// ─── Shopping list ────────────────────────────────────────────────────────────

export interface ShoppingItem {
  itemId: string;
  name: string;
  purchased: boolean;
  pricePaid?: number;
  isPetSlot?: boolean;
  /** Enforced distinct across the two pet slots */
  petSpecies?: string;
}

// ─── Store / price deck ───────────────────────────────────────────────────────

export type StoreColorGroup =
  | "deptA"
  | "deptB"
  | "furnA"
  | "furnB"
  | "pets";

/** A single price card — maps itemId → price in dollars */
export interface PriceCard {
  id: string;
  /** Friendly label shown when the card is active, e.g. "Summer Sale" */
  label: string;
  prices: Record<string, number>;
}

export interface Store {
  id: StoreId;
  name: string;
  colorGroup: StoreColorGroup;
  /** Length-4 array; index 0 is the active (top) card */
  priceDeck: PriceCard[];
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  pawnColor: string;
  /** Source of truth for all arithmetic — always an integer number of dollars */
  cash: number;
  /** 0–1000; values >1000 indicate Financial Disaster */
  loanBalance: number;
  inFinancialDisaster: boolean;
  shoppingList: ShoppingItem[];
  /** Max length 3 */
  bargainFinderHand: Card[];
  holdableEvents: Card[];
  position: { spaceId: string; context: SpaceContext };
}

// ─── Board ────────────────────────────────────────────────────────────────────

export type SpaceType =
  | "payday"
  | "events"
  | "penalty"
  | "sale"
  | "tag_sale"
  | "bargain_finder"
  | "window_shopping"
  | "store_entrance"
  | "store_exit"
  | "item"
  | "bargain_item";

export interface BoardSpace {
  id: string;
  type: SpaceType;
  /** Label shown on the space */
  label: string;
  /** For item/bargain_item spaces: which item is for sale here */
  itemId?: string;
  /** For store_entrance spaces: which store this leads into */
  storeId?: StoreId;
  /** Adjacency list (clockwise on outer ring; counter-clockwise inside stores) */
  nextIds: string[];
}

export interface BoardGraph {
  spaces: Record<string, BoardSpace>;
  outerStartId: string;
}

// ─── Game state ───────────────────────────────────────────────────────────────

export interface GameState {
  id: string;
  roomCode: string;
  players: Player[];
  board: BoardGraph;
  stores: Store[];
  bargainFinderDeck: Card[];
  eventsDeck: Card[];
  /** Index into players[] — whose turn it is */
  turnIndex: number;
  phase: GamePhase;
  /** For replay / audit */
  rngSeed: string;
}

// ─── Cash display helper ─────────────────────────────────────────────────────
// Design doc §11

export const DENOMINATIONS = [500, 100, 50, 20, 10, 5] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

export function toBillBreakdown(
  total: number
): Record<Denomination, number> & { loose: number } {
  let remaining = total;
  const breakdown = {} as Record<Denomination, number>;
  for (const bill of DENOMINATIONS) {
    breakdown[bill] = Math.floor(remaining / bill);
    remaining %= bill;
  }
  return { ...breakdown, loose: remaining };
}
