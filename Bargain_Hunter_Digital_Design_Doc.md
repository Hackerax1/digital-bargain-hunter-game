# Bargain Hunter — Digital Web Adaptation
### Design Document (v1.1)

## 1. Summary

A browser-based reimagining of the 1981 Milton Bradley shopping game **Bargain Hunter** for 2–4 players. Players race their pawn around a board, shop at five stores for items on a checklist, hunt for the lowest ("bargain") prices, and use a line of credit to stay afloat — the first to complete their list while owing nothing wins. This doc covers gameplay-to-digital mapping, system architecture, data model, UI, and an open-questions/roadmap section.

## 2. How the Original Game Works (condensed)

- **Setup:** each player starts with $1,000 cash, a 19-item shopping list (17 general items + 2 distinct pets), and a credit card with a $1,000 limit.
- **Board:** an outer loop (Payday/start, an Events corner, red "penalty" spaces, a Bargain-Finder-card space, a Tag Sale space, and five store Entrances) plus five short inner loops — one per store — each ending in an Exit space.
- **Turn:** spin, move, then optionally act on the landed space. Outer-loop movement is clockwise; once inside a store, movement is counter-clockwise along that store's item spaces.
- **Shopping:** each store has a stack of 4 face-up "price cards"; only the top card's prices are active. Some item spaces are marked as bargain (darker) spaces — same item, lower price. "Sale!" spaces let a player cycle any store's top price card to the next one in the stack.
- **Cards:** 17 Bargain-Finder cards (movement shortcuts and discounts, max 3 held) and 17 Events cards (mostly immediate effects; 3 specific ones can be held and played later).
- **Money:** red penalty spaces cost spin-result × $10 (× $50 for Auto Repairs). Payday pays $300, then charges 10% interest on any loan, then optionally lets you repay it. A credit-card "machine" lets you borrow in $100 increments up to your limit; if borrowing pushes you over $1,000, you enter **Financial Disaster** (an opponent holds your list until the overage is repaid).
- **Win:** first player to buy all 19 items (no duplicates; pets must be two different animals) with a $0 loan balance wins.

## 3. Goals & Non-Goals

**Goals**
- Faithfully digitize the rules above so the game plays the same, just without physical pieces.
- Support **synchronous online multiplayer via invite codes** and **local pass-and-play**, with **vs. CPU** in phase 2.
- Make the fiddly physical bookkeeping (making change, sorting cards, tracking the shopping list) automatic and error-proof.
- Responsive web app — playable on desktop and phone.
- Data-driven content (stores, items, prices, cards) so the board/economy can be rebalanced or reskinned without code changes.

**Non-goals (v1)**
- Real-money purchases or ads.
- Native mobile apps (a PWA wrapper can come later).
- Voice/video chat — text chat/emotes only.
- Asynchronous ("take your turn whenever") play — out of scope; see §9.

## 4. IP Note (read before building)

Bargain Hunter is a copyrighted Milton Bradley (now Hasbro) property. A public or commercial release would need rights clearance. If that isn't in scope, the mechanics described here can be kept while the board name, box art, and specific item/card flavor text are replaced with original content. Worth deciding this early since it affects the content pipeline and branding — flagged again in Open Questions.

## 5. Physical → Digital Component Mapping

| Physical component | Digital equivalent |
|---|---|
| Gameboard | SVG/Canvas board component, fixed aspect ratio, pan/zoom on mobile |
| Spinner | Server-rolled RNG, uniform **1–8**, with an animated dial for feedback |
| Pawns | Animated tokens that step space-by-space along the path |
| 5 stacks of 4 price cards | Per-store `PriceDeck`; only the top entry is "active"; a Sale action rotates the top card to the back |
| Bargain-Finder cards (17) | Server-held draw pile; per-player hand cap of 3; cards tagged `move` or `discount` |
| Events cards (17) | Server-held draw pile; `immediate` cards auto-resolve, `holdable` cards go to a private hand |
| Credit card machine | A single "Run Credit Check" action; server rolls **25% (1-in-4) approval**, independent of amount requested; approve/deny animation |
| Paper money / banker role | Server-tracked ledger per player, rendered as bill denominations (see §11) — no human banker needed |
| Shopping list sheet | Persistent checklist UI: purchased items, pet slots, loan balance, running interest paid |

