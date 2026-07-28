import React from "react";
import type { Store } from "../types";
import { activePrice } from "../data/stores";

interface PriceCardDisplayProps {
  store: Store;
  /** Highlight these itemIds (e.g. items on the player's shopping list) */
  highlightItems?: string[];
  /** Called when a player lands on a Sale space and wants to rotate this store */
  onRotate?: (storeId: string) => void;
  canRotate?: boolean;
}

/**
 * PriceCardDisplay — shows the active price card for a single store.
 * Renders the card label (e.g. "Spring Sale") and a table of item → price.
 * Items on the player's shopping list are highlighted.
 */
const PriceCardDisplay: React.FC<PriceCardDisplayProps> = ({
  store,
  highlightItems = [],
  onRotate,
  canRotate = false,
}) => {
  const current = activePrice(store);

  return (
    <div className="price-card-display" data-store={store.id}>
      <div className="price-card-display__header">
        <h3 className="price-card-display__store-name">{store.name}</h3>
        <span className="price-card-display__card-label">{current.label}</span>
        {canRotate && onRotate && (
          <button
            className="btn btn--sale"
            onClick={() => onRotate(store.id)}
            title="Rotate price card (Sale!)"
          >
            Sale!
          </button>
        )}
      </div>

      <table className="price-card-display__table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(current.prices).map(([itemId, price]) => (
            <tr
              key={itemId}
              className={
                highlightItems.includes(itemId)
                  ? "price-card-display__row--highlighted"
                  : undefined
              }
            >
              <td>{itemId.replace(/_/g, " ")}</td>
              <td>${price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="price-card-display__deck-count">
        {store.priceDeck.length} card{store.priceDeck.length !== 1 ? "s" : ""} in deck
      </p>
    </div>
  );
};

export default PriceCardDisplay;
