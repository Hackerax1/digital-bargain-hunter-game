import React from "react";
import type { BoardGraph, Player } from "../types";

interface BoardViewProps {
  board: BoardGraph;
  players: Player[];
  activePlayerId: string;
}

const OUTER_ORDER = [
  "payday",
  "events",
  "penalty",
  "sale",
  "dept_a",
  "dept_b",
  "furn_a",
  "furn_b",
  "pets",
  "tag_sale",
];

const SPACE_LAYOUT: Record<string, { x: number; y: number }> = {
  payday: { x: 500, y: 90 },
  events: { x: 690, y: 175 },
  penalty: { x: 770, y: 350 },
  sale: { x: 690, y: 525 },
  dept_a: { x: 500, y: 610 },
  dept_b: { x: 300, y: 610 },
  furn_a: { x: 110, y: 525 },
  furn_b: { x: 35, y: 350 },
  pets: { x: 110, y: 175 },
  tag_sale: { x: 300, y: 90 },
};

function splitLabel(label: string): string[] {
  const words = label.split(" ");
  if (words.length <= 1) {
    return [label];
  }

  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

/**
 * BoardView — renders the game board as an SVG.
 *
 * This is a structural template; the actual SVG geometry (coordinates of each
 * space, store branch positions, etc.) should be populated once the full board
 * layout is finalized. Each <BoardSpace> node is rendered as a rectangle/circle
 * with a text label and any pawn tokens currently on that space.
 *
 * Design doc §6: outer ring traversed clockwise; store branches
 * counter-clockwise; movement animated tile-by-tile.
 */
const BoardView: React.FC<BoardViewProps> = ({ board, players, activePlayerId }) => {
  const playersBySpace: Record<string, Player[]> = {};
  for (const player of players) {
    const sid = player.position.spaceId;
    if (!playersBySpace[sid]) playersBySpace[sid] = [];
    playersBySpace[sid].push(player);
  }

  const activePlayer = players.find((player) => player.id === activePlayerId);
  const activeSpaceId = activePlayer?.position.spaceId;

  const pathPoints = OUTER_ORDER.map((spaceId) => {
    const point = SPACE_LAYOUT[spaceId];
    return `${point.x + 65},${point.y + 44}`;
  }).join(" ");

  return (
    <svg className="board-view" viewBox="0 0 900 720" role="img" aria-label="Game board">
      <defs>
        <linearGradient id="board-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff1cf" />
          <stop offset="100%" stopColor="#ffd5a3" />
        </linearGradient>
      </defs>

      <rect x="12" y="12" width="876" height="696" rx="24" className="board-frame" />
      <rect x="40" y="40" width="820" height="640" rx="20" fill="url(#board-bg)" />
      <polygon className="board-track" points={pathPoints} />

      <text x="450" y="332" textAnchor="middle" className="board-center-title">
        Bargain Hunter
      </text>
      <text x="450" y="362" textAnchor="middle" className="board-center-subtitle">
        Phase 0 Local Prototype
      </text>

      {OUTER_ORDER.map((spaceId) => {
        const space = board.spaces[spaceId];
        if (!space) {
          return null;
        }

        const layout = SPACE_LAYOUT[spaceId];
        const x = layout.x;
        const y = layout.y;
        const pawns = playersBySpace[space.id] ?? [];
        const isActiveSpace = activeSpaceId === space.id;
        const labelLines = splitLabel(space.label);

        return (
          <g key={space.id} transform={`translate(${x},${y})`}>
            <rect
              width={130}
              height={88}
              rx={16}
              className={`board-space board-space--${space.type}${isActiveSpace ? " board-space--active" : ""}`}
            />
            {labelLines.map((line, index) => (
              <text key={`${space.id}-${index}`} x={65} y={31 + index * 16} textAnchor="middle" className="board-space__label">
                {line}
              </text>
            ))}

            {pawns.map((p, pi) => (
              <g key={p.id} transform={`translate(${18 + pi * 28},64)`}>
                <circle
                  cx={0}
                  cy={0}
                  r={10}
                  className={`pawn-token${p.id === activePlayerId ? " pawn-token--active" : ""}`}
                  fill={p.pawnColor}
                  aria-label={`${p.name}'s pawn`}
                />
                <text x={0} y={4} textAnchor="middle" className="pawn-token__label">
                  {p.name.charAt(0).toUpperCase()}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default BoardView;
