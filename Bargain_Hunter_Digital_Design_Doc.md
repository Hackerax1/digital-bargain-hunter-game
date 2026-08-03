# Bargain Hunter — Digital Web Adaptation
### Design Document (v3)

## 1. Summary

A browser-based reimagining of the 1981 Milton Bradley shopping game **Bargain Hunter** for 2–4 players. Players race their pawn around a 40-space board, shop at five stores for items on a checklist, hunt for the lowest ("bargain") prices, and use a line of credit to stay afloat — the first to complete their list while owing nothing wins.

This version is backed by the actual game content: the full 40-space board text, all 17 Bargain-Finder cards, all 17 Events cards, and all five stores' price cards/item lists, plus a photo of the physical board used to confirm the physical layout. Full transcriptions live in the Appendices (§17).

**v3 changes:** all four previously-open rules questions are now resolved — see §6, §7, §15, and §16. The Pet Shop's item order is filled in at §17-B.

## 2. How the Original Game Works (confirmed from source material)

- **Setup:** each player starts with $1,000 cash, a 19-item shopping list (17 general items + 2 pet slots), and a credit card with a $1,000 limit.
- **The 19-item list breaks down as:**
  - **7 furniture items** (Armchair, Bed, Clock, Dresser, Kitchen Set, Lamp, Sofa) — sold at *both* Furniture Store Green and Furniture Store Blue, at different (and independently rotating) prices.
  - **10 department items** (Blender, Clothes Dryer, Dishwasher, Iron, Radio, Refrigerator, Stove, Television, Toaster, Washing Machine) — sold at *both* Department Store Purple and Department Store Olive, same logic.
  - **2 pet slots**, filled with two *different* species chosen from 6 options (Cat, Dog, Exotic Fish, Lizard, Parrot, Rabbit) — sold only at the single Pet Shop (Yellow).
  - **This is the core bargain-hunting loop:** the two furniture stores sell the identical 7-item catalog, and the two department stores sell the identical 10-item catalog — so the actual strategic decision is comparing the same item's price across its paired store before buying, not searching for unique inventory. See §17-B for exact prices.
- **Board:** a 40-space outer ring, laid out as a rotationally-symmetric "pinwheel" — see §12 for the photo cross-reference. One corner is **Payday**; the other three corners are **Events**. Each of the 5 stores has an **Entrance** space on the outer ring; a few spaces further along that same ring sits that store's **"Go back to any space in the [store] or draw an Events card"** Exit space, which is also the terminal node of that store's own internal item track. Confirmed: shopping through a store's full item chain pops the pawn back onto the outer ring at the Exit's position, skipping whatever outer-ring spaces sit between Entrance and Exit — see §6.
- **Turn:** spin (1–8), move, then optionally act on the landed space. Outer-ring movement is clockwise; once inside a store's item track, movement is counter-clockwise back toward the exit.
- **Shopping:** each store has 4 rotating price cards; only the top card's prices are active. A **SALE!** space (both on the outer ring and, for the two department stores, inside their own item track) lets a player cycle any store's top price card to the next one in the stack.
- **Cards:**
  - **17 Bargain-Finder cards** (max 3 held): 12 movement cards ("Go ahead/back N spaces instead of spinning" — usable only while inside a store) and 5 discount cards ("$X off any item," played at the moment of purchase). Full list in §17-C.
  - **17 Events cards**: 14 immediate-effect cards and 3 holdable cards (2× "free Auto Repairs," 1× "cancel an opponent's Payday" — save, use once, discard). Full list in §17-D.
- **Money:** penalty spaces charge spin-result × a multiplier — Restaurant and Doctor's Office are ×$10, Auto Repairs is ×$50, Charity Give is ×spinner, Gift Shop is ×$10. Tag Sale lets a player buy any one listed item for a flat spin×$10. Payday pays out, then charges 10% interest on any loan (also independently triggered by the "INTEREST DUE!" Events card, which charges every indebted player at once), then optionally lets the player repay. A credit-card machine lets a player borrow in $100 increments up to their $1,000 limit at **25% (1-in-4) approval odds**; borrowing past $1,000 triggers **Financial Disaster** (an opponent holds the player's list until the overage is repaid).
- **Narrative/special spaces:** a few one-off spaces add flavor and light player-interaction — "Hunger Strikes, go back to Restaurant," "It's your best friend's birthday, advance to the Gift Shop," "Lottery! Win $100." "Go to any store space" lets a player warp directly to any store's entrance.
- **Win:** first player to buy all 19 items (no duplicate general items; the 2 pet slots must be different species) with a $0 loan balance wins.

