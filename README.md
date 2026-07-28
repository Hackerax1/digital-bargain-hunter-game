# Bargain Hunter — Digital Edition

A browser-based reimagining of the 1981 Milton Bradley shopping game **Bargain Hunter** for 2–4 players. See [`Bargain_Hunter_Digital_Design_Doc.md`](./Bargain_Hunter_Digital_Design_Doc.md) for the full design document.

Built with **React + TypeScript + Vite**.

## Project structure

```
src/
├── types/index.ts               # Core TypeScript interfaces (Player, Store, Card, GameState…)
├── data/
│   ├── events-cards.ts          # 17 Events card templates
│   ├── bargain-finder-cards.ts  # 17 Bargain Finder card templates
│   └── stores.ts                # 5 stores × 4 price cards each
└── components/
    ├── BoardView.tsx             # SVG board (structural template)
    ├── CardDrawModal.tsx         # Card draw overlay
    ├── CashDisplay.tsx           # Bill-denomination cash breakdown
    ├── PriceCardDisplay.tsx      # Per-store active price card table
    └── ShoppingListPanel.tsx     # Player shopping checklist + finances
```

## Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run lint     # lint with Oxlint
```

## Roadmap

- **Phase 0** — local pass-and-play prototype (rules engine, full board)
- **Phase 1** — online synchronous multiplayer via invite codes + WebSockets
- **Phase 2** — CPU opponents, stats, animation polish, accessibility
- **Phase 3** — installable PWA, licensing decisions
