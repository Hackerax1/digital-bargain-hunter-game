/**
 * player.js
 * Player data model and helper methods for Bargain Hunter.
 */

const PLAYER_COLORS = ["#e63946", "#2a9d8f", "#e9c46a", "#457b9d"];
const PLAYER_TOKENS = ["🛒", "🛍️", "💳", "🎒"];

/**
 * Creates a new player object.
 *
 * @param {number} id        - Zero-based player index (0–3)
 * @param {string} name      - Display name
 * @param {string[]} shoppingList - Items the player must buy
 * @param {number} budget    - Starting cash ($)
 * @returns {object} player
 */
function createPlayer(id, name, shoppingList, budget = 200) {
  return {
    id,
    name,
    color: PLAYER_COLORS[id] ?? "#888",
    token: PLAYER_TOKENS[id] ?? "🧍",
    position: 0,          // board space index
    budget,
    spent: 0,
    shoppingList: [...shoppingList],  // items still to buy
    purchased: [],        // { item, store, price } records
    lapsCompleted: 0,
    isActive: false,
  };
}

/**
 * Moves a player forward by `steps` spaces, wrapping around the board.
 *
 * @param {object} player
 * @param {number} steps
 * @param {number} totalSpaces
 * @returns {{ newPosition: number, lapped: boolean }}
 */
function movePlayer(player, steps, totalSpaces) {
  const prev = player.position;
  let next = (prev + steps) % totalSpaces;
  if (next < 0) next = totalSpaces + next; // handle negative moves
  const lapped = next < prev && steps > 0;
  player.position = next;
  if (lapped) player.lapsCompleted += 1;
  return { newPosition: next, lapped };
}

/**
 * Records a purchase for a player.
 *
 * @param {object} player
 * @param {string} item   - item name
 * @param {string} store  - store name
 * @param {number} price  - price paid
 * @returns {boolean} whether the purchase succeeded (enough budget & item on list)
 */
function buyItem(player, item, store, price) {
  if (!player.shoppingList.includes(item)) return false;
  if (player.budget - player.spent < price) return false;
  player.spent += price;
  player.shoppingList = player.shoppingList.filter((i) => i !== item);
  player.purchased.push({ item, store, price });
  return true;
}

/**
 * Returns the player's remaining budget.
 * @param {object} player
 * @returns {number}
 */
function remainingBudget(player) {
  return player.budget - player.spent;
}

/**
 * Returns true when the player has bought every item on their shopping list.
 * @param {object} player
 * @returns {boolean}
 */
function hasCompletedList(player) {
  return player.shoppingList.length === 0;
}

/**
 * Calculates the player's score:
 *   remaining budget  +  bonus for completing the list
 * @param {object} player
 * @param {number} completionBonus
 * @returns {number}
 */
function calculateScore(player, completionBonus = 50) {
  const bonus = hasCompletedList(player) ? completionBonus : 0;
  return remainingBudget(player) + bonus;
}

export {
  PLAYER_COLORS,
  PLAYER_TOKENS,
  createPlayer,
  movePlayer,
  buyItem,
  remainingBudget,
  hasCompletedList,
  calculateScore,
};