## 3. Goals & Non-Goals

**v1 Goals — local pass-and-play**
- Faithfully digitize the rules above so the game plays the same, just without physical pieces, in a single browser tab/device passed around the table.
- Make the fiddly physical bookkeeping (making change, sorting cards, tracking the shopping list) automatic and error-proof.
- Responsive web app — playable on desktop and phone.
- Data-driven content (stores, items, prices, cards) so the board/economy can be rebalanced or reskinned without code changes.
- Validate the full rules engine (§6–§8) against real gameplay before investing in networking.

**Later-phase goals (see §16 Roadmap)**
- **Synchronous online multiplayer via invite codes** (Phase 1) — the target architecture is still designed for in §9, just not built for v1.
- **vs. CPU** opponents (Phase 2).

**Non-goals**
- Real-money purchases or ads.
- Native mobile apps (a PWA wrapper can come later).
- Voice/video chat — text chat/emotes only.
- Asynchronous ("take your turn whenever") play — never planned; see §9.

## 4. IP Note (read before building)

Bargain Hunter is a copyrighted Milton Bradley (now Hasbro) property. A public or commercial release would need rights clearance. If that isn't in scope, the mechanics described here can be kept while the board name, box art, and specific item/card flavor text are replaced with original content. Worth deciding this early since it affects the content pipeline and branding — flagged again in Open Questions.

## 5. Physical → Digital Component Mapping

"Server" below refers to the RNG/state-authority role generically — in v1 (pass-and-play) that role is played by client-side code; it only means an actual backend server once Phase 1 (§9, §16) is built.

| Physical component | Digital equivalent |
|---|---|
| Gameboard | 40-space outer ring + 5 store branches, modeled as a graph (see §6). SVG/Canvas board component, fixed aspect ratio, pan/zoom on mobile |
| Spinner | RNG, uniform **1–8**, with an animated dial for feedback |
| Pawns | Animated tokens that step space-by-space along the path |
| 5 stacks of 4 price cards | Per-store `PriceDeck`; only the top entry is "active"; a Sale action rotates the top card to the back |
| Bargain-Finder cards (17) | Draw pile; per-player hand cap of 3; `move` cards flagged in-store-only, `discount` cards playable at purchase time |
| Events cards (17) | Draw pile; 14 `immediate` cards auto-resolve, 3 `holdable` cards go to a private hand |
| Credit card machine | A single "Run Credit Check" action; **25% (1-in-4) approval**, independent of amount requested; approve/deny animation |
| Paper money / banker role | Tracked ledger per player, rendered as bill denominations (see §11) — no human banker needed |
| Shopping list sheet | Persistent checklist UI: purchased items, pet slots, loan balance, running interest paid |

## 6. Board & Movement Model

The board is a graph, not a flat array, since direction flips inside stores:

- **Outer ring:** a 40-node cycle traversed clockwise: 1 Payday corner, 3 Events corners, 5 store Entrances, 5 store Exit/"go back or draw Events" spaces, plus SALE!, Window Shopping, Take-a-Bargain-Finder-Card, penalty, and narrative spaces filling out the rest. Full sequence in §17-A.
- **Store branch:** each Entrance is also the head of a short counter-clockwise item chain (7 items for furniture stores, 7 species/choice spaces for the Pet Shop, 10 items + 2 internal SALE spaces for department stores) ending in an Exit node whose text matches the outer-ring "go back to any space in the store or draw an Events card" space.
- **Confirmed: entering a store skips the outer-ring spaces between Entrance and Exit.** A store's Entrance and Exit are two separate, numbered outer-ring spaces (e.g., Purple Department Store's Entrance is outer-ring space 5, its Exit is outer-ring space 8). Stepping into the store from the Entrance and shopping through its full item chain pops the pawn back out onto the outer ring *at the Exit's position* — a full shopping trip skips whatever outer-ring spaces sit between Entrance and Exit (Window Shopping, Take-a-Bargain-Finder-Card, etc.) that a player who stayed outside would have passed individually. This is a deliberate shortcut/tradeoff: shopping is faster around the ring but the player forgoes those outer-ring spaces' effects that turn.
  - Implementation note: model this as the store branch being a literal detour off the ring — the pawn's `position.context` switches to the `StoreId` on entering, and switches back to `"outer"` at the Exit's ring-index once the item chain is fully traversed (or once a movement roll would overshoot the last item space, per store).
