/**
 * ui.js
 * DOM / UI layer for Bargain Hunter.
 *
 * Subscribes to Game events and updates the page. Also wires up buttons
 * to call back into the Game engine.
 */

import { Game } from "./game.js";
import { BOARD_SPACES, STORES, SPACE_TYPES } from "./board.js";

// ─── State ────────────────────────────────────────────────────────────────────

let game = null;

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

function log(msg, cls = "") {
  const log = $("event-log");
  const entry = document.createElement("li");
  entry.textContent = msg;
  if (cls) entry.className = cls;
  log.prepend(entry);
  // Keep log tidy
  while (log.children.length > 30) log.removeChild(log.lastChild);
}

function clearLog() {
  $("event-log").innerHTML = "";
}

// ─── Board rendering ──────────────────────────────────────────────────────────

/**
 * Builds the visual board grid from BOARD_SPACES.
 * The 40 spaces are arranged around the perimeter of a 12 × 10 grid.
 */
function buildBoard() {
  const boardEl = $("game-board");
  boardEl.innerHTML = "";

  const cols = 12;
  const rows = 10;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  boardEl.style.aspectRatio = `${cols} / ${rows}`;

  const positions = [];

  // Bottom row: left -> right
  for (let col = 0; col < cols; col += 1) positions.push([col, rows - 1]);
  // Right column: bottom-1 -> top
  for (let row = rows - 2; row >= 0; row -= 1) positions.push([cols - 1, row]);
  // Top row: right-1 -> left
  for (let col = cols - 2; col >= 0; col -= 1) positions.push([col, 0]);
  // Left column: top+1 -> bottom-1
  for (let row = 1; row <= rows - 2; row += 1) positions.push([0, row]);

  BOARD_SPACES.forEach((space, idx) => {
    const [col, row] = positions[idx];
    const cell = document.createElement("div");
    cell.className = `board-space space-${space.type}`;
    cell.id = `space-${space.id}`;
    cell.dataset.spaceId = space.id;
    cell.style.gridColumn = col + 1;
    cell.style.gridRow = row + 1;
    cell.innerHTML = `<span class="space-label">${space.label}</span><div class="tokens" id="tokens-${space.id}"></div>`;
    boardEl.appendChild(cell);
  });

  // Centre area
  const centre = document.createElement("div");
  centre.className = "board-centre";
  centre.style.gridColumn = "2 / 12";
  centre.style.gridRow = "2 / 10";
  centre.innerHTML = `
    <h2>🛒 Bargain Hunter</h2>
    <p>Online Mall Adventure</p>
    <p class="centre-subtitle">Based on the 1981<br>Milton Bradley game</p>
  `;
  boardEl.appendChild(centre);
}

/**
 * Places player tokens on their current spaces.
 */
function renderTokens(players) {
  // Clear all token containers
  document.querySelectorAll(".tokens").forEach((el) => (el.innerHTML = ""));

  players.forEach((p) => {
    const container = document.getElementById(`tokens-${p.position}`);
    if (!container) return;
    const span = document.createElement("span");
    span.className = "player-token";
    span.title = p.name;
    span.textContent = p.token;
    span.style.color = p.color;
    container.appendChild(span);
  });
}

/**
 * Highlights the space the current player is standing on.
 */
function highlightCurrentSpace(position) {
  document.querySelectorAll(".board-space").forEach((el) =>
    el.classList.remove("active-space")
  );
  const el = document.getElementById(`space-${position}`);
  if (el) el.classList.add("active-space");
}

// ─── Sidebar rendering ────────────────────────────────────────────────────────

function renderPlayers(players, currentIndex) {
  const panel = $("players-panel");
  panel.innerHTML = "";

  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "player-card" + (i === currentIndex ? " current-player" : "");
    card.style.borderColor = p.color;

    const bought = p.purchased.map((r) => `<li>${r.item} — $${r.price}</li>`).join("");
    const remaining = p.shoppingList.map((item) => `<li>${item}</li>`).join("");

    card.innerHTML = `
      <h3 style="color:${p.color}">${p.token} ${p.name}</h3>
      <p>💰 Budget: <strong>$${p.budget - p.spent}</strong> / $${p.budget}</p>
      <p>📍 Space: <strong>${BOARD_SPACES[p.position]?.label ?? "?"}</strong></p>
      <details open>
        <summary>Shopping list (${p.shoppingList.length} left)</summary>
        <ul>${remaining || "<li><em>All done! ✅</em></li>"}</ul>
      </details>
      ${
        p.purchased.length
          ? `<details><summary>Purchased (${p.purchased.length})</summary><ul>${bought}</ul></details>`
          : ""
      }
    `;
    panel.appendChild(card);
  });
}

/**
 * Updates the store panel when a player is on a store space.
 */
