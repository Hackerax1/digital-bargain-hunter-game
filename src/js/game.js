/**
 * game.js
 * Core game engine for Bargain Hunter.
 *
 * Manages turns, dice, board effects, and win conditions.
 * Communicates with the UI layer through a simple event emitter.
 */

import {
  BOARD_SPACES,
  TOTAL_SPACES,
  STORES,
  SHOPPING_LISTS,
  SPACE_TYPES,
} from "./board.js";

import {
  createPlayer,
  movePlayer,
  buyItem,
  remainingBudget,
  hasCompletedList,
  calculateScore,
} from "./player.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const DEFAULT_BUDGET = 200;
const MAX_ROUNDS = 10;       // game ends after this many full rounds
const SALE_DISCOUNT = 0.25;  // 25% off at any store this turn

// ─── Event system ─────────────────────────────────────────────────────────────

/**
 * Tiny event emitter so the UI can subscribe to game events without the game
 * engine knowing anything about the DOM.
 */
class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return this;
  }

  off(event, fn) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter((l) => l !== fn);
    }
  }

  emit(event, data) {
    (this._listeners[event] ?? []).forEach((fn) => fn(data));
  }
}

// ─── Dice ─────────────────────────────────────────────────────────────────────

/**
 * Rolls two six-sided dice and returns { die1, die2, total }.
 */
function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, total: die1 + die2 };
}

// ─── Game class ───────────────────────────────────────────────────────────────

