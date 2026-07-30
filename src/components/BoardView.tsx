import React from "react";
import type { BoardGraph, Player } from "../types";

interface BoardViewProps {
  board: BoardGraph;
  players: Player[];
  activePlayerId: string;
}

const SIDE_LENGTH = 10;
const SPACE_SIZE = 74;
const SPACE_GAP = 12;
const BOARD_MARGIN = 90;
const CORNER_INDICES = [0, 11, 20, 31];

function getSegment(index: number) {
  const segmentForIndex = CORNER_INDICES.findIndex((corner, segment) => {
    if (segment === CORNER_INDICES.length - 1) {
      return index >= corner || index <= CORNER_INDICES[0];
    }
    return index >= corner && index <= CORNER_INDICES[segment + 1];
  });

  return segmentForIndex === -1 ? 0 : segmentForIndex;
}

function splitLabel(label: string): string[] {
  const words = label.split(" ");
  if (words.length <= 1) {
    return [label];
  }

  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

function getLayout(index: number) {
  const edge = (SIDE_LENGTH - 1) * (SPACE_SIZE + SPACE_GAP);
  const corners = [
    { x: BOARD_MARGIN + edge, y: BOARD_MARGIN + edge },
    { x: BOARD_MARGIN, y: BOARD_MARGIN + edge },
    { x: BOARD_MARGIN, y: BOARD_MARGIN },
    { x: BOARD_MARGIN + edge, y: BOARD_MARGIN },
    { x: BOARD_MARGIN + edge, y: BOARD_MARGIN + edge },
  ];

  const segment = getSegment(index);
  const startIndex = CORNER_INDICES[segment];
  const endIndex = segment === CORNER_INDICES.length - 1 ? CORNER_INDICES[0] + 40 : CORNER_INDICES[segment + 1];
  const adjustedIndex = segment === CORNER_INDICES.length - 1 && index < CORNER_INDICES[0] ? index + 40 : index;
  const span = endIndex - startIndex;
  const t = span === 0 ? 0 : (adjustedIndex - startIndex) / span;
  const start = corners[segment];
  const end = corners[segment + 1];

  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

const BoardView: React.FC<BoardViewProps> = ({ board, players, activePlayerId }) => {
  const playersBySpace: Record<string, Player[]> = {};
  for (const player of players) {
    const sid = player.position.spaceId;
    if (!playersBySpace[sid]) playersBySpace[sid] = [];
    playersBySpace[sid].push(player);
  }

  const activePlayer = players.find((player) => player.id === activePlayerId);
  const activeSpaceId = activePlayer?.position.spaceId;
  const boardOrder = board.order ?? Object.keys(board.spaces);

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
      <rect x="70" y="70" width="760" height="580" rx="24" className="board-track" />

      <text x="450" y="332" textAnchor="middle" className="board-center-title">
        Bargain Hunter
      </text>
      <text x="450" y="362" textAnchor="middle" className="board-center-subtitle">
        Square board • 1–8 spinner
      </text>

      {boardOrder.map((spaceId, index) => {
        const space = board.spaces[spaceId];
        if (!space) {
          return null;
        }

        const layout = getLayout(index);
        const segment = getSegment(index);
        const isCorner = CORNER_INDICES.includes(index);
        const width = isCorner ? SPACE_SIZE + 10 : SPACE_SIZE;
        const height = isCorner ? SPACE_SIZE : SPACE_SIZE - 12;
        const rotation = isCorner ? 0 : [0, -90, 180, 90][segment] ?? 0;
        const pawns = playersBySpace[space.id] ?? [];
        const isActiveSpace = activeSpaceId === space.id;
        const labelLines = splitLabel(space.label);

        return (
          <g key={space.id} transform={`translate(${layout.x},${layout.y}) rotate(${rotation} ${width / 2} ${height / 2})`}>
            <rect
              width={width}
              height={height}
              rx={14}
              className={`board-space board-space--${space.type}${isActiveSpace ? " board-space--active" : ""}`}
            />
            {labelLines.map((line, lineIndex) => (
              <text key={`${space.id}-${lineIndex}`} x={width / 2} y={28 + lineIndex * 14} textAnchor="middle" className="board-space__label">
                {line}
              </text>
            ))}

            {pawns.map((p, pi) => (
              <g key={p.id} transform={`translate(${18 + pi * 22},${height - 22})`}>
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