function renderStorePanel(space, saleActive, player) {
  const panel = $("store-panel");
  panel.innerHTML = "";

  if (game?.tagSalePrice) {
    const heading = document.createElement("h3");
    heading.textContent = `🏷️ Tag Sale — $${game.tagSalePrice} per item`;
    panel.appendChild(heading);

    const affordable = player.budget - player.spent >= game.tagSalePrice;
    const items = [...new Set(player.shoppingList)].filter((item) =>
      Object.values(STORES).some((store) => item in store.items)
    );

    if (!items.length) {
      panel.innerHTML += `<p class="no-store">No shopping-list items available for Tag Sale.</p>`;
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "store-item on-list";

      const btn = document.createElement("button");
      btn.className = "buy-btn";
      btn.textContent = "Buy";
      btn.disabled = !affordable;
      btn.addEventListener("click", () => {
        const result = game.purchaseTagSaleItem(item);
        log(result.message, result.success ? "log-success" : "log-error");
        if (result.success) {
          renderStorePanel(space, game.saleActive, game.currentPlayer);
          renderPlayers(game.players, game.currentPlayerIndex);
        }
      });

      row.innerHTML = `
        <span class="item-name">⭐ ${item}</span>
        <span class="item-price">$${game.tagSalePrice}</span>
      `;
      row.appendChild(btn);
      panel.appendChild(row);
    });

    return;
  }

  if (space.type !== SPACE_TYPES.STORE || !space.storeId) {
    panel.innerHTML = `<p class="no-store">No store here. End your turn.</p>`;
    return;
  }

  const store = STORES[space.storeId];
  if (!store) return;

  const heading = document.createElement("h3");
  heading.textContent = `🏪 ${store.name}`;
  if (saleActive) {
    const badge = document.createElement("span");
    badge.className = "sale-badge";
    badge.textContent = "25% OFF!";
    heading.appendChild(badge);
  }
  panel.appendChild(heading);

  Object.entries(store.items).forEach(([item, basePrice]) => {
    const price = saleActive ? Math.floor(basePrice * 0.75) : basePrice;
    const onList = player.shoppingList.includes(item);
    const petItem = space.storeId === "pets";
    const alreadyBought = player.purchased.some((r) => r.item === item);
    const affordable = player.budget - player.spent >= price;
    const buyAllowed = (onList || petItem) && !alreadyBought && affordable;

    const row = document.createElement("div");
    row.className = "store-item" + (onList ? " on-list" : "") + (alreadyBought ? " bought" : "");

    const btn = document.createElement("button");
    btn.className = "buy-btn";
    btn.textContent = "Buy";
    btn.disabled = !buyAllowed;
    btn.addEventListener("click", () => {
      const result = game.purchaseItem(item);
      log(result.message, result.success ? "log-success" : "log-error");
      if (result.success) {
        renderStorePanel(space, game.saleActive, game.currentPlayer);
        renderPlayers(game.players, game.currentPlayerIndex);
      }
    });

    row.innerHTML = `
      <span class="item-name">${onList ? "⭐ " : ""}${item}</span>
      <span class="item-price ${saleActive ? "sale-price" : ""}">$${price}</span>
      ${alreadyBought ? '<span class="bought-badge">✅ Bought</span>' : ""}
    `;
    if (!alreadyBought) row.appendChild(btn);
    panel.appendChild(row);
  });
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function setControlsState(phase) {
  $("btn-roll").disabled = phase !== "playing";
  $("btn-end-turn").disabled = phase !== "playing";
}

// ─── Game event wiring ────────────────────────────────────────────────────────