## 6. Board & Movement Model

Represent the board as a graph, not a flat array, since direction flips inside stores:

- **Outer ring:** a cycle of nodes traversed clockwise. Includes Payday, Events corner, red penalty spaces, Window Shopping spaces, Sale spaces, Tag Sale, Bargain-Finder draw space, and one Entrance node per store.
- **Store branch:** each Entrance node is also the head of a short counter-clockwise chain of item spaces ending in one Exit node.
- A pawn sitting on an Entrance node can, on a later turn, choose to spend its spin moving into the store chain instead of continuing on the outer ring.
- Landing on/passing the Exit node returns the pawn to the outer ring at that store's Entrance position, resuming clockwise movement next turn.
- Movement is animated tile-by-tile (not a jump-cut) so intermediate effects — passing Payday, passing an opponent — read clearly.

## 7. Turn State Machine

```
1. TurnStart          — active player notified; others see a "waiting" state
2. PlayerAction        — player may: Spin & Move, or Run Credit Check (once per turn), or play a holdable Bargain-Finder/Events card if legal in this context
3. Movement            — server rolls 1–8, resolves path (outer or in-store), animates
4. SpaceResolution      — modal/prompt as needed:
     - Item space  → optional purchase (price pulled from store's active PriceDeck)
     - Red penalty  → auto-charge spin × multiplier
     - Sale space   → optional: rotate any subset of stores' top price cards
     - Bargain-Finder space → draw card (discard oldest-of-3 if over cap)
     - Events corner / Exit choice → draw card, resolve or hold
     - Tag Sale     → spin × $10 flat price for one listed item of choice
5. PaydayCheck          — if Payday was landed on OR passed during movement: pay $300, charge 10% interest on loan, offer optional repay
6. WinCheck             — 19/19 items + $0 loan → game over
7. TurnEnd              — advance to next player (clockwise turn order)
```

## 8. Data Model (sketch)

```ts
interface Player {
  id: string;
  name: string;
  pawnColor: string;
  cash: number;                 // source of truth is a single integer; see §11 for how it's displayed
  loanBalance: number;          // 0..1000, or >1000 during Financial Disaster
  inFinancialDisaster: boolean;
  shoppingList: ShoppingItem[]; // 17 goods + 2 pet slots
  bargainFinderHand: Card[];   // max length 3
  holdableEvents: Card[];      // unlimited
  position: { spaceId: string; context: "outer" | StoreId };
}

interface ShoppingItem {
  itemId: string;
  purchased: boolean;
  pricePaid?: number;
  isPetSlot?: boolean;
  petSpecies?: string;         // enforced distinct across the two pet slots
}

interface Store {
  id: string;
  name: string;
  colorGroup: "deptA" | "deptB" | "furnA" | "furnB" | "pets";
  priceDeck: PriceCard[];      // length 4, index 0 = active
}

interface PriceCard {
  prices: Record<string /*itemId*/, number>;
}

interface Card {
  id: string;
  deck: "bargainFinder" | "events";
  kind: "move" | "discount" | "immediate" | "holdable";
  text: string;
  effect: CardEffect;          // discriminated union per kind
}

interface GameState {
  players: Player[];
  board: BoardGraph;
  stores: Store[];
  bargainFinderDeck: Card[];
  eventsDeck: Card[];
  turnIndex: number;
  phase: "lobby" | "playing" | "finished";
  rngSeed: string;             // for replay/audit
}
```

## 9. Backend & Networking

- **Synchronous play only:** all seated players are connected in the same live session; no async "take your turn whenever" mode in v1.
- **Invite codes:** host creates a room and gets a short shareable code (and/or link); other players join by entering it. Supports 2–4 seats; optional CPU fill-in for missing seats in phase 2.
- **Authoritative server** (Node.js) owns all randomness (spins, card draws, credit checks) so no client can manipulate outcomes.
- **WebSocket** channel (Socket.IO or plain WS) per game room for real-time turn sync.
- **Persistence:** Redis or Postgres keyed by room code, so a dropped connection can rejoin the same live session (reconnect, not resume-later).
- Since the game is synchronous, a disconnected player should be clearly flagged to the table (e.g., "waiting for Alex to reconnect") rather than silently skipped.

