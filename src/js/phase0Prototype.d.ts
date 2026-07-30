import type { BoardGraph, Card, Player, ShoppingItem } from "../types";

export function createInitialPlayers(names: string[]): Player[];
export function createInitialShoppingList(): ShoppingItem[];
export function buildBoardGraph(): BoardGraph;
export function getNextSpaceId(currentSpaceId: string, spin: number): string;
export function getMovementPath(currentSpaceId: string, spin: number): string[];
