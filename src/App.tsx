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
import { bargainFinderCards } from "./data/bargain-finder-cards";
import { buildBoardGraph, createInitialPlayers, getMovementPath, getNextSpaceId } from "./js/phase0Prototype";
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
  const [message, setMessage] = useState("Spin the 1–8 spinner to begin the first turn.");
  const [storeEntryChoice, setStoreEntryChoice] = useState<string | null>(null); // storeId if offering choice
  const [creditCheckUsed, setCreditCheckUsed] = useState(false); // track if credit check was used this turn
  const [creditCheckModal, setCreditCheckModal] = useState<{ approved: boolean; amount: number } | null>(null);
  const [paydayModal, setPaydayModal] = useState<{ collected: number; interest: number; loanBalance: number } | null>(null);
  const [chooseStoreModal, setChooseStoreModal] = useState<boolean>(false); // "Go to any store space"
  const [storeOrEventsModal, setStoreOrEventsModal] = useState<{ storeId: string } | null>(null); // "Go back in store or draw Events"
  const [passDeviceScreen, setPassDeviceScreen] = useState<{ nextPlayerName: string } | null>(null); // Pass device between turns

  const activePlayer = players[turnIndex];
  const currentSpace = board.spaces[activePlayer.position.spaceId];
  
  // Determine current store based on position context or space storeId
  const currentStoreId = currentSpace.context !== "outer" 
    ? currentSpace.context 
    : (currentSpace.type === "store_entrance" && currentSpace.storeId ? currentSpace.storeId : null);
  const currentStore = currentStoreId ? stores.find((store) => store.id === currentStoreId) : undefined;

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
    const movementPath = getMovementPath(activePlayer.position.spaceId, nextRoll, board);
    const nextSpaceId = movementPath[movementPath.length - 1] ?? activePlayer.position.spaceId;
    const nextSpace = board.spaces[nextSpaceId];

    const nextPlayers = players.map((player) => ({ ...player }));
    const updatedPlayer = {
      ...nextPlayers[turnIndex],
      position: { 
        spaceId: nextSpaceId, 
        context: nextSpace.context || "outer" 
      },
    };

    const passedOrLandedPayday = movementPath.includes("0");
    if (passedOrLandedPayday) {
      const paydayAmount = 300;
      const interest = Math.floor(updatedPlayer.loanBalance * 0.1);
      
      updatedPlayer.cash += paydayAmount;
      if (interest > 0) {
        updatedPlayer.cash -= interest;
      }
      
      // Show payday modal for loan repayment if player has a loan
      if (updatedPlayer.loanBalance > 0) {
        setPaydayModal({
          collected: paydayAmount,
          interest,
          loanBalance: updatedPlayer.loanBalance,
        });
      }
    }

    // Process special space effects
    if (nextSpace.effect) {
      const { action, amount, perSpin, targetId } = nextSpace.effect;
      
      // Handle penalty/reward spaces (Restaurant, Auto Repairs, Lottery, etc.)
      if (amount !== undefined) {
        const charge = perSpin ? amount * nextRoll : amount;
        updatedPlayer.cash -= charge; // negative amount = gain money (e.g., Lottery)
      }
      
      // Handle forced movement spaces
      if (action === "move_to_space" && targetId !== undefined) {
        updatedPlayer.position = {
          spaceId: String(targetId),
          context: "outer",
        };
        const targetSpace = board.spaces[String(targetId)];
        if (targetSpace) {
          nextSpace = targetSpace; // Update nextSpace reference for further processing
        }
      }
      
      // Handle "Go to any store space" - show modal after roll
      if (action === "choose_store_space") {
        setChooseStoreModal(true);
      }
      
      // Handle "Go back in store or draw Events" - show modal after roll
      if (action === "store_or_events" && nextSpace.effect.storeId) {
        setStoreOrEventsModal({ storeId: nextSpace.effect.storeId });
      }
      
      // Handle "Take a Bargain Finder card"
      if (action === "draw_bargain_finder") {
        const card = bargainFinderCards[Math.floor(Math.random() * bargainFinderCards.length)];
        
        // Add card to player's hand (max 3)
        if (updatedPlayer.bargainFinderHand.length < 3) {
          updatedPlayer.bargainFinderHand = [...updatedPlayer.bargainFinderHand, card];
          nextDrawnCard = card;
        } else {
          // Hand is full, show message
          nextSpace = { ...nextSpace }; // Keep as-is
        }
      }
    }

    // Handle automatic store exit (return to outer ring)
    if (nextSpace.type === "store_exit" && nextSpace.outerExitId) {
      updatedPlayer.position = {
        spaceId: nextSpace.outerExitId,
        context: "outer",
      };
    }

    nextPlayers[turnIndex] = updatedPlayer;

    let nextMessage = `${activePlayer.name} spun ${nextRoll} and moved to ${nextSpace.label}.`;
    let nextSaleActive = false;
    let nextTagSalePrice: number | null = null;
    let nextDrawnCard: Card | null = null;
    let resolvedSpace = nextSpace;
    let pendingSkipTurns = 0;

    if (passedOrLandedPayday) {
      nextMessage += " Collected $300 for Payday.";
      const interest = Math.floor(updatedPlayer.loanBalance * 0.1);
      if (interest > 0) {
        nextMessage += ` Paid $${interest} interest (10%).`;
      }
    }

    // Add messages for special space effects
    if (nextSpace.effect) {
      const { action, amount, perSpin } = nextSpace.effect;
      
      if (amount !== undefined && amount !== 0) {
        const charge = perSpin ? amount * nextRoll : amount;
        if (charge > 0) {
          nextMessage += ` Paid $${charge}.`;
        } else if (charge < 0) {
          nextMessage += ` Won $${Math.abs(charge)}!`;
        }
      }
      
      if (action === "move_to_space") {
        const targetSpace = board.spaces[updatedPlayer.position.spaceId];
        if (targetSpace) {
          nextMessage += ` Moved to ${targetSpace.label}.`;
        }
      }
      
      if (action === "choose_store_space") {
        nextMessage += " Choose a store to warp to.";
      }
      
      if (action === "store_or_events") {
        nextMessage += " Choose: go back in store or draw Events?";
      }
      
      if (action === "draw_bargain_finder") {
        if (updatedPlayer.bargainFinderHand.length < 3) {
          nextMessage += " Drew a Bargain Finder card!";
        } else {
          nextMessage += " Bargain Finder hand is full (max 3).";
        }
      }
    }

    if (nextSpace.type === "events") {
      const card = eventsCards[Math.floor(Math.random() * eventsCards.length)];
      nextDrawnCard = card;
      nextMessage = `${activePlayer.name} drew ${card.title}.`;

      if (card.kind === "immediate") {
        if (card.effect.type === "cash") {
          let cashDelta = card.effect.amount;
          
          // Handle special cash effects
          if (card.title === "Sweepstakes Winner") {
            cashDelta = nextRoll * 100;
          } else if (card.title === "Rich Uncle" || card.title.includes("Rich uncle")) {
            // Pay off all credit debts
            const loanPaidOff = updatedPlayer.loanBalance;
            updatedPlayer.loanBalance = 0;
            updatedPlayer.inFinancialDisaster = false;
            if (loanPaidOff > 0) {
              nextMessage += ` Rich uncle paid off $${loanPaidOff} in credit debts!`;
            }
            cashDelta = 0; // Don't add cash, just clear loan
          }

          if (cashDelta !== 0) {
            updatedPlayer.cash += cashDelta;
            nextMessage += cashDelta > 0 ? ` Collected $${cashDelta}.` : ` Paid $${Math.abs(cashDelta)}.`;
          }
        }

        if (card.effect.type === "move") {
          const targetId = card.effect.targetSpaceId;
          
          // Handle special move targets
          if (targetId === "payday") {
            updatedPlayer.position = { spaceId: "0", context: "outer" };
            resolvedSpace = board.spaces["0"];
            nextMessage += ` Moved to PAYDAY!`;
            updatedPlayer.cash += 300;
            nextMessage += " Collected $300.";
          } else if (targetId === "tag_sale") {
            updatedPlayer.position = { spaceId: "39", context: "outer" };
            resolvedSpace = board.spaces["39"];
            nextMessage += ` Moved to TAG SALE!`;
          } else if (targetId in board.spaces) {
            updatedPlayer.position = { spaceId: targetId, context: board.spaces[targetId].context || "outer" };
            resolvedSpace = board.spaces[targetId];
            nextMessage += ` Moved to ${resolvedSpace.label}.`;
          } else {
            // Special opponent/multi-player effects - show note for pass-and-play
            if (targetId.includes("OPPONENT")) {
              nextMessage += " [Effect requires opponent selection - apply manually]";
            } else if (targetId.includes("ALL_IN_STORES")) {
              nextMessage += " [All players in stores move to Window Shopping - apply manually]";
            }
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

    // Offer store entry choice when landing on store entrance
    if (nextSpace.type === "store_entrance" && nextSpace.storeId) {
      const storeObj = stores.find(s => s.id === nextSpace.storeId);
      if (storeObj) {
        nextMessage = `${activePlayer.name} landed on ${storeObj.name}. Enter store or stay on outer ring?`;
        setStoreEntryChoice(nextSpace.storeId);
      }
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

    // Show pass device screen before switching to next player
    const nextPlayerName = players[resolvedTurnIndex].name;
    setPassDeviceScreen({ nextPlayerName });
    
    // Store the state to apply when "Ready" is clicked
    setSkipTurns(nextSkipTurns);
    setRoll(null);
    setSaleActive(false);
    setTagSalePrice(null);
    setDrawnCard(null);
    setCreditCheckUsed(false);
    
    if (skippedPlayers.length > 0) {
      const skippedSummary = skippedPlayers.length === 1 ? skippedPlayers[0] : `${skippedPlayers.slice(0, -1).join(", ")} and ${skippedPlayers[skippedPlayers.length - 1]}`;
      setMessage(`Skipped ${skippedSummary}. Pass device to ${nextPlayerName}.`);
    } else {
      setMessage(`Turn complete. Pass device to ${nextPlayerName}.`);
    }
    
    // Don't set turn index yet - wait for pass device confirmation
    // Store it for later
    sessionStorage.setItem('nextTurnIndex', String(resolvedTurnIndex));
  };

  const handlePassDeviceReady = () => {
    const nextTurnIndex = parseInt(sessionStorage.getItem('nextTurnIndex') || '0');
    setTurnIndex(nextTurnIndex);
    setPassDeviceScreen(null);
    setMessage(`It is now ${players[nextTurnIndex].name}'s turn. Spin to begin.`);
    sessionStorage.removeItem('nextTurnIndex');
  };

  const handlePlayMoveCard = (cardId: string) => {
    const card = activePlayer.bargainFinderHand.find(c => c.id === cardId);
    if (!card || card.kind !== "move") {
      setMessage("Invalid card or card is not a move card.");
      return;
    }

    // Only allow in stores
    if (currentSpace.context === "outer") {
      setMessage("Move cards can only be played while inside a store.");
      return;
    }

    if (roll !== null) {
      setMessage("You already moved this turn. End turn when ready.");
      return;
    }

    // Parse the movement from targetSpaceId
    const target = card.effect.targetSpaceId;
    let spaces = 0;
    
    if (target.includes("FORWARD_1")) spaces = 1;
    else if (target.includes("FORWARD_2")) spaces = 2;
    else if (target.includes("FORWARD_3")) spaces = 3;
    else if (target.includes("BACK_1")) spaces = -1;
    else if (target.includes("BACK_2")) spaces = -2;
    else if (target.includes("BACK_3")) spaces = -3;
    
    if (spaces === 0) {
      setMessage("Invalid movement card.");
      return;
    }

    // Negative movement means go backwards (opposite direction in store)
    const absSpaces = Math.abs(spaces);
    let currentId = activePlayer.position.spaceId;
    
    // For backwards movement in stores, we need to traverse in reverse
    if (spaces < 0) {
      // Find the previous space by searching the board
      for (let step = 0; step < absSpaces; step++) {
        const allStoreSpaces = Object.values(board.spaces).filter(s => s.context === currentSpace.context);
        const currentIdx = allStoreSpaces.findIndex(s => s.id === currentId);
        if (currentIdx === -1) break;
        
        // Go to previous space (counter-clockwise movement in reverse = clockwise)
        const prevIdx = (currentIdx - 1 + allStoreSpaces.length) % allStoreSpaces.length;
        currentId = allStoreSpaces[prevIdx].id;
      }
    } else {
      // Forward movement (counter-clockwise in store)
      const movementPath = getMovementPath(currentId, absSpaces, board);
      currentId = movementPath[movementPath.length - 1] || currentId;
    }

    const nextSpace = board.spaces[currentId];
    
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) return player;
        
        return {
          ...player,
          position: {
            spaceId: currentId,
            context: nextSpace.context || currentSpace.context,
          },
          bargainFinderHand: player.bargainFinderHand.filter(c => c.id !== cardId),
        };
      })
    );

    setRoll(absSpaces); // Set roll to indicate movement happened
    setMessage(`${activePlayer.name} played "${card.title}" and moved to ${nextSpace.label}.`);
  };

  const handlePurchase = (itemId: string, discountCardId?: string) => {
    if (roll === null) {
      setMessage("Roll first before making a purchase.");
      return;
    }

    if (!currentStore) {
      setMessage("You can only purchase while at a store or inside a store.");
      return;
    }

    // Check if we're on an item space that restricts purchase to a specific item
    if (currentSpace.type === "item" && currentSpace.itemId && currentSpace.itemId !== itemId) {
      setMessage(`This space only sells ${toDisplayName(currentSpace.itemId)}.`);
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
    let price = tagSalePrice ?? (saleActive ? Math.floor(basePrice * 0.75) : basePrice);
    
    // Apply discount card if provided
    let discountAmount = 0;
    let discountCard: Card | undefined;
    if (discountCardId) {
      discountCard = player.bargainFinderHand.find(c => c.id === discountCardId && c.kind === "discount");
      if (discountCard && discountCard.effect.type === "discount") {
        discountAmount = discountCard.effect.amount;
        price = Math.max(0, price - discountAmount); // Can't go below $0
      }
    }

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
        // Remove discount card if used
        bargainFinderHand: discountCardId 
          ? candidate.bargainFinderHand.filter(c => c.id !== discountCardId)
          : candidate.bargainFinderHand,
      };
    });

    const updatedPlayer = nextPlayers[turnIndex];
    setPlayers(nextPlayers);

    const completed = updatedPlayer.shoppingList.every((entry) => entry.purchased);
    const loanPaidOff = updatedPlayer.loanBalance === 0;
    
    if (completed && loanPaidOff) {
      setPhase("finished");
      setMessage(`${updatedPlayer.name} completed the shopping list and paid off all debts. ${updatedPlayer.name} wins!`);
      return;
    } else if (completed && !loanPaidOff) {
      setMessage(`${updatedPlayer.name} bought ${toDisplayName(itemId)} for $${price}${discountAmount > 0 ? ` (saved $${discountAmount})` : ""}. Shopping list complete! Pay off loan to win.`);
      return;
    }

    setMessage(`${updatedPlayer.name} bought ${toDisplayName(itemId)} for $${price}${discountAmount > 0 ? ` (saved $${discountAmount})` : ""}.`);
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
    setMessage("A new game is ready. Spin the 1–8 spinner to begin.");
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

  const handleEnterStore = () => {
    if (!storeEntryChoice) return;

    const currentPos = activePlayer.position.spaceId;
    const entranceSpace = board.spaces[currentPos];
    
    if (entranceSpace.type === "store_entrance" && entranceSpace.storeEntryId) {
      setPlayers((currentPlayers) =>
        currentPlayers.map((player, index) => {
          if (index !== turnIndex) return player;
          return {
            ...player,
            position: {
              spaceId: entranceSpace.storeEntryId!,
              context: storeEntryChoice as any,
            },
          };
        })
      );
      
      const storeObj = stores.find(s => s.id === storeEntryChoice);
      setMessage(`${activePlayer.name} entered ${storeObj?.name}. Move through the store to shop.`);
    }
    
    setStoreEntryChoice(null);
  };

  const handleStayOnRing = () => {
    setStoreEntryChoice(null);
    setMessage(`${activePlayer.name} stayed on the outer ring.`);
  };

  const handleCreditCheck = () => {
    if (creditCheckUsed) {
      setMessage("Credit check already used this turn.");
      return;
    }

    const maxBorrow = 1000 - activePlayer.loanBalance;
    if (maxBorrow <= 0) {
      setMessage("Credit limit reached ($1,000). Cannot borrow more.");
      return;
    }

    // 25% (1-in-4) approval odds
    const approved = Math.random() < 0.25;
    
    setCreditCheckUsed(true);
    setCreditCheckModal({ approved, amount: maxBorrow });
  };

  const handleBorrow = (amount: number) => {
    if (!creditCheckModal?.approved) return;

    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) return player;
        
        const newLoanBalance = player.loanBalance + amount;
        const inFinancialDisaster = newLoanBalance > 1000;
        
        return {
          ...player,
          cash: player.cash + amount,
          loanBalance: newLoanBalance,
          inFinancialDisaster,
        };
      })
    );

    const newBalance = activePlayer.loanBalance + amount;
    if (newBalance > 1000) {
      setMessage(`${activePlayer.name} borrowed $${amount}. FINANCIAL DISASTER! An opponent holds your list until debt below $1,000.`);
    } else {
      setMessage(`${activePlayer.name} borrowed $${amount}. Loan balance: $${newBalance}.`);
    }

    setCreditCheckModal(null);
  };

  const handleRepayLoan = (amount: number) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) return player;
        
        const repayment = Math.min(amount, player.loanBalance, player.cash);
        const newLoanBalance = player.loanBalance - repayment;
        const inFinancialDisaster = newLoanBalance > 1000;
        
        return {
          ...player,
          cash: player.cash - repayment,
          loanBalance: newLoanBalance,
          inFinancialDisaster,
        };
      })
    );

    const repayment = Math.min(amount, activePlayer.loanBalance, activePlayer.cash);
    setMessage(`${activePlayer.name} repaid $${repayment}. Remaining loan: $${activePlayer.loanBalance - repayment}.`);
    setPaydayModal(null);
  };

  const handleChooseStoreSpace = (storeId: string) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) => {
        if (index !== turnIndex) return player;
        
        // Find the store entrance space on the outer ring
        const entranceSpace = Object.values(board.spaces).find(
          (s) => s.type === "store_entrance" && s.storeId === storeId
        );
        
        if (!entranceSpace) return player;
        
        return {
          ...player,
          position: {
            spaceId: entranceSpace.id,
            context: "outer",
          },
        };
      })
    );

    const store = stores.find(s => s.id === storeId);
    setMessage(`${activePlayer.name} warped to ${store?.name || "a store"}.`);
    setChooseStoreModal(false);
  };

  const handleGoBackInStore = (storeId: string) => {
    // Player chooses to enter the store at any internal space
    setMessage(`${activePlayer.name} chose to go back in the store. Choose a space to enter.`);
    // For now, just place them at the entrance - full implementation would show space picker
    const entranceSpace = Object.values(board.spaces).find(
      (s) => s.type === "store_entrance" && s.storeId === storeId
    );
    if (entranceSpace && entranceSpace.storeEntryId) {
      setPlayers((currentPlayers) =>
        currentPlayers.map((player, index) => {
          if (index !== turnIndex) return player;
          return {
            ...player,
            position: {
              spaceId: entranceSpace.storeEntryId!,
              context: storeId as any,
            },
          };
        })
      );
    }
    setStoreOrEventsModal(null);
  };

  const handleDrawEventsInstead = () => {
    // Player chose to draw Events instead of going back in store
    const card = eventsCards[Math.floor(Math.random() * eventsCards.length)];
    setDrawnCard(card);
    setMessage(`${activePlayer.name} drew ${card.title} instead of going back in the store.`);
    setStoreOrEventsModal(null);
    
    // Process immediate card effects
    if (card.kind === "immediate") {
      setPlayers((currentPlayers) =>
        currentPlayers.map((player, index) => {
          if (index !== turnIndex) return player;
          
          const updatedPlayer = { ...player };
          
          if (card.effect.type === "cash") {
            const cashDelta = card.effect.amount !== 0 ? card.effect.amount : 0;
            updatedPlayer.cash += cashDelta;
          }
          
          if (card.effect.type === "move" && card.effect.targetSpaceId in board.spaces) {
            updatedPlayer.position = { 
              spaceId: card.effect.targetSpaceId,
              context: board.spaces[card.effect.targetSpaceId].context || "outer"
            };
          }
          
          return updatedPlayer;
        })
      );
    }
  };

  const purchaseCandidates = currentStore
    ? (() => {
        // On an item space, show only that specific item
        if (currentSpace.type === "item" && currentSpace.itemId) {
          const itemId = currentSpace.itemId;
          const onList = activePlayer.shoppingList.some((entry) => entry.itemId === itemId && !entry.purchased);
          const isPet = PET_ITEM_SET.has(itemId);
          const canBuyPet = isPet && Boolean(findOpenPetSlot(activePlayer)) && !purchasedPetSpecies(activePlayer).has(itemId);
          
          if (onList || canBuyPet) {
            return [[itemId, currentStore.priceDeck[0].prices[itemId] || 0]];
          }
          return [];
        }
        
        // On "your_choice" space, show all pet species available
        if (currentSpace.type === "your_choice") {
          const petSlot = findOpenPetSlot(activePlayer);
          const boughtSpecies = purchasedPetSpecies(activePlayer);
          if (!petSlot) return [];
          
          return Object.entries(currentStore.priceDeck[0].prices).filter(([itemId]) => 
            PET_ITEM_SET.has(itemId) && !boughtSpecies.has(itemId)
          );
        }
        
        // On store entrance or other spaces, show all items on shopping list
        return Object.entries(currentStore.priceDeck[0].prices).filter(([itemId]) =>
          activePlayer.shoppingList.some((entry) => entry.itemId === itemId && !entry.purchased) ||
          (PET_ITEM_SET.has(itemId) && Boolean(findOpenPetSlot(activePlayer)) && !purchasedPetSpecies(activePlayer).has(itemId))
        );
      })()
    : [];

  return (
    <div className="app-shell">
      {/* Pass device screen - covers everything */}
      {passDeviceScreen && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: "blur(20px)", backgroundColor: "rgba(0,0,0,0.95)" }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", maxWidth: "500px" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>🎮 Pass Device</h2>
            <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
              Please pass the device to <strong>{passDeviceScreen.nextPlayerName}</strong>
            </p>
            <p style={{ color: "#888", marginBottom: "2rem" }}>
              Make sure they can't see the current screen before passing.
            </p>
            <button 
              className="btn btn--primary" 
              style={{ fontSize: "1.25rem", padding: "1rem 2rem" }}
              onClick={handlePassDeviceReady}
            >
              Ready to Play
            </button>
          </div>
        </div>
      )}

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
              Spin spinner
            </button>
            <button className="btn btn--secondary" onClick={handleEndTurn} disabled={phase !== "playing"}>
              End turn
            </button>
            <button 
              className="btn btn--ghost" 
              onClick={handleCreditCheck} 
              disabled={phase !== "playing" || creditCheckUsed || activePlayer.loanBalance >= 1000}
            >
              Run Credit Check
            </button>
            <button className="btn btn--ghost" onClick={handleReset}>
              New game
            </button>
          </div>
          <div className="spinner-widget" aria-label="Spinner display">
            <span className="spinner-widget__label">Spinner</span>
            <strong>{roll ?? "—"}</strong>
          </div>
          <p className="message">{message}</p>
          {roll !== null && <p className="roll">Last spin: {roll}</p>}
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
                      const basePrice = currentStore.priceDeck[0].prices[itemId];
                      const price =
                        tagSalePrice ??
                        (saleActive
                          ? Math.floor(basePrice * 0.75)
                          : basePrice);
                      
                      const discountCards = activePlayer.bargainFinderHand.filter(c => c.kind === "discount");

                      return (
                        <div key={itemId} className="purchase-item-group">
                          <button className="purchase-row" onClick={() => handlePurchase(itemId)} disabled={roll === null || phase !== "playing"}>
                            <span>{shoppingItem?.name ?? toDisplayName(itemId)}</span>
                            <strong>${price}</strong>
                          </button>
                          {discountCards.length > 0 && (
                            <div className="discount-options" style={{ marginLeft: "1rem", marginTop: "0.25rem" }}>
                              {discountCards.map(card => {
                                const discountAmount = card.effect.type === "discount" ? card.effect.amount : 0;
                                const finalPrice = Math.max(0, price - discountAmount);
                                return (
                                  <button 
                                    key={card.id}
                                    className="btn btn--xs btn--ghost"
                                    onClick={() => handlePurchase(itemId, card.id)}
                                    disabled={roll === null || phase !== "playing"}
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                                  >
                                    Apply {card.title} → ${finalPrice}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
            <h2>Bargain Finder Cards</h2>
            {activePlayer.bargainFinderHand.length > 0 ? (
              <div className="held-cards">
                {activePlayer.bargainFinderHand.map((card) => (
                  <div key={card.id} className="held-card-row">
                    <div>
                      <p className="held-card-title">{card.title}</p>
                      <p className="held-card-text">{card.text}</p>
                    </div>
                    {card.kind === "move" && (
                      <button
                        className="btn btn--ghost btn--xs"
                        onClick={() => handlePlayMoveCard(card.id)}
                        disabled={roll !== null || currentSpace.context === "outer"}
                      >
                        Play
                      </button>
                    )}
                    {card.kind === "discount" && (
                      <span className="held-card-badge">Use at Purchase</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">Land on "Take a Bargain Finder card" spaces to collect cards (max 3).</p>
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

      {storeEntryChoice && (
        <div className="modal-overlay" onClick={() => setStoreEntryChoice(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Store?</h2>
            <p>You landed on {stores.find(s => s.id === storeEntryChoice)?.name}.</p>
            <p>Enter the store to shop for items, or stay on the outer ring.</p>
            <div className="modal-actions">
              <button className="btn btn--primary" onClick={handleEnterStore}>
                Enter Store
              </button>
              <button className="btn btn--secondary" onClick={handleStayOnRing}>
                Stay on Ring
              </button>
            </div>
          </div>
        </div>
      )}

      {creditCheckModal && (
        <div className="modal-overlay" onClick={() => setCreditCheckModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Credit Check Result</h2>
            {creditCheckModal.approved ? (
              <>
                <p className="success-message">✅ APPROVED! You may borrow up to ${creditCheckModal.amount}.</p>
                <p>Choose an amount to borrow (in $100 increments):</p>
                <div className="modal-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                  {Array.from({ length: Math.min(10, Math.floor(creditCheckModal.amount / 100)) }, (_, i) => {
                    const amt = (i + 1) * 100;
                    return (
                      <button key={amt} className="btn btn--primary" onClick={() => handleBorrow(amt)}>
                        Borrow ${amt}
                      </button>
                    );
                  })}
                  <button className="btn btn--ghost" onClick={() => setCreditCheckModal(null)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="error-message">❌ DENIED. Credit check failed.</p>
                <p>Better luck next turn!</p>
                <div className="modal-actions">
                  <button className="btn btn--primary" onClick={() => setCreditCheckModal(null)}>
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {paydayModal && (
        <div className="modal-overlay" onClick={() => setPaydayModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>💰 Payday!</h2>
            <p>Collected: <strong>${paydayModal.collected}</strong></p>
            {paydayModal.interest > 0 && (
              <p>Interest paid (10%): <strong className="error-message">-${paydayModal.interest}</strong></p>
            )}
            <p>Current loan balance: <strong>${paydayModal.loanBalance}</strong></p>
            <p>Would you like to repay part of your loan? (in $100 increments)</p>
            <div className="modal-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              {Array.from({ length: Math.min(10, Math.floor(Math.min(activePlayer.cash, paydayModal.loanBalance) / 100)) }, (_, i) => {
                const amt = (i + 1) * 100;
                return (
                  <button key={amt} className="btn btn--primary" onClick={() => handleRepayLoan(amt)}>
                    Repay ${amt}
                  </button>
                );
              })}
              <button className="btn btn--ghost" onClick={() => setPaydayModal(null)}>
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {chooseStoreModal && (
        <div className="modal-overlay" onClick={() => setChooseStoreModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Go to Any Store</h2>
            <p>Choose which store entrance to warp to:</p>
            <div className="modal-actions" style={{ flexDirection: "column", gap: "0.5rem" }}>
              {stores.map((store) => (
                <button 
                  key={store.id} 
                  className="btn btn--primary" 
                  onClick={() => handleChooseStoreSpace(store.id)}
                >
                  {store.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {storeOrEventsModal && (
        <div className="modal-overlay" onClick={() => setStoreOrEventsModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Choose Action</h2>
            <p>Go back to {stores.find(s => s.id === storeOrEventsModal.storeId)?.name} or draw an Events card?</p>
            <div className="modal-actions">
              <button 
                className="btn btn--primary" 
                onClick={() => handleGoBackInStore(storeOrEventsModal.storeId)}
              >
                Go Back in Store
              </button>
              <button 
                className="btn btn--secondary" 
                onClick={handleDrawEventsInstead}
              >
                Draw Events Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