## 10. Frontend

- **React** with the board rendered in SVG (crisp at any zoom) or a lightweight canvas library if animation load gets heavy.
- Suggested components: `BoardView`, `PawnToken`, `StoreModal`, `PriceCardDisplay`, `ShoppingListPanel`, `CardDrawModal`, `CreditCheckWidget`, `CashDisplay`, `TurnIndicator`, `SpinnerWidget`.
- Client state hydrated from server-pushed events (avoid client-side game-state authority entirely).
- Mobile layout: board pans/zooms; shopping list and cash display collapse into drawers/tabs.

## 11. Cash Display (bills, not just a number)

Rather than showing a player's cash as a bare number, render it as their actual bill breakdown — matching the original's denominations: **$500, $100, $50, $20, $10, $5**.

- `cash` in `GameState` stays a single integer (source of truth for all payment/interest/change math — no need to track individual bill inventory or "the bank runs out of $5s").
- The `CashDisplay` component derives a bill breakdown purely for presentation, via a greedy largest-first split, e.g.:

```ts
const DENOMINATIONS = [500, 100, 50, 20, 10, 5] as const;

function toBillBreakdown(total: number): Record<number, number> {
  let remaining = total;
  const breakdown: Record<number, number> = {};
  for (const bill of DENOMINATIONS) {
    breakdown[bill] = Math.floor(remaining / bill);
    remaining %= bill;
  }
  // any remainder below $5 (e.g. from a discount card) can be shown as a small "loose change" chip
  return breakdown;
}
```

- UI shows a row/stack of bill icons grouped by denomination (e.g., "1×$500  1×$100  1×$50") with the **total dollar amount displayed prominently alongside**, not instead of.
- Bill counts animate up/down on payment and payday so a purchase visually reads as "bills leaving the stack," reinforcing the original's tactile feel.
- Same treatment applies to the bank/interest-due modals so a payment amount is always legible both as bills and as a total.

## 12. Visual Direction

- Nod to the original's bold, primary-color, early-80s look, modernized with flat design and clear iconography.
- Bargain vs. regular item spaces need a non-color-dependent cue (icon/pattern), not just a shade of brown — see accessibility note below.
- A short "flip" animation when a Sale space cycles a price card; a small vending-machine-style animation for the credit check, as a wink to the original toy.

## 13. Digital-Only Enhancements (phase 2+)

- CPU opponents with simple heuristics (prefer bargain spaces, avoid unnecessary borrowing) for solo play.
- Turn timer with auto-skip for inactive players online.
- Activity/game log ("Alex bought a Toaster for $40 — a bargain!").
- Post-game stats (money spent, bargains found, biggest loan carried).
- Undo — likely solo/practice-mode only, since undo conflicts with fairness once real opponents are involved.
- Accessibility: colorblind-safe palette + icon/pattern redundancy for bargain and penalty spaces, full keyboard navigation, screen-reader labels on all board spaces and modals.

## 14. Open Questions / Data Gaps

- **Exact board & card content:** the rulebook doesn't include the actual 19-item catalog, per-store prices, or full inner-loop lengths — those live on the physical price/item cards, not the rules text. This needs either transcription from the physical cards or original content if reskinning.
- **v1 scope:** consider shipping pass-and-play only first to validate the rules engine before investing in real-time networking.

## 15. Phased Roadmap

- **Phase 0:** local pass-and-play prototype in a single browser tab; full rules engine; no accounts or backend.
- **Phase 1:** online synchronous multiplayer — invite-code rooms, WebSocket sync, reconnect handling.
- **Phase 2:** CPU opponents, stats, animation/art polish, accessibility pass.
- **Phase 3 (optional):** installable PWA, licensing/branding decisions, monetization if applicable.
