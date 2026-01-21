# Chess Game With AI

A beautiful and interactive chess game built with React and Vite, featuring an AI opponent with adjustable difficulty levels (1-10).

## Features

- 🎮 Play against AI with 10 difficulty levels
- 🎨 Beautiful gradient UI with animated effects
- ♟️ Full chess rules implementation
- 👑 Check, checkmate, and stalemate detection
- 📊 Move history and captured pieces tracking
- 🎯 Valid move highlighting
- 🎭 Choose to play as White or Black

## Difficulty Levels

- **Easy (1-5)**: Great for beginners, AI makes random moves frequently
- **Average (6-10)**: More challenging gameplay with strategic AI moves

## Technologies Used

- React 19
- Vite
- Lucide React (for icons)
- CSS-in-JS styling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How to Play

1. Choose your color (White or Black)
2. Select difficulty level (1-10)
3. Click on a piece to see valid moves
4. Click on a highlighted square to move
5. Enjoy the game!

## Project Structure

```
Chess-Game/
├── Components/
│   └── chess-game-ai.jsx    # Main chess game component
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── assets/
├── public/
└── package.json
```

## AI Strategy

The AI uses the minimax algorithm with alpha-beta pruning to evaluate moves. The search depth increases with difficulty level, making higher levels more challenging.

## License

MIT
