import React from "react";
import { DENOMINATIONS, toBillBreakdown } from "../types";

interface CashDisplayProps {
  cash: number;
}

/**
 * CashDisplay — renders a player's cash as a bill-denomination breakdown
 * (design doc §11) plus a prominent total.
 *
 * e.g. $1,680 → 3×$500  1×$100  1×$50  1×$20  1×$10
 */
const CashDisplay: React.FC<CashDisplayProps> = ({ cash }) => {
  const breakdown = toBillBreakdown(cash);

  return (
    <div className="cash-display" aria-label={`Cash: $${cash}`}>
      <span className="cash-display__total">${cash.toLocaleString()}</span>
      <div className="cash-display__bills">
        {DENOMINATIONS.map((denom) => {
          const count = breakdown[denom];
          if (count === 0) return null;
          return (
            <span key={denom} className="cash-display__bill">
              {count}×${denom}
            </span>
          );
        })}
        {breakdown.loose > 0 && (
          <span className="cash-display__bill cash-display__bill--loose">
            +${breakdown.loose}
          </span>
        )}
      </div>
    </div>
  );
};

export default CashDisplay;