- Landing on a store's Exit space directly via normal outer-ring movement (without having shopped this turn) offers a choice per its text: warp back into that store to visit any space already discovered, or draw an Events card instead.
- Movement is animated tile-by-tile (not a jump-cut) so intermediate effects — passing Payday, passing an opponent — read clearly.

## 7. Turn State Machine

```
1. TurnStart          — active player notified; others see a "waiting" state
2. PlayerAction        — player may: Spin & Move, or Run Credit Check (once per turn),
                          or play a held Bargain-Finder move card (only legal while
                          positioned inside a store's item track) in place of spinning
3. Movement            — server rolls 1–8, resolves path (outer ring or in-store item chain), animates
4. SpaceResolution      — ALL space effects trigger on exact landing only, EXCEPT Payday,
                          which also triggers on pass-through (see step 5). Modal/prompt as needed:
     - Item space        → optional purchase (price from store's active PriceDeck;
                             a held Bargain-Finder discount card may be played here)
     - "Your Choice" space (Pet Shop only) → optional purchase of any not-yet-owned
                             pet species, at that species' current active price
     - Penalty space      → auto-charge spin × the space's multiplier
                             (Restaurant/Doctor's Office ×$10, Auto Repairs ×$50, Gift Shop ×$10, Charity ×$1)
     - SALE! space        → optional: rotate any subset of stores' top price cards
     - Take-a-Bargain-Finder-Card → draw card (discard oldest-of-3 if over cap)
     - Events corner       → draw card; immediate cards auto-resolve, holdable cards go to hand
     - Store Exit space    → choice: warp back into that store, or draw an Events card
     - "Go to any store space" → player chooses any store's Entrance as destination
     - Tag Sale            → spin × $10 flat price for one listed item of choice
     - Narrative spaces    → resolve as written (e.g., move to a named space, lose a turn)
5. PaydayCheck          — if Payday was landed on OR passed during movement (the one
                          pass-through exception to step 4): pay out, charge 10% interest
                          on any loan, offer optional repay
6. WinCheck             — 19/19 items + $0 loan → game over
7. TurnEnd              — advance to next player (clockwise turn order)
```

## 8. Data Model (sketch)

