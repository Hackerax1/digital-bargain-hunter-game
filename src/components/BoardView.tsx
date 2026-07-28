import React from "react";
import type { BoardGraph, Player } from "../types";

interface BoardViewProps {
  board: BoardGraph;
  players: Player[];
  activePlayerId: string;
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
  // Group players by their current space for rendering pawn stacks
  const playersBySpace: Record<string, Player[]> = {};
  for (const player of players) {
    const sid = player.position.spaceId;
    if (!playersBySpace[sid]) playersBySpace[sid] = [];
    playersBySpace[sid].push(player);
  }

  return (
    <svg
      className="board-view"
      viewBox="0 0 800 800"
      role="img"
      aria-label="Game board"
    >
      {/* TODO: Replace placeholder rects with actual board geometry */}
      {Object.values(board.spaces).map((space, idx) => {
        const x = (idx % 10) * 78 + 10;
        const y = Math.floor(idx / 10) * 78 + 10;
        const pawns = playersBySpace[space.id] ?? [];

        return (
          <g key={space.id} transform={`translate(${x},${y})`}>
            <rect
              width={70}
              height={70}
              rx={6}
              className={`board-space board-space--${space.type}`}
            />
            <text x={35} y={20} textAnchor="middle" className="board-space__label">
              {space.label}
            </text>
            {/* Pawn tokens */}
            {pawns.map((p, pi) => (
              <circle
                key={p.id}
                cx={12 + pi * 16}
                cy={55}
                r={8}
                className={`pawn-token${p.id === activePlayerId ? " pawn-token--active" : ""}`}
                fill={p.pawnColor}
                aria-label={`${p.name}'s pawn`}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default BoardView;
