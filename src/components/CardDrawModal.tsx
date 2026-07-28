import React from "react";
import type { Card } from "../types";

interface CardDrawModalProps {
  card: Card;
  onDismiss: () => void;
  /** If true, the player may keep this card instead of resolving immediately */
  canHold?: boolean;
  onHold?: (card: Card) => void;
}

/**
 * CardDrawModal — shown whenever a player draws from the Bargain Finder deck
 * or the Events deck. Displays card title, flavour text, and any applicable
 * action buttons.
 */
const CardDrawModal: React.FC<CardDrawModalProps> = ({
  card,
  onDismiss,
  canHold = false,
  onHold,
}) => {
  const deckLabel =
    card.deck === "bargainFinder" ? "Bargain Finder" : "Events";

  return (
    <div className="card-draw-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="card-title">
      <div className="card-draw-modal">
        <p className="card-draw-modal__deck-label">{deckLabel} Card</p>
        <h2 id="card-title" className="card-draw-modal__title">
          {card.title}
        </h2>
        <p className="card-draw-modal__text">{card.text}</p>

        <div className="card-draw-modal__actions">
          {canHold && onHold && (
            <button
              className="btn btn--secondary"
              onClick={() => onHold(card)}
            >
              Hold Card
            </button>
          )}
          <button className="btn btn--primary" onClick={onDismiss}>
            {card.kind === "immediate" ? "Resolve" : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardDrawModal;