```ts
interface Player {
  id: string;
  name: string;
  pawnColor: string;
  cash: number;                 // single integer; see §11 for how it's displayed
  loanBalance: number;          // 0..1000, or >1000 during Financial Disaster
  inFinancialDisaster: boolean;
  shoppingList: ShoppingItem[]; // 17 goods + 2 pet slots
  bargainFinderHand: Card[];   // max length 3
  holdableEvents: Card[];      // unlimited (only 3 such cards exist in the deck)
  position: { spaceId: string; context: "outer" | StoreId };
}

interface ShoppingItem {
  itemId: string;               // e.g. "sofa", "toaster"
  purchased: boolean;
  pricePaid?: number;
  boughtAt?: StoreId;           // which of the paired stores it was bought from
  isPetSlot?: boolean;
  petSpecies?: string;          // enforced distinct across the two pet slots
}

type StoreId = "furnGreen" | "furnBlue" | "deptOlive" | "deptPurple" | "petsYellow";

interface Store {
  id: StoreId;
  name: string;                 // e.g. "Furniture Store (Green)"
  pairedWith?: StoreId;         // furnGreen <-> furnBlue, deptOlive <-> deptPurple; pets has none
  itemCatalog: string[];        // shared with pairedWith store when present
  itemOrder: string[];          // this store's own item-space sequence (incl. internal SALE spaces)
  priceDeck: PriceCard[];      // length 4, index 0 = active
}

interface PriceCard {
  prices: Record<string /*itemId*/, number>;
}

interface Card {
  id: string;
  deck: "bargainFinder" | "events";
  kind: "move" | "discount" | "immediate" | "holdable";
  inStoreOnly?: boolean;        // true for all Bargain-Finder move cards
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

Note on the Pet Shop: its `itemOrder` includes a `"yourChoice"` pseudo-item alongside the 6 real species (see §17-B) — when a player lands on that space, the purchase flow lets them pick any species not already in one of their two pet slots, priced at that species' current active price rather than a fixed price of its own.

## 9. Backend & Networking

### v1 — local pass-and-play (confirmed scope)
- All players share one device/browser tab, taking turns in person; no network play in v1.
- Because there's no cross-device trust boundary, game state and RNG (spins, card draws, credit checks) can live entirely **client-side** — a lightweight state manager (e.g., React context/reducer) is sufficient; no server is required to run a game.
- Optional: persist in-progress game state to the browser (e.g., IndexedDB) so a refresh doesn't lose the game — not required for v1, but cheap to add.
- Turn handoff between players is a UI concern (see §10), not a networking one.

### Phase 1 — online synchronous multiplayer (designed for, not built in v1)
- **Synchronous play only:** all seated players connected in the same live session; no async "take your turn whenever" mode planned.
- **Invite codes:** host creates a room and gets a short shareable code (and/or link); other players join by entering it. Supports 2–4 seats; optional CPU fill-in for missing seats in Phase 2.
- **Authoritative server** (Node.js) owns all randomness so no client can manipulate outcomes — this is the point where RNG/game-state logic moves server-side; the v1 client-side rules engine should be structured so this migration doesn't require a rewrite (e.g., keep RNG calls behind a single interface).
- **WebSocket** channel (Socket.IO or plain WS) per game room for real-time turn sync.
- **Persistence:** Redis or Postgres keyed by room code, so a dropped connection can rejoin the same live session (reconnect, not resume-later).
- A disconnected player should be clearly flagged to the table (e.g., "waiting for Alex to reconnect") rather than silently skipped.

## 10. Frontend

- **React** with the board rendered in SVG (crisp at any zoom) or a lightweight canvas library if animation load gets heavy.
- Suggested components: `BoardView`, `PawnToken`, `StoreModal`, `PriceCardDisplay`, `ShoppingListPanel`, `CardDrawModal`, `CreditCheckWidget`, `CashDisplay`, `TurnIndicator`, `SpinnerWidget`, `PassDeviceScreen`.
- **v1:** game state lives in client state (React context/reducer per §9); no server round-trip needed. **Phase 1:** the same components rehydrate from server-pushed events instead — keep game-state reads behind a single hook/selector layer so swapping the source is a low-risk change.
- **Turn handoff (`PassDeviceScreen`):** since pass-and-play shares one device, insert a "pass to [next player] — tap to reveal your turn" interstitial between turns. This keeps each player's held Bargain-Finder hand and holdable Events cards from being visible to the table until it's their turn, without needing any networking.
- Mobile layout: board pans/zooms; shopping list and cash display collapse into drawers/tabs.

## 11. Cash Display (bills, not just a number)

Rather than showing a player's cash as a bare number, render it as their actual bill breakdown — matching the original's denominations: **$500, $100, $50, $20, $10, $5**.

- `cash` in `GameState` stays a single integer (source of truth for all payment/interest/change math — no need to track individual bill inventory or "the bank runs out of $5s").
- The `CashDisplay` component derives a bill breakdown purely for presentation, via a greedy largest-first split:

```ts
const DENOMINATIONS = [500, 100, 50, 20, 10, 5] as const;

