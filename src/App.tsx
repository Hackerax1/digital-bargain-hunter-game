import { useState } from "react";
import "./App.css";
import BoardView from "./components/BoardView";
import CardDrawModal from "./components/CardDrawModal";
import CashDisplay from "./components/CashDisplay";
import PriceCardDisplay from "./components/PriceCardDisplay";
import ShoppingListPanel from "./components/ShoppingListPanel";
import { PET_ITEM_IDS } from "./data/shopping-list";
import { rotatePriceDeck, stores as baseStores } from "./data/stores";
import { eventsCards } from "./data/events-cards";
import { buildBoardGraph, createInitialPlayers, getMovementPath } from "./js/phase0Prototype";
import type { BoardGraph, Card, Player, Store } from "./types";

const PET_ITEM_SET = new Set(PET_ITEM_IDS);

function toDisplayName(value: string): string {
  return value
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function findOpenPetSlot(player: Player) {
  return player.shoppingList.find((entry) => entry.isPetSlot && !entry.purchased);
}

function purchasedPetSpecies(player: Player): Set<string> {
  return new Set(
    player.shoppingList
      .filter((entry) => entry.isPetSlot && entry.purchased && entry.petSpecies)
      .map((entry) => entry.petSpecies as string)
  );
}

function cloneStores(stores: Store[]): Store[] {
  return stores.map((store) => ({
    ...store,
    priceDeck: store.priceDeck.map((card) => ({
      ...card,
      prices: { ...card.prices },
    })),
  }));
}

function createInitialStoreState(): Store[] {
  return cloneStores(baseStores);
}

function App() {
  const [players, setPlayers] = useState<Player[]>(() => createInitialPlayers(["Alice", "Bob"]));
  const [turnIndex, setTurnIndex] = useState(0);
  const [board] = useState<BoardGraph>(buildBoardGraph());
  const [stores, setStores] = useState<Store[]>(() => createInitialStoreState());
  const [phase, setPhase] = useState<"playing" | "finished">("playing");
  const [roll, setRoll] = useState<number | null>(null);
  const [saleActive, setSaleActive] = useState(false);
  const [tagSalePrice, setTagSalePrice] = useState<number | null>(null);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [skipTurns, setSkipTurns] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("Roll the die to begin the first turn.");

  const activePlayer = players[turnIndex];
  const currentSpace = board.spaces[activePlayer.position.spaceId];
  const currentStore =
    currentSpace.type === "store_entrance" && currentSpace.storeId
      ? stores.find((store) => store.id === currentSpace.storeId)
      : undefined;

  const handleRoll = () => {
    if (phase !== "playing") {
      return;
    }

    if (roll !== null) {
      setMessage(`${activePlayer.name} already rolled this turn. End turn when ready.`);
      return;
    }

    if ((skipTurns[activePlayer.id] ?? 0) > 0) {
      setMessage(`${activePlayer.name} must skip this turn.`);
      return;
    }

    const nextRoll = 1 + Math.floor(Math.random() * 8);
    const movementPath = getMovementPath(activePlayer.position.spaceId, nextRoll);
    const nextSpaceId = movementPath[movementPath.length - 1] ?? activePlayer.position.spaceId;
    const nextSpace = board.spaces[nextSpaceId];

    const nextPlayers = players.map((player) => ({ ...player }));
    const updatedPlayer = {
      ...nextPlayers[turnIndex],
      position: { ...nextPlayers[turnIndex].position, spaceId: nextSpaceId },
    };

    const passedOrLandedPayday = movementPath.includes("payday");
    if (passedOrLandedPayday) {
      updatedPlayer.cash += 300;
    }

    if (nextSpace.type === "penalty") {
      updatedPlayer.cash -= nextRoll * 10;
    }

    nextPlayers[turnIndex] = updatedPlayer;

    let nextMessage = `${activePlayer.name} rolled ${nextRoll} and moved to ${nextSpace.label}.`;
    let nextSaleActive = false;
    let nextTagSalePrice: number | null = null;
    let nextDrawnCard: Card | null = null;
    let resolvedSpace = nextSpace;
    let pendingSkipTurns = 0;

    if (passedOrLandedPayday) {
      nextMessage += " Collected $300 for Payday.";
    }

    if (nextSpace.type === "events") {
      const card = eventsCards[Math.floor(Math.random() * eventsCards.length)];
      nextDrawnCard = card;
      nextMessage = `${activePlayer.name} drew ${card.title}.`;

      if (card.kind === "immediate") {
        if (card.effect.type === "cash") {
          const cashDelta =
            card.effect.amount !== 0
              ? card.effect.amount
              : card.title === "Sweepstakes Winner"
                ? nextRoll * 100
                : 0;

          if (cashDelta !== 0) {
            updatedPlayer.cash += cashDelta;
            nextMessage += cashDelta > 0 ? ` Collected $${cashDelta}.` : ` Paid $${Math.abs(cashDelta)}.`;
          }
        }

        if (card.effect.type === "move" && card.effect.targetSpaceId in board.spaces) {
          updatedPlayer.position = { ...updatedPlayer.position, spaceId: card.effect.targetSpaceId };
          resolvedSpace = board.spaces[card.effect.targetSpaceId];
          nextMessage += ` Moved to ${resolvedSpace.label}.`;

          if (resolvedSpace.type === "payday") {
            updatedPlayer.cash += 300;
            nextMessage += " Collected an additional $300 for Payday.";
          }
        }

        if (card.effect.type === "skip") {
          pendingSkipTurns = card.effect.turns;
          nextMessage += ` Lose next ${card.effect.turns} turn${card.effect.turns === 1 ? "" : "s"}.`;
        }
      }
    }

    if (resolvedSpace.type === "sale") {
      nextSaleActive = true;
      nextMessage = `${activePlayer.name} landed on Sale! The next purchase is 25% off.`;
    }

    if (resolvedSpace.type === "tag_sale") {
      nextTagSalePrice = nextRoll * 10;
      nextMessage = `${activePlayer.name} landed on Tag Sale! This turn's purchases cost $${nextTagSalePrice}.`;
    }

    setPlayers(nextPlayers);
    if (pendingSkipTurns > 0) {
      setSkipTurns((current) => ({
        ...current,
        [activePlayer.id]: (current[activePlayer.id] ?? 0) + pendingSkipTurns,
      }));
    }
    setRoll(nextRoll);
    setSaleActive(nextSaleActive);
    setTagSalePrice(nextTagSalePrice);
    setDrawnCard(nextDrawnCard);
    setMessage(nextMessage);
  };

  const handleEndTurn = () => {
    if (phase !== "playing") {
      return;
    }

    const nextSkipTurns = { ...skipTurns };
    const nextTurnIndex = (turnIndex + 1) % players.length;
    let resolvedTurnIndex = nextTurnIndex;
    const skippedPlayers: string[] = [];

    for (let checked = 0; checked < players.length; checked += 1) {
      const candidate = players[resolvedTurnIndex];
      const pendingSkips = nextSkipTurns[candidate.id] ?? 0;
      if (pendingSkips <= 0) {
        break;
      }

      nextSkipTurns[candidate.id] = pendingSkips - 1;
      skippedPlayers.push(candidate.name);
      resolvedTurnIndex = (resolvedTurnIndex + 1) % players.length;
    }

    Object.keys(nextSkipTurns).forEach((playerId) => {
      if ((nextSkipTurns[playerId] ?? 0) <= 0) {
        delete nextSkipTurns[playerId];
      }
    });

    setTurnIndex(resolvedTurnIndex);
    setSkipTurns(nextSkipTurns);
    setRoll(null);
    setSaleActive(false);
    setTagSalePrice(null);
    setDrawnCard(null);

    if (skippedPlayers.length > 0) {
      const skippedSummary = skippedPlayers.length === 1 ? skippedPlayers[0] : `${skippedPlayers.slice(0, -1).join(", ")} and ${skippedPlayers[skippedPlayers.length - 1]}`;
      setMessage(`Skipped ${skippedSummary}. It is now ${players[resolvedTurnIndex].name}'s turn.`);
      return;
    }

    setMessage(`It is now ${players[resolvedTurnIndex].name}'s turn.`);
  };

  const handlePurchase = (itemId: string) => {
    if (roll === null) {
      setMessage("Roll first before making a purchase.");
      return;
    }

    if (!currentStore) {
      setMessage("You can only purchase while on a store entrance.");
      return;
    }

    const player = players[turnIndex];
    if (!(itemId in currentStore.priceDeck[0].prices)) {
      setMessage("That item is not available in the current store lineup.");
      return;
    }

    const directShoppingItem = player.shoppingList.find((entry) => entry.itemId === itemId);
    const petSlot = findOpenPetSlot(player);
    const speciesBought = purchasedPetSpecies(player);
    const isPetPurchase = PET_ITEM_SET.has(itemId);

    if (directShoppingItem && directShoppingItem.purchased) {
      setMessage("That item is already purchased.");
      return;
    }

    if (!directShoppingItem) {
      if (!isPetPurchase || !petSlot || speciesBought.has(itemId)) {
        setMessage("That item is not currently needed on this shopping list.");
        return;
      }
    }

    const basePrice = currentStore.priceDeck[0].prices[itemId];
    const price = tagSalePrice ?? (saleActive ? Math.floor(basePrice * 0.75) : basePrice);

    if (player.cash < price) {
      setMessage(`Not enough cash for ${toDisplayName(itemId)}.`);
      return;
    }

    const nextPlayers = players.map((candidate, index) => {
      if (index !== turnIndex) {
        return candidate;
      }

      let usedPetSlot = false;
      const updatedShoppingList = candidate.shoppingList.map((entry) => {
        if (entry.itemId === itemId) {
          return { ...entry, purchased: true, pricePaid: price };
        }

        if (!usedPetSlot && entry.isPetSlot && !entry.purchased && PET_ITEM_SET.has(itemId)) {
          usedPetSlot = true;
          return {
            ...entry,
            purchased: true,
            petSpecies: itemId,
            name: `Pet: ${toDisplayName(itemId)}`,
            pricePaid: price,
          };
        }

        return entry;
      });

      return {
        ...candidate,
        cash: candidate.cash - price,
        shoppingList: updatedShoppingList,
      };
    });

    const updatedPlayer = nextPlayers[turnIndex];
    setPlayers(nextPlayers);

    const completed = updatedPlayer.shoppingList.every((entry) => entry.purchased);
    if (completed) {
      setPhase("finished");
      setMessage(`${updatedPlayer.name} completed the shopping list and wins!`);
      return;
    }

    setMessage(`${updatedPlayer.name} bought ${toDisplayName(itemId)} for $${price}.`);
  };

  const handleHoldCard = (card: Card) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) {
          return player;
        }

        return {
          ...player,
          holdableEvents: [...player.holdableEvents, card],
        };
      })
    );

    setDrawnCard(null);
    setMessage(`${activePlayer.name} held ${card.title} for later use.`);
  };

  const handleDiscardHeldCard = (cardId: string) => {
    const card = activePlayer.holdableEvents.find((entry) => entry.id === cardId);
    if (!card) {
      return;
    }

    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) {
          return player;
        }

        return {
          ...player,
          holdableEvents: player.holdableEvents.filter((entry) => entry.id !== cardId),
        };
      })
    );

    setMessage(`${activePlayer.name} discarded held card: ${card.title}.`);
  };

  const handleReset = () => {
    setPlayers(createInitialPlayers(["Alice", "Bob"]));
    setTurnIndex(0);
    setStores(createInitialStoreState());
    setPhase("playing");
    setRoll(null);
    setSaleActive(false);
    setTagSalePrice(null);
    setDrawnCard(null);
    setSkipTurns({});
    setMessage("A new game is ready. Roll the die to begin.");
  };

  const handleRotateStore = (storeId: string) => {
    if (!(currentSpace.type === "sale" || currentSpace.type === "tag_sale")) {
      setMessage("Store rotation is only available on Sale or Tag Sale spaces.");
      return;
    }

    setStores((currentStores) =>
      currentStores.map((store) => (store.id === storeId ? rotatePriceDeck(store) : store))
    );
    setMessage("The selected store deck rotated to the next price card.");
  };

  const purchaseCandidates = currentStore
    ? Object.entries(currentStore.priceDeck[0].prices).filter(([itemId]) =>
        activePlayer.shoppingList.some((entry) => entry.itemId === itemId && !entry.purchased) ||
        (PET_ITEM_SET.has(itemId) && Boolean(findOpenPetSlot(activePlayer)) && !purchasedPetSpecies(activePlayer).has(itemId))
      )
    : [];

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Phase 0 prototype</p>
          <h1>Bargain Hunter — Digital Edition</h1>
        </div>
        <CashDisplay cash={activePlayer.cash} />
      </header>

      <main className="game-layout">
        <section className="board-panel">
          <div className="panel-heading">
            <h2>Board</h2>
            <div className="status-pill">{phase === "playing" ? `${activePlayer.name}'s turn` : "Finished"}</div>
          </div>
          <BoardView board={board} players={players} activePlayerId={activePlayer.id} />
          <div className="controls">
            <button className="btn btn--primary" onClick={handleRoll} disabled={phase !== "playing" || roll !== null}>
              Roll die
            </button>
            <button className="btn btn--secondary" onClick={handleEndTurn} disabled={phase !== "playing"}>
              End turn
            </button>
            <button className="btn btn--ghost" onClick={handleReset}>
              New game
            </button>
          </div>
          <p className="message">{message}</p>
          {roll !== null && <p className="roll">Last roll: {roll}</p>}
        </section>

        <aside className="sidebar">
          <ShoppingListPanel items={activePlayer.shoppingList} loanBalance={activePlayer.loanBalance} cash={activePlayer.cash} />

          <section className="panel-card">
            <h2>Store actions</h2>
            {currentStore ? (
              <>
                <p className="store-label">{currentSpace.label}</p>
                {purchaseCandidates.length > 0 ? (
                  <div className="purchase-list">
                    {purchaseCandidates.map(([itemId]) => {
                      const shoppingItem = activePlayer.shoppingList.find((entry) => entry.itemId === itemId);
                      const price =
                        tagSalePrice ??
                        (saleActive
                          ? Math.floor(currentStore.priceDeck[0].prices[itemId] * 0.75)
                          : currentStore.priceDeck[0].prices[itemId]);

                      return (
                        <button key={itemId} className="purchase-row" onClick={() => handlePurchase(itemId)} disabled={roll === null || phase !== "playing"}>
                          <span>{shoppingItem?.name ?? toDisplayName(itemId)}</span>
                          <strong>${price}</strong>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="helper-text">Land on a store entrance to buy remaining checklist items.</p>
                )}
              </>
            ) : (
              <p className="helper-text">Move to a store entrance to start buying items.</p>
            )}
          </section>

          <section className="panel-card">
            <h2>Held event cards</h2>
            {activePlayer.holdableEvents.length > 0 ? (
              <div className="held-cards">
                {activePlayer.holdableEvents.map((card) => (
                  <div key={card.id} className="held-card-row">
                    <div>
                      <p className="held-card-title">{card.title}</p>
                      <p className="helper-text">{card.text}</p>
                    </div>
                    <button className="btn btn--ghost" onClick={() => handleDiscardHeldCard(card.id)}>
                      Discard
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">No held event cards yet.</p>
            )}
          </section>

          <section className="panel-card">
            <h2>Store prices</h2>
            <div className="store-grid">
              {stores.map((store) => (
                <PriceCardDisplay
                  key={store.id}
                  store={store}
                  highlightItems={activePlayer.shoppingList.filter((entry) => !entry.purchased).map((entry) => entry.itemId)}
                  canRotate={currentSpace.type === "sale" || currentSpace.type === "tag_sale"}
                  onRotate={handleRotateStore}
                />
              ))}
            </div>
          </section>
        </aside>
      </main>

      {drawnCard && (
        <CardDrawModal
          card={drawnCard}
          canHold={drawnCard.kind === "holdable"}
          onDismiss={() => setDrawnCard(null)}
          onHold={handleHoldCard}
        />
      )}
    </div>
  );
}

export default App;