function wireGameEvents(g) {
  g.on("gameStarted", ({ players, board }) => {
    clearLog();
    buildBoard();
    renderTokens(players);
    renderPlayers(players, 0);
    highlightCurrentSpace(0);
    renderStorePanel(board[0], false, players[0]);
    setControlsState("playing");
    log("🎮 Game started! " + players.map((p) => p.name).join(", ") + " are playing.");
    $("game-status").textContent = `Round 1 — ${players[0].name}'s turn`;
  });

  g.on("playerMoved", ({ player, roll, newPosition, space }) => {
    renderTokens(g.players);
    highlightCurrentSpace(newPosition);
    log(`🎲 ${player.name} rolled ${roll.die1}+${roll.die2}=${roll.total} → landed on "${space.label}"`);
    $("dice-result").textContent = `🎲 ${roll.die1} + ${roll.die2} = ${roll.total}`;
  });

  g.on("turnReady", ({ player, space, saleActive }) => {
    renderStorePanel(space, saleActive, player);
    renderPlayers(g.players, g.currentPlayerIndex);
  });

  g.on("saleActivated", ({ player }) => {
    log(`📢 SALE! ${player.name} gets 25% off at any store this turn!`, "log-sale");
  });

  g.on("tagSaleActivated", ({ player, spin, price }) => {
    log(`🏷️ TAG SALE! ${player.name} can buy any listed item for $${price} (spin ${spin} x $10).`, "log-sale");
    renderStorePanel(g.currentSpace, g.saleActive, player);
  });

  g.on("paydayCollected", ({ player, amount }) => {
    log(`💵 ${player.name} collected $${amount} at Payday.`, "log-success");
    renderPlayers(g.players, g.currentPlayerIndex);
  });

  g.on("eventsCardDrawRequested", ({ player }) => {
    log(`🃏 ${player.name} draws an Events card.`, "log-round");
  });

  g.on("bargainFinderDrawRequested", ({ player }) => {
    log(`🛒 ${player.name} draws a Bargain Finder card.`, "log-round");
  });

  g.on("choiceRequired", ({ player, message }) => {
    log(`❓ ${player.name}: ${message}`, "log-round");
  });

  g.on("forcedMove", ({ player, space }) => {
    log(`↪ ${player.name} was moved to "${space.label}".`, "log-round");
    renderTokens(g.players);
    highlightCurrentSpace(player.position);
  });

  g.on("taxCharged", ({ player, amount }) => {
    log(`💸 ${player.name} paid $${amount} in taxes.`, "log-tax");
    renderPlayers(g.players, g.currentPlayerIndex);
  });

  g.on("extraMove", ({ player, spaces, space }) => {
    const dir = spaces > 0 ? `forward ${spaces}` : `back ${Math.abs(spaces)}`;
    log(`↕ ${player.name} moved ${dir} extra → "${space.label}"`);
    renderTokens(g.players);
    highlightCurrentSpace(player.position);
  });

  g.on("itemPurchased", ({ player, item, store, price, remainingBudget }) => {
    log(`🛍️ ${player.name} bought "${item}" at ${store} for $${price}. Budget left: $${remainingBudget}`, "log-success");
    renderPlayers(g.players, g.currentPlayerIndex);
  });

  g.on("turnEnded", ({ player }) => {
    log(`✅ ${player.name} ended their turn.`);
  });

  g.on("newRound", ({ round }) => {
    log(`── Round ${round} begins ──`, "log-round");
    $("game-status").textContent = `Round ${round} — ${g.currentPlayer.name}'s turn`;
  });

  g.on("nextTurn", ({ player, round }) => {
    $("game-status").textContent = `Round ${round} — ${player.name}'s turn`;
    renderStorePanel(g.currentSpace, false, player);
    renderPlayers(g.players, g.currentPlayerIndex);
    highlightCurrentSpace(player.position);
  });

  g.on("gameOver", ({ winner, reason, scores }) => {
    setControlsState("gameover");
    const scoreList = scores
      .map((s) => `${s.player.name}: $${s.score}`)
      .join(" | ");
    log(`🏆 Game over! ${winner.name} wins (${reason}). Scores — ${scoreList}`, "log-win");
    $("game-status").textContent = `🏆 ${winner.name} wins!`;
    showModal(winner, scores);
  });
}

// ─── Win modal ────────────────────────────────────────────────────────────────

function showModal(winner, scores) {
  const modal = $("win-modal");
  const rows = scores
    .map(
      (s, i) =>
        `<tr class="${i === 0 ? "winner-row" : ""}"><td>${i + 1}</td><td>${s.player.token} ${s.player.name}</td><td>$${s.score}</td></tr>`
    )
    .join("");
  $("modal-body").innerHTML = `
    <h2>🏆 ${winner.token} ${winner.name} Wins!</h2>
    <table class="score-table">
      <thead><tr><th>#</th><th>Player</th><th>Score</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  modal.classList.remove("hidden");
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function startGame() {
  const inputs = document.querySelectorAll(".player-name-input");
  const names = [];
  inputs.forEach((inp) => {
    const val = inp.value.trim();
    if (val) names.push(val);
  });

  if (names.length < 2) {
    alert("Please enter at least 2 player names.");
    return;
  }

  $("setup-screen").classList.add("hidden");
  $("game-screen").classList.remove("hidden");

  game = new Game();
  wireGameEvents(game);
  game.setup(names);
}

// ─── Button handlers ──────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  $("btn-start-game").addEventListener("click", startGame);

  $("btn-roll").addEventListener("click", () => {
    if (!game) return;
    game.takeTurn();
    $("btn-roll").disabled = true;
    $("btn-end-turn").disabled = false;
  });

  $("btn-end-turn").addEventListener("click", () => {
    if (!game) return;
    game.endTurn();
    $("btn-roll").disabled = false;
    $("btn-end-turn").disabled = true;
  });

  $("btn-play-again").addEventListener("click", () => {
    $("win-modal").classList.add("hidden");
    $("game-screen").classList.add("hidden");
    $("setup-screen").classList.remove("hidden");
    game = null;
    $("dice-result").textContent = "";
    $("game-status").textContent = "";
    $("event-log").innerHTML = "";
    $("players-panel").innerHTML = "";
    $("store-panel").innerHTML = "";
  });

  // Allow pressing Enter to start the game from the setup form
  document.querySelectorAll(".player-name-input").forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
  });
});