function toBillBreakdown(total: number): Record<number, number> {
  let remaining = total;
  const breakdown: Record<number, number> = {};
  for (const bill of DENOMINATIONS) {
    breakdown[bill] = Math.floor(remaining / bill);
    remaining %= bill;
  }
  return breakdown; // any remainder below $5 can be shown as a small "loose change" chip
}
```

- UI shows a row/stack of bill icons grouped by denomination with the **total dollar amount displayed prominently alongside**, not instead of.
- Bill counts animate up/down on payment and payday so a purchase visually reads as "bills leaving the stack."
- Same treatment applies to bank/interest-due modals so a payment amount is always legible both as bills and as a total.

## 12. Board Photo Cross-Reference

A photo of the physical board (`bargain-hunter-board.jpg`) confirms the structure described in §6 and §17-A:

- The board is a square, rotationally-symmetric **pinwheel** of four quadrants. Each quadrant contains one corner space, a run of outer-ring spaces, and one store insert whose Entrance branches perpendicularly *into* the board's interior as that store's item track, illustrated with period-appropriate product photography (a couch/lamp scene for the furniture stores, an appliance-filled kitchen for the department stores, a pet photo for the Pet Shop).
- **Payday** is the one diamond/arrow-shaped corner; the other three corners are all labeled **Events**.
- The board's center holds face-up placeholder art for the **Bargain-Finder Cards** and **Events Cards** decks, a restaurant place-setting icon (tying to the "Restaurant" penalty space), and the spinner dial.
- The Pet Shop's item track visibly includes a **"Your Choice"** space, now confirmed and fully sequenced in §17-B — the Pet Shop is the one store without a price-comparison partner, so "Your Choice" fills the role a bargain-priced paired store would otherwise play.
- The photo is a low-resolution snapshot of a folded board, so it was used to confirm overall layout and art direction rather than to re-transcribe text — board.md, stores.md, bargain-finder.md, and events.md remain the source of truth for exact wording. A couple of spaces show minor label wording differences between the photo and the transcription (e.g., "go back to any store space" vs. "go to any store space") — cosmetic, not flagged as a functional gap.
- Recommend keeping the photo on file as an art-direction reference for the digital board's color palette (magenta/purple field, mustard/orange/red/blue accent spaces) and the pinwheel silhouette.

## 13. Visual Direction

- The physical board's own palette — magenta/purple center field, mustard-orange penalty spaces, blue/green/purple/olive store fronts, red accent corners — is a ready-made, period-accurate starting palette (see §12); modernize with flat design and clearer iconography rather than inventing a new scheme from scratch.
- Bargain vs. regular item spaces need a non-color-dependent cue (icon/pattern), not just a shade difference — see accessibility note below.
- A short "flip" animation when a Sale space cycles a price card; a small vending-machine-style animation for the credit check, as a wink to the original toy.

## 14. Digital-Only Enhancements (phase 2+)

- CPU opponents with simple heuristics (prefer bargain spaces, avoid unnecessary borrowing) for solo play.
- Turn timer with auto-skip for inactive players online.
- Activity/game log ("Alex bought a Sofa at Furniture Store Green for $350 — a bargain!").
- Post-game stats (money spent, bargains found, biggest loan carried, cheaper-store guesses correct).
- Undo — likely solo/practice-mode only, since undo conflicts with fairness once real opponents are involved.
- Accessibility: colorblind-safe palette + icon/pattern redundancy for bargain and penalty spaces, full keyboard navigation, screen-reader labels on all board spaces and modals.

## 15. Open Questions / Data Gaps

All four previously-open items are now resolved:

- ~~Store Entrance/Exit rejoin mechanics~~ → **Resolved:** shopping a store skips the intervening outer-ring spaces between Entrance and Exit. See §6.
- ~~Pet Shop internal item order~~ → **Resolved:** Entrance → Rabbit → Exotic Fish → Your Choice → Parrot → Cat → Lizard → Dog → Exit. See §17-B.
- ~~Corner-landing vs. pass-through rules~~ → **Resolved:** all spaces trigger on exact landing only, except Payday, which also triggers on pass-through. See §7.
- ~~v1 scope~~ → **Resolved:** v1 ships local pass-and-play only; online multiplayer is Phase 1. See §3, §9, §16.

**Remaining minor item:**
- **"Your Choice" pricing:** assumed (not yet explicitly confirmed) that a species bought via "Your Choice" costs that species' current active-price-card price, same as buying it from its own dedicated space — there's no separate price list for "Your Choice" itself in the source material, so this is the natural reading. Worth a quick confirmation but low-risk to build against as-is.
- **IP/licensing decision (§4):** still unresolved — whether this ships as a faithful Bargain Hunter clone (needs rights clearance) or a reskin with original branding. Doesn't block engine work, but affects the content pipeline and should be settled before any public release.

## 16. Phased Roadmap

- **v1 / Phase 0 (confirmed scope):** local pass-and-play in a single browser tab/device; full rules engine, client-side state; no accounts or backend.
- **Phase 1:** online synchronous multiplayer — invite-code rooms, authoritative server, WebSocket sync, reconnect handling.
- **Phase 2:** CPU opponents, stats, animation/art polish, accessibility pass.
- **Phase 3 (optional):** installable PWA, licensing/branding decisions, monetization if applicable.

## 17. Appendices — Full Content Transcription

### 17-A. Outer Ring (40 spaces, in clockwise order from Payday)

| # | Space |
|---|---|
| 1 | Payday! 10% interest due! *(Corner)* |
| 2 | Go to any store space |
| 3 | Restaurant — pay $10 × spinner |
| 4 | SALE! |
| 5 | Purple Department Store — Entrance |
| 6 | Window Shopping (do nothing) |
| 7 | Take a Bargain Finder card |
| 8 | Go back to any space in the Purple Department Store, or draw an Events card |
| 9 | Auto Repairs — pay $50 × spinner |
| 10 | Blue Furniture Store — Entrance |
| 11 | Window Shopping (do nothing) |
| 12 | Events card *(Corner)* |
| 13 | Take a Bargain Finder card |
| 14 | SALE! |
| 15 | Go back to any space in the Blue Furniture Store, or draw an Events card |
| 16 | Hunger Strikes! Go back to Restaurant |
| 17 | Doctor's Office — pay $10 × spinner |
| 18 | Pet Shop — Entrance |
| 19 | Window Shopping (do nothing) |
| 20 | SALE! |
| 21 | Events card *(Corner)* |
| 22 | Take a Bargain Finder card |
| 23 | Go back to any space in the Pet Shop, or draw an Events card |
| 24 | Charity — give $1 × spinner |
| 25 | Olive Department Store — Entrance |
| 26 | Window Shopping (do nothing) |
| 27 | It's your best friend's birthday! Advance to the Gift Shop |
| 28 | Go back to any space in the Olive Department Store, or draw an Events card |
| 29 | Go to Payday! |
| 30 | Green Furniture Store — Entrance |
| 31 | Window Shopping (do nothing) |
| 32 | Events card *(Corner)* |
| 33 | Take a Bargain Finder card |
| 34 | SALE! |
| 35 | Go back to any space in the Green Furniture Store, or draw an Events card |
| 36 | Lottery! Win $100 |
| 37 | Take a Bargain Finder card |
| 38 | Gift Shop — pay $10 × spinner |
| 39 | Go to any store space |
| 40 | TAG SALE! Pick up any listed item for $10 × spinner |

### 17-B. Stores

**Furniture Store — Green.** Item track: Entrance → Kitchen Set → Sofa → Lamp → Armchair → Clock → Bed → Dresser → Exit ("go back to any space or draw Events").

| Item | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Armchair | $250 | $225 | $275 | $200 |
| Bed | $250 | $200 | $100 | $150 |
| Clock | $70 | $60 | $80 | $50 |
| Dresser | $275 | $300 | $250 | $325 |
| Kitchen Set | $650 | $625 | $675 | $700 |
| Lamp | $100 | $70 | $80 | $90 |
| Sofa | $350 | $450 | $400 | $300 |

**Furniture Store — Blue.** Item track: Entrance → Lamp → Sofa → Dresser → Bed → Clock → Armchair → Kitchen Set → Exit.

| Item | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Armchair | $350 | $375 | $300 | $325 |
| Bed | $350 | $450 | $300 | $400 |
| Clock | $20 | $30 | $40 | $10 |
| Dresser | $150 | $200 | $175 | $225 |
| Kitchen Set | $500 | $200 | $600 | $450 |
| Lamp | $30 | $40 | $60 | $50 |
| Sofa | $600 | $650 | $500 | $550 |

**Department Store — Olive.** Item track: Entrance → Stove → Radio → Television → SALE → Dishwasher → Clothes Dryer → Refrigerator → Washing Machine → SALE → Iron → Blender → Toaster → Exit.

| Item | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Blender | $25 | $35 | $20 | $30 |
| Clothes Dryer | $325 | $300 | $350 | $375 |
| Dishwasher | $300 | $375 | $350 | $325 |
| Iron | $30 | $45 | $40 | $35 |
| Radio | $40 | $35 | $30 | $45 |
| Refrigerator | $525 | $550 | $575 | $500 |
| Stove | $375 | $300 | $325 | $350 |
| Television | $200 | $150 | $250 | $100 |
| Toaster | $35 | $50 | $45 | $40 |
| Washing Machine | $375 | $350 | $425 | $400 |

**Department Store — Purple.** Item track: Entrance → Radio → Clothes Dryer → Toaster → SALE → Iron → Blender → Refrigerator → Television → SALE → Stove → Dishwasher → Washing Machine → Exit.

| Item | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Blender | $55 | $40 | $50 | $45 |
| Clothes Dryer | $400 | $450 | $475 | $425 |
| Dishwasher | $250 | $225 | $200 | $275 |
| Iron | $25 | $20 | $10 | $15 |
| Radio | $15 | $10 | $20 | $25 |
| Refrigerator | $450 | $425 | $475 | $400 |
| Stove | $400 | $475 | $450 | $425 |
| Television | $350 | $450 | $400 | $300 |
| Toaster | $30 | $15 | $20 | $25 |
| Washing Machine | $450 | $525 | $500 | $475 |

**Pet Shop — Yellow.** Item track: Entrance → Rabbit → Exotic Fish → **Your Choice** *(Corner — buy any species not already in one of the player's two pet slots, at that species' current price)* → Parrot → Cat → Lizard → Dog → Exit ("go back to any space or draw Events").

Note: "Exotic Fish" is the same item priced as "Fish" in the original price-card data below — the fuller name is used consistently elsewhere in this doc.

| Species | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Cat | $150 | $100 | $75 | $50 |
| Dog | $200 | $150 | $250 | $100 |
| Exotic Fish | $50 | $75 | $100 | $125 |
| Lizard | $45 | $85 | $25 | $65 |
| Parrot | $100 | $300 | $400 | $200 |
| Rabbit | $35 | $25 | $15 | $45 |

### 17-C. Bargain-Finder Cards (17)

| # | Text |
|---|---|
| 1 | Go ahead 3 spaces instead of spinning. (good in stores only) |
| 2 | Go back 2 spaces instead of spinning. (good in stores only) |
| 3 | Special Sale! $200 off any item. (play as you buy) |
| 4 | Go ahead 1 space instead of spinning. (good in stores only) |
| 5 | Go back 2 spaces instead of spinning. (good in stores only) |
| 6 | Go ahead 2 spaces instead of spinning. (good in stores only) |
| 7 | Go back 1 space instead of spinning. (good in stores only) |
| 8 | Special Sale! $100 off any item. (play as you buy) |
| 9 | Go back 3 spaces instead of spinning. (good in stores only) |
| 10 | Go ahead 3 spaces instead of spinning. (good in stores only) |
| 11 | Go ahead 2 spaces instead of spinning. (good in stores only) |
| 12 | Special Sale! $150 off any item. (play as you buy) |
| 13 | Go back 1 space instead of spinning. (good in stores only) |
| 14 | Go back 3 spaces instead of spinning. (good in stores only) |
| 15 | Special Sale! $50 off any item. (play as you buy) |
| 16 | Special Sale! $75 off any item. (play as you buy) |
| 17 | Go back 1 space instead of spinning. (good in stores only) |

### 17-D. Events Cards (17)

| # | Text | Holdable? |
|---|---|---|
| 1 | Go to Payday! | No |
| 2 | Advance to Tag Sale! | No |
| 3 | Sweepstakes winner! Collect $100 × spin! | No |
| 4 | Send an opponent who is in a store to "Window Shopping" | No |
| 5 | Wait in a long check-out line. Lose your next turn. | No |
| 6 | Go to Payday! | No |
| 7 | Win $300 in a lottery! | No |
| 8 | Rich uncle pays off all your credit debts now! | No |
| 9 | Send any opponent back to the Restaurant | No |
| 10 | Send an opponent who is in a store to "Window Shopping" | No |
| 11 | Stores close for the night. All players in stores go to "Window Shopping" | No |
| 12 | Car Insurance. Free auto repairs. | **Yes** (save, use once, then discard) |
| 13 | Rich uncle pays off all your credit debts now! | No |
| 14 | Cancel an opponent's Payday! | **Yes** (save, use once, then discard) |
| 15 | Car Insurance. Free auto repairs. | **Yes** (save, use once, then discard) |
| 16 | Win $500 in a lottery! | No |
| 17 | Interest Due! Everyone who owes money on their charge accounts must pay 10% interest to the bank. | No |