class Game extends EventEmitter {
  constructor() {
    super();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.phase = "setup";   // setup | playing | gameover
    this.saleActive = false; // discount flag for current turn
    this.lastDiceRoll = null;
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  /**
   * Initialises a new game.
   * @param {string[]} playerNames  2–4 player names
   */
  setup(playerNames) {
    if (playerNames.length < MIN_PLAYERS || playerNames.length > MAX_PLAYERS) {
      throw new RangeError(
        `Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`
      );
    }

    this.players = playerNames.map((name, i) =>
      createPlayer(i, name, SHOPPING_LISTS[i], DEFAULT_BUDGET)
    );

    this.currentPlayerIndex = 0;
    this.round = 1;
    this.phase = "playing";
    this.saleActive = false;
    this.lastDiceRoll = null;

    this.players[0].isActive = true;

    this.emit("gameStarted", {
      players: this.players,
      board: BOARD_SPACES,
      stores: STORES,
    });
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get currentSpace() {
    return BOARD_SPACES[this.currentPlayer.position];
  }

  // ── Turn flow ──────────────────────────────────────────────────────────────

  /**
   * Rolls dice and moves the current player. Returns the dice result.
   * @returns {{ die1, die2, total }}
   */
  takeTurn() {
    if (this.phase !== "playing") return null;

    this.saleActive = false;
    const roll = rollDice();
    this.lastDiceRoll = roll;

    const player = this.currentPlayer;
    const { newPosition, lapped } = movePlayer(player, roll.total, TOTAL_SPACES);

    this.emit("playerMoved", {
      player,
      roll,
      newPosition,
      lapped,
      space: BOARD_SPACES[newPosition],
    });

    if (lapped) {
      this.emit("playerLapped", { player });
    }

    this._applySpaceEffect(player, BOARD_SPACES[newPosition]);

    this.emit("turnReady", {
      player,
      space: BOARD_SPACES[newPosition],
      saleActive: this.saleActive,
      stores: STORES,
    });

    return roll;
  }

  /**
   * Called by the UI when the player has finished shopping on their space.
   * Advances to the next player / round, and checks win conditions.
   */
  endTurn() {
    if (this.phase !== "playing") return;

    const player = this.currentPlayer;
    player.isActive = false;

    this.emit("turnEnded", { player });

    // Advance to next player
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;

    // Detect new round
    if (this.currentPlayerIndex === 0) {
      this.round += 1;
      this.emit("newRound", { round: this.round });
    }

    this.players[this.currentPlayerIndex].isActive = true;

    // Check win conditions
    if (this._checkWin()) return;

    this.emit("nextTurn", {
      player: this.currentPlayer,
      round: this.round,
    });
  }

  // ── Shopping ───────────────────────────────────────────────────────────────

  /**
   * Attempts to buy an item at the current store space.
   *
   * @param {string} itemName
   * @returns {{ success: boolean, message: string }}
   */
  purchaseItem(itemName) {
    const player = this.currentPlayer;
    const space = this.currentSpace;

    if (space.type !== SPACE_TYPES.STORE || !space.storeId) {
      return { success: false, message: "You are not at a store." };
    }

    const store = STORES[space.storeId];
    if (!store) {
      return { success: false, message: "Store not found." };
    }

    if (!(itemName in store.items)) {
      return { success: false, message: `${store.name} doesn't sell "${itemName}".` };
    }

    let price = store.items[itemName];
    if (this.saleActive) {
      price = Math.floor(price * (1 - SALE_DISCOUNT));
    }

    const ok = buyItem(player, itemName, store.name, price);
    if (!ok) {
      if (!player.shoppingList.includes(itemName)) {
        return { success: false, message: `"${itemName}" is not on your shopping list.` };
      }
      return {
        success: false,
        message: `Not enough budget. You need $${price} but only have $${remainingBudget(player)}.`,
      };
    }

    this.emit("itemPurchased", {
      player,
      item: itemName,
      store: store.name,
      price,
      saleActive: this.saleActive,
      remainingBudget: remainingBudget(player),
      shoppingListRemaining: player.shoppingList.length,
    });

    return { success: true, message: `Bought "${itemName}" for $${price} at ${store.name}.` };
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /**
   * Resolves the effect of landing on a non-store space.
   * @param {object} player
   * @param {object} space
   */
  _applySpaceEffect(player, space) {
    switch (space.type) {
      case SPACE_TYPES.SALE:
        this.saleActive = true;
        this.emit("saleActivated", { player });
        break;

      case SPACE_TYPES.TAX: {
        const amount = space.effect?.amount ?? 10;
        player.spent += amount;
        this.emit("taxCharged", { player, amount, remainingBudget: remainingBudget(player) });
        break;
      }

      case SPACE_TYPES.MOVE: {
        const extra = space.effect?.spaces ?? 0;
        if (extra !== 0) {
          const { newPosition } = movePlayer(player, extra, TOTAL_SPACES);
          this.emit("extraMove", {
            player,
            spaces: extra,
            newPosition,
            space: BOARD_SPACES[newPosition],
          });
        }
        break;
      }

      case SPACE_TYPES.PARKING:
        this.emit("parking", { player });
        break;

      default:
        break;
    }
  }

  /**
   * Checks whether any win condition has been reached.
   * @returns {boolean} true when the game has ended
   */
  _checkWin() {
    // A player wins immediately upon completing their shopping list
    const winner = this.players.find(hasCompletedList);
    if (winner) {
      this._endGame(winner, "completed their shopping list");
      return true;
    }

    // Or after MAX_ROUNDS, the player with the highest score wins
    if (this.round > MAX_ROUNDS) {
      const scores = this.players.map((p) => ({
        player: p,
        score: calculateScore(p),
      }));
      scores.sort((a, b) => b.score - a.score);
      this._endGame(scores[0].player, "highest score after all rounds", scores);
      return true;
    }

    return false;
  }

  /**
   * Transitions the game to gameover state.
   */
  _endGame(winner, reason, scores = null) {
    this.phase = "gameover";
    const allScores = scores ?? this.players.map((p) => ({
      player: p,
      score: calculateScore(p),
    }));
    this.emit("gameOver", { winner, reason, scores: allScores });
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export { Game, rollDice, SALE_DISCOUNT, MAX_ROUNDS, MIN_PLAYERS, MAX_PLAYERS };
