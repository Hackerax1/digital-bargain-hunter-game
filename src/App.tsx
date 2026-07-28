import { useState } from "react";
import "./App.css";
import { stores } from "./data/stores";
import { eventsCards } from "./data/events-cards";
import { bargainFinderCards } from "./data/bargain-finder-cards";
import PriceCardDisplay from "./components/PriceCardDisplay";
import CardDrawModal from "./components/CardDrawModal";
import CashDisplay from "./components/CashDisplay";
import type { Card } from "./types";

/**
 * App — top-level template shell.
 *
 * This screen is a design preview that exercises each component template.
 * It will be replaced by the real lobby / game routing once the rules engine
 * is in place (design doc §15 Phase 0).
 */
function App() {
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);

  const drawRandom = (deck: Card[]) => {
    const card = deck[Math.floor(Math.random() * deck.length)];
    setDrawnCard(card);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Bargain Hunter — Digital Edition</h1>
        <CashDisplay cash={1680} />
      </header>

      <main className="app__main">
        {/* ── Store price cards ─────────────────────────────────────── */}
        <section className="app__section">
          <h2>Store Prices</h2>
          <div className="store-grid">
            {stores.map((store) => (
              <PriceCardDisplay
                key={store.id}
                store={store}
                highlightItems={["toaster", "sofa", "cat"]}
              />
            ))}
          </div>
        </section>

        {/* ── Card draw demo ────────────────────────────────────────── */}
        <section className="app__section">
          <h2>Card Decks</h2>
          <div className="deck-buttons">
            <button
              className="btn btn--primary"
              onClick={() => drawRandom(bargainFinderCards)}
            >
              Draw Bargain Finder Card
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => drawRandom(eventsCards)}
            >
              Draw Events Card
            </button>
          </div>
          <p className="deck-info">
            Bargain Finder: {bargainFinderCards.length} cards &nbsp;|&nbsp;
            Events: {eventsCards.length} cards
          </p>
        </section>
      </main>

      {/* ── Card draw modal ───────────────────────────────────────────── */}
      {drawnCard && (
        <CardDrawModal
          card={drawnCard}
          canHold={drawnCard.kind === "holdable"}
          onDismiss={() => setDrawnCard(null)}
          onHold={() => setDrawnCard(null)}
        />
      )}
    </div>
  );
}

export default App;
