import React from "react";
import type { ShoppingItem } from "../types";

interface ShoppingListPanelProps {
  items: ShoppingItem[];
  loanBalance: number;
  cash: number;
}

/**
 * ShoppingListPanel — persistent sidebar/drawer that shows a player's
 * 19-item checklist, current cash, and loan balance.
 */
const ShoppingListPanel: React.FC<ShoppingListPanelProps> = ({
  items,
  loanBalance,
  cash,
}) => {
  const purchased = items.filter((i) => i.purchased).length;
  const total = items.length;

  return (
    <aside className="shopping-list-panel" aria-label="Shopping List">
      <h2 className="shopping-list-panel__heading">Shopping List</h2>
      <p className="shopping-list-panel__progress">
        {purchased} / {total} items
      </p>

      <ul className="shopping-list-panel__list">
        {items.map((item) => (
          <li
            key={item.itemId}
            className={
              "shopping-list-panel__item" +
              (item.purchased ? " shopping-list-panel__item--done" : "")
            }
          >
            <span className="shopping-list-panel__item-check" aria-hidden="true">
              {item.purchased ? "✓" : "○"}
            </span>
            <span className="shopping-list-panel__item-name">
              {item.isPetSlot
                ? `Pet: ${item.petSpecies ?? "?"}`
                : item.itemId.replace(/_/g, " ")}
            </span>
            {item.purchased && item.pricePaid !== undefined && (
              <span className="shopping-list-panel__item-price">
                ${item.pricePaid}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="shopping-list-panel__finances">
        <div className="shopping-list-panel__cash">
          Cash: <strong>${cash}</strong>
        </div>
        <div
          className={
            "shopping-list-panel__loan" +
            (loanBalance > 0 ? " shopping-list-panel__loan--active" : "")
          }
        >
          Loan: <strong>${loanBalance}</strong>
        </div>
      </div>
    </aside>
  );
};

export default ShoppingListPanel;
