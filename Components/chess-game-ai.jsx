import React, { useState, useEffect, useCallback } from "react";
import { Crown, RotateCcw, Flag, Settings, Cpu, User } from "lucide-react";

// Initial board setup
const initialBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

const ChessGame = () => {
  const [gameMode, setGameMode] = useState("menu"); // 'menu', 'playing'
  const [playerColor, setPlayerColor] = useState(null);
  const [difficulty, setDifficulty] = useState(5);
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: [],
  });
  const [moveHistory, setMoveHistory] = useState([]);
  const [kingInCheck, setKingInCheck] = useState(null);
  const [gameStatus, setGameStatus] = useState("playing");
  const [isThinking, setIsThinking] = useState(false);

  const pieceValues = {
    "♙": 100,
    "♟": 100,
    "♘": 320,
    "♞": 320,
    "♗": 330,
    "♝": 330,
    "♖": 500,
    "♜": 500,
    "♕": 900,
    "♛": 900,
    "♔": 20000,
    "♚": 20000,
  };

  const isWhitePiece = (piece) => piece && "♔♕♖♗♘♙".includes(piece);
  const isBlackPiece = (piece) => piece && "♚♛♜♝♞♟".includes(piece);

  const getPieceColor = (piece) => {
    if (isWhitePiece(piece)) return "white";
    if (isBlackPiece(piece)) return "black";
    return null;
  };

  const isValidMove = (
    fromRow,
    fromCol,
    toRow,
    toCol,
    board,
    checkForCheck = true,
  ) => {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    const targetPiece = board[toRow][toCol];
    const pieceColor = getPieceColor(piece);

    if (targetPiece && getPieceColor(targetPiece) === pieceColor) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    let valid = false;

    // Pawn
    if (piece === "♙" || piece === "♟") {
      const direction = piece === "♙" ? -1 : 1;
      const startRow = piece === "♙" ? 6 : 1;

      if (colDiff === 0 && !targetPiece) {
        if (rowDiff === direction) valid = true;
        if (
          fromRow === startRow &&
          rowDiff === 2 * direction &&
          !board[fromRow + direction][fromCol]
        ) {
          valid = true;
        }
      } else if (absColDiff === 1 && rowDiff === direction && targetPiece) {
        valid = true;
      }
    }

    // Rook
    if (piece === "♖" || piece === "♜") {
      if (rowDiff === 0 || colDiff === 0) {
        valid = isPathClear(fromRow, fromCol, toRow, toCol, board);
      }
    }

    // Knight
    if (piece === "♘" || piece === "♞") {
      if (
        (absRowDiff === 2 && absColDiff === 1) ||
        (absRowDiff === 1 && absColDiff === 2)
      ) {
        valid = true;
      }
    }

    // Bishop
    if (piece === "♗" || piece === "♝") {
      if (absRowDiff === absColDiff) {
        valid = isPathClear(fromRow, fromCol, toRow, toCol, board);
      }
    }

    // Queen
    if (piece === "♕" || piece === "♛") {
      if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
        valid = isPathClear(fromRow, fromCol, toRow, toCol, board);
      }
    }

    // King
    if (piece === "♔" || piece === "♚") {
      if (absRowDiff <= 1 && absColDiff <= 1) {
        valid = true;
      }
    }

    if (valid && checkForCheck) {
      const testBoard = board.map((row) => [...row]);
      testBoard[toRow][toCol] = testBoard[fromRow][fromCol];
      testBoard[fromRow][fromCol] = null;

      if (isKingInCheck(pieceColor, testBoard)) {
        return false;
      }
    }

    return valid;
  };

  const isPathClear = (fromRow, fromCol, toRow, toCol, board) => {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }

    return true;
  };

  const findKing = (color, board) => {
    const kingPiece = color === "white" ? "♔" : "♚";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === kingPiece) {
          return [row, col];
        }
      }
    }
    return null;
  };

  const isKingInCheck = (color, board) => {
    const kingPos = findKing(color, board);
    if (!kingPos) return false;

    const [kingRow, kingCol] = kingPos;
    const opponentColor = color === "white" ? "black" : "white";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && getPieceColor(piece) === opponentColor) {
          if (isValidMove(row, col, kingRow, kingCol, board, false)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const hasLegalMoves = (color, board) => {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board[fromRow][fromCol];
        if (piece && getPieceColor(piece) === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(fromRow, fromCol, toRow, toCol, board, true)) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };

  const getAllLegalMoves = (color, board) => {
    const moves = [];
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board[fromRow][fromCol];
        if (piece && getPieceColor(piece) === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(fromRow, fromCol, toRow, toCol, board, true)) {
                moves.push({ from: [fromRow, fromCol], to: [toRow, toCol] });
              }
            }
          }
        }
      }
    }
    return moves;
  };

  const evaluateBoard = (board, color) => {
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceColor = getPieceColor(piece);
          const value = pieceValues[piece] || 0;

          // Material value
          if (pieceColor === color) {
            score += value;
          } else {
            score -= value;
          }

          // Position bonuses
          if (difficulty >= 6) {
            // Center control
            const centerBonus =
              3 - Math.abs(3.5 - row) + (3 - Math.abs(3.5 - col));
            if (pieceColor === color) {
              score += centerBonus * 10;
            } else {
              score -= centerBonus * 10;
            }

            // Piece development (knights and bishops)
            if (difficulty >= 11) {
              if ((piece === "♘" || piece === "♗") && pieceColor === color) {
                if (color === "white" && row < 6) score += 30;
                if (color === "black" && row > 1) score += 30;
              }
            }
          }
        }
      }
    }

    // Mobility bonus (higher difficulties)
    if (difficulty >= 8) {
      const myMoves = getAllLegalMoves(color, board).length;
      const opponentMoves = getAllLegalMoves(
        color === "white" ? "black" : "white",
        board,
      ).length;
      score += (myMoves - opponentMoves) * 10;
    }

    // Check bonus
    if (difficulty >= 11) {
      if (isKingInCheck(color === "white" ? "black" : "white", board)) {
        score += 50;
      }
      if (isKingInCheck(color, board)) {
        score -= 50;
      }
    }

    return score;
  };

  const minimax = (board, depth, alpha, beta, maximizingPlayer, color) => {
    if (depth === 0) {
      return evaluateBoard(board, color, depth);
    }

    const currentColor = maximizingPlayer
      ? color
      : color === "white"
        ? "black"
        : "white";
    const moves = getAllLegalMoves(currentColor, board);

    if (moves.length === 0) {
      if (isKingInCheck(currentColor, board)) {
        return maximizingPlayer ? -999999 : 999999;
      }
      return 0; // Stalemate
    }

    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = board.map((row) => [...row]);
        newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
        newBoard[move.from[0]][move.from[1]] = null;

        const evaluation = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false,
          color,
        );
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = board.map((row) => [...row]);
        newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
        newBoard[move.from[0]][move.from[1]] = null;

        const evaluation = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true,
          color,
        );
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const getAIMove = (board, color, difficulty) => {
    const moves = getAllLegalMoves(color, board);
    if (moves.length === 0) return null;

    // Easy levels (1-5): Random moves with occasional good moves
    if (difficulty <= 5) {
      const randomChance = 100 - difficulty * 15; // 85% to 25% random
      if (Math.random() * 100 < randomChance) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }

    // Evaluate all moves
    let bestMove = null;
    let bestScore = -Infinity;

    // Determine search depth based on difficulty
    let searchDepth = 1;
    if (difficulty >= 6 && difficulty <= 10) searchDepth = 2; // Average

    for (const move of moves) {
      const newBoard = board.map((row) => [...row]);
      newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
      newBoard[move.from[0]][move.from[1]] = null;

      const score = minimax(
        newBoard,
        searchDepth,
        -Infinity,
        Infinity,
        false,
        color,
      );

      // Add randomness for lower difficulties
      const randomFactor = (11 - Math.min(difficulty, 10)) * 50;
      const adjustedScore = score + (Math.random() - 0.5) * randomFactor;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestMove = move;
      }
    }

    return bestMove || moves[0];
  };

  const makeAIMove = useCallback(async () => {
    if (currentPlayer === playerColor || gameStatus !== "playing") return;

    setIsThinking(true);

    // Simulate thinking time
    const thinkingTime = 300 + difficulty * 50;
    await new Promise((resolve) => setTimeout(resolve, thinkingTime));

    const aiMove = getAIMove(board, currentPlayer, difficulty);

    if (aiMove) {
      const newBoard = board.map((row) => [...row]);
      const movingPiece = newBoard[aiMove.from[0]][aiMove.from[1]];
      const capturedPiece = newBoard[aiMove.to[0]][aiMove.to[1]];

      newBoard[aiMove.to[0]][aiMove.to[1]] = movingPiece;
      newBoard[aiMove.from[0]][aiMove.from[1]] = null;

      if (capturedPiece) {
        const capturedColor = getPieceColor(capturedPiece);
        setCapturedPieces((prev) => ({
          ...prev,
          [capturedColor]: [...prev[capturedColor], capturedPiece],
        }));
      }

      setBoard(newBoard);
      setMoveHistory((prev) => [
        ...prev,
        { from: aiMove.from, to: aiMove.to, piece: movingPiece },
      ]);

      const nextPlayer = currentPlayer === "white" ? "black" : "white";
      setCurrentPlayer(nextPlayer);

      const inCheck = isKingInCheck(nextPlayer, newBoard);
      setKingInCheck(inCheck ? nextPlayer : null);

      if (inCheck && !hasLegalMoves(nextPlayer, newBoard)) {
        setGameStatus(`checkmate-${currentPlayer}`);
      } else if (!inCheck && !hasLegalMoves(nextPlayer, newBoard)) {
        setGameStatus("stalemate");
      }
    }

    setIsThinking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, playerColor, gameStatus, board, difficulty]);

  useEffect(() => {
    if (
      gameMode === "playing" &&
      currentPlayer !== playerColor &&
      gameStatus === "playing"
    ) {
      setTimeout(() => {
        makeAIMove();
      }, 0);
    }
  }, [currentPlayer, gameMode, playerColor, gameStatus, makeAIMove]);

  const calculatePossibleMoves = (row, col) => {
    const moves = [];
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(row, col, toRow, toCol, board)) {
          moves.push([toRow, toCol]);
        }
      }
    }
    return moves;
  };

  const handleSquareClick = (row, col) => {
    if (gameStatus !== "playing" || currentPlayer !== playerColor || isThinking)
      return;

    const clickedPiece = board[row][col];

    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const isPossibleMove = possibleMoves.some(
        ([r, c]) => r === row && c === col,
      );

      if (isPossibleMove) {
        const newBoard = board.map((r) => [...r]);
        const movingPiece = newBoard[selectedRow][selectedCol];
        const capturedPiece = newBoard[row][col];

        newBoard[row][col] = movingPiece;
        newBoard[selectedRow][selectedCol] = null;

        if (capturedPiece) {
          const capturedColor = getPieceColor(capturedPiece);
          setCapturedPieces((prev) => ({
            ...prev,
            [capturedColor]: [...prev[capturedColor], capturedPiece],
          }));
        }

        setBoard(newBoard);
        setMoveHistory((prev) => [
          ...prev,
          {
            from: [selectedRow, selectedCol],
            to: [row, col],
            piece: movingPiece,
          },
        ]);

        const nextPlayer = currentPlayer === "white" ? "black" : "white";
        setCurrentPlayer(nextPlayer);

        const inCheck = isKingInCheck(nextPlayer, newBoard);
        setKingInCheck(inCheck ? nextPlayer : null);

        if (inCheck && !hasLegalMoves(nextPlayer, newBoard)) {
          setGameStatus(`checkmate-${currentPlayer}`);
        } else if (!inCheck && !hasLegalMoves(nextPlayer, newBoard)) {
          setGameStatus("stalemate");
        }

        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (
        clickedPiece &&
        getPieceColor(clickedPiece) === currentPlayer
      ) {
        setSelectedSquare([row, col]);
        setPossibleMoves(calculatePossibleMoves(row, col));
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else if (clickedPiece && getPieceColor(clickedPiece) === currentPlayer) {
      setSelectedSquare([row, col]);
      setPossibleMoves(calculatePossibleMoves(row, col));
    }
  };

  const startGame = (color, level) => {
    setPlayerColor(color);
    setDifficulty(level);
    setBoard(initialBoard);
    setSelectedSquare(null);
    setCurrentPlayer("white");
    setPossibleMoves([]);
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
    setKingInCheck(null);
    setGameStatus("playing");
    setGameMode("playing");
  };

  const resetGame = () => {
    setGameMode("menu");
    setPlayerColor(null);
    setBoard(initialBoard);
    setSelectedSquare(null);
    setCurrentPlayer("white");
    setPossibleMoves([]);
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
    setKingInCheck(null);
    setGameStatus("playing");
  };

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? "light" : "dark";
  };

  const getDifficultyLabel = (level) => {
    if (level <= 5) return { category: "Easy", color: "#4ade80" };
    return { category: "Average", color: "#fbbf24" };
  };

  if (gameMode === "menu") {
    return (
      <div
        className="menu-wrapper"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Cinzel', serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }

          .menu-container {
            animation: fadeInUp 0.8s ease;
          }

          .color-button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .color-button:hover {
            transform: translateY(-4px) scale(1.02);
          }

          .difficulty-button {
            transition: all 0.2s ease;
          }

          .difficulty-button:hover {
            transform: scale(1.05);
          }

          @media (max-width: 768px) {
            body {
              overflow-x: hidden;
            }

            .menu-container {
              padding: 20px !important;
              margin: 10px !important;
              max-width: 100% !important;
              border-radius: 16px !important;
            }

            .menu-container h1 {
              font-size: 36px !important;
              letter-spacing: 1px !important;
              margin-bottom: 4px !important;
            }

            .menu-container > div:first-of-type {
              margin-bottom: 20px !important;
            }

            .menu-container .color-button {
              padding: 24px 16px !important;
              min-height: auto !important;
            }

            .menu-container .color-button span:first-child {
              font-size: 48px !important;
            }

            .menu-container .color-button span:last-child {
              font-size: 16px !important;
            }
          }
        `}</style>

        <div
          className="menu-container"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "48px",
            border: "2px solid rgba(255, 215, 0, 0.3)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "56px",
                fontWeight: "700",
                margin: "0 0 8px 0",
                background:
                  "linear-gradient(135deg, #ffd700 0%, #fff 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "2px",
              }}
            >
              ROYAL CHESS
            </h1>
            <div
              style={{
                fontSize: "16px",
                color: "#a0a0a0",
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: "300",
                letterSpacing: "3px",
              }}
            >
              THE GAME OF KINGS
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                color: "#ffd700",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <User size={20} />
              Choose Your Color
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <button
                className="color-button"
                onClick={() => {
                  const tempColor = "white";
                  document.getElementById("difficulty-section").style.display =
                    "block";
                  document.getElementById("selected-color").textContent =
                    "White";
                  document.querySelectorAll(".color-button").forEach((btn) => {
                    btn.style.opacity = "0.5";
                  });
                  document.querySelectorAll(".color-button")[0].style.opacity =
                    "1";
                  document.querySelectorAll(".color-button")[0].style.border =
                    "3px solid #ffd700";
                  setPlayerColor(tempColor);
                }}
                style={{
                  padding: "32px",
                  background:
                    "linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                }}
              >
                <span style={{ fontSize: "64px" }}>♔</span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#1a1a2e",
                  }}
                >
                  White
                </span>
              </button>

              <button
                className="color-button"
                onClick={() => {
                  const tempColor = "black";
                  document.getElementById("difficulty-section").style.display =
                    "block";
                  document.getElementById("selected-color").textContent =
                    "Black";
                  document.querySelectorAll(".color-button").forEach((btn) => {
                    btn.style.opacity = "0.5";
                  });
                  document.querySelectorAll(".color-button")[1].style.opacity =
                    "1";
                  document.querySelectorAll(".color-button")[1].style.border =
                    "3px solid #ffd700";
                  setPlayerColor(tempColor);
                }}
                style={{
                  padding: "32px",
                  background:
                    "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                }}
              >
                <span style={{ fontSize: "64px" }}>♚</span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  Black
                </span>
              </button>
            </div>
          </div>

          <div id="difficulty-section" style={{ display: "none" }}>
            <div
              style={{
                color: "#ffd700",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Cpu size={20} />
              Select Difficulty
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#ffffff", fontSize: "16px" }}>
                  Level {difficulty}
                </span>
                <span
                  style={{
                    color: getDifficultyLabel(difficulty).color,
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {getDifficultyLabel(difficulty).category}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  outline: "none",
                  background: `linear-gradient(to right, 
                    #4ade80 0%, 
                    #4ade80 50%, 
                    #fbbf24 50%, 
                    #fbbf24 100%)`,
                  cursor: "pointer",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#888",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                <span>Easy (1-5)</span>
                <span>Average (6-10)</span>
              </div>
            </div>

            <button
              onClick={() => startGame(playerColor, difficulty)}
              style={{
                width: "100%",
                padding: "20px",
                background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                border: "none",
                borderRadius: "12px",
                fontSize: "20px",
                fontWeight: "700",
                color: "#1a1a2e",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 6px 24px rgba(255, 215, 0, 0.4)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 32px rgba(255, 215, 0, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 6px 24px rgba(255, 215, 0, 0.4)";
              }}
            >
              Start Game as <span id="selected-color">White</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="game-wrapper"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Cinzel', serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
        }

        @keyframes thinking {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .chess-square {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }

        .chess-square:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
        }

        .chess-piece {
          transition: all 0.2s ease;
          font-size: 48px;
          user-select: none;
        }

        .possible-move {
          animation: pulse 2s ease-in-out infinite;
        }

        .captured-piece {
          animation: fadeInUp 0.5s ease;
        }

        .game-container {
          animation: fadeInUp 0.8s ease;
        }

        .status-banner {
          background: linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,215,0,0.2), rgba(255,215,0,0.1));
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        .thinking-indicator {
          animation: thinking 1.5s ease-in-out infinite;
        }

        @media (max-width: 900px) {
          .game-container {
            flex-direction: column !important;
            align-items: center !important;
            gap: 16px !important;
            padding: 10px !important;
          }

          .game-wrapper {
            padding: 10px !important;
          }

          .menu-wrapper {
            padding: 10px !important;
          }

          .game-container > div {
            width: 100% !important;
            max-width: 100% !important;
          }

          .game-container > div:first-child {
            flex: 0 0 auto !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
            width: 100% !important;
          }

          .game-container h1 {
            font-size: 32px !important;
            margin: 0 !important;
          }

          .status-banner {
            text-align: center !important;
            padding: 12px !important;
            font-size: 16px !important;
          }

          .chess-board-container {
            padding: 12px !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: auto !important;
          }

          .chess-board {
            width: 100% !important;
            max-width: min(90vw, 400px) !important;
            margin: 0 auto !important;
          }

          .chess-piece {
            font-size: 32px !important;
          }

          .chess-square {
            min-height: 40px !important;
            min-width: 40px !important;
          }
        }

        @media (max-width: 500px) {
          .game-container h1 {
            font-size: 24px !important;
          }

          .game-container > div > div {
            padding: 12px !important;
          }

          .chess-piece {
            font-size: 28px !important;
          }

          .status-banner div {
            font-size: 14px !important;
          }
        }
      `}</style>

      <div
        className="game-container"
        style={{
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
          maxWidth: "1400px",
          width: "100%",
        }}
      >
        {/* Left Panel - Captured Pieces & Info */}
        <div
          style={{
            flex: "0 0 200px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                color: "#ffd700",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              <Settings size={20} />
              <span>Game Info</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "14px",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              <div style={{ color: "#ffffff" }}>
                <span style={{ color: "#888" }}>You: </span>
                <span>{playerColor === "white" ? "⚪ White" : "⚫ Black"}</span>
              </div>
              <div style={{ color: "#ffffff" }}>
                <span style={{ color: "#888" }}>AI: </span>
                <span style={{ color: getDifficultyLabel(difficulty).color }}>
                  Level {difficulty} ({getDifficultyLabel(difficulty).category})
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                color: "#ffd700",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              <Crown size={20} />
              <span>Captured</span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                Black
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  minHeight: "40px",
                }}
              >
                {capturedPieces.black.map((piece, i) => (
                  <span
                    key={i}
                    className="captured-piece"
                    style={{ fontSize: "24px" }}
                  >
                    {piece}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                White
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  minHeight: "40px",
                }}
              >
                {capturedPieces.white.map((piece, i) => (
                  <span
                    key={i}
                    className="captured-piece"
                    style={{ fontSize: "24px" }}
                  >
                    {piece}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              border: "none",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1a1a2e",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 20px rgba(255, 215, 0, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 25px rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(255, 215, 0, 0.3)";
            }}
          >
            <RotateCcw size={18} />
            New Game
          </button>
        </div>

        {/* Center - Chess Board */}
        <div
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              color: "#ffffff",
              marginBottom: "10px",
            }}
          >
            <h1
              style={{
                fontSize: "56px",
                fontWeight: "700",
                margin: "0 0 8px 0",
                background:
                  "linear-gradient(135deg, #ffd700 0%, #fff 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "2px",
              }}
            >
              ROYAL CHESS
            </h1>
            <div
              style={{
                fontSize: "16px",
                color: "#a0a0a0",
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: "300",
                letterSpacing: "3px",
              }}
            >
              THE GAME OF KINGS
            </div>
          </div>

          {/* Status Banner */}
          {isThinking ? (
            <div
              className="thinking-indicator"
              style={{
                background: "rgba(100, 100, 255, 0.2)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                border: "1px solid rgba(100, 100, 255, 0.3)",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Cpu size={20} />
                AI is thinking...
              </div>
            </div>
          ) : gameStatus !== "playing" ? (
            <div
              className="status-banner"
              style={{
                background: gameStatus.includes("checkmate")
                  ? "linear-gradient(135deg, rgba(255, 50, 50, 0.2), rgba(255, 100, 100, 0.3))"
                  : "linear-gradient(135deg, rgba(100, 100, 255, 0.2), rgba(150, 150, 255, 0.3))",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                animation: "glow 2s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
              >
                {gameStatus === "stalemate" ? "Stalemate!" : `Checkmate!`}
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "18px",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {gameStatus === "stalemate"
                  ? "The game is drawn"
                  : gameStatus.split("-")[1] === playerColor
                    ? "You win!"
                    : "AI wins!"}
              </div>
            </div>
          ) : kingInCheck ? (
            <div
              className="status-banner"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.3))",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                animation: "glow 2s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  color: "#ffd700",
                  fontSize: "20px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Flag size={20} />
                Check! {kingInCheck === playerColor ? "Your" : "AI's"} king in
                danger
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {currentPlayer === playerColor ? "🎮 Your Turn" : "🤖 AI Turn"}
              </div>
            </div>
          )}

          {/* Chess Board */}
          <div
            className="chess-board-container"
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(10px)",
              padding: "24px",
              borderRadius: "20px",
              border: "2px solid rgba(255, 215, 0, 0.3)",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(255, 215, 0, 0.1)",
            }}
          >
            <div
              className="chess-board"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: "2px",
                background: "#1a1a1a",
                padding: "2px",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isSelected =
                    selectedSquare &&
                    selectedSquare[0] === rowIndex &&
                    selectedSquare[1] === colIndex;
                  const isPossibleMove = possibleMoves.some(
                    ([r, c]) => r === rowIndex && c === colIndex,
                  );
                  const squareColor = getSquareColor(rowIndex, colIndex);
                  const isKingSquare =
                    kingInCheck &&
                    piece &&
                    ((kingInCheck === "white" && piece === "♔") ||
                      (kingInCheck === "black" && piece === "♚"));

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="chess-square"
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isSelected
                          ? "linear-gradient(135deg, #ffd700, #ffed4e)"
                          : isPossibleMove
                            ? "radial-gradient(circle, rgba(100, 255, 100, 0.4), transparent)"
                            : isKingSquare
                              ? "radial-gradient(circle, rgba(255, 50, 50, 0.5), transparent)"
                              : squareColor === "light"
                                ? "linear-gradient(135deg, #f0d9b5 0%, #e8d0a8 100%)"
                                : "linear-gradient(135deg, #b58863 0%, #9d7452 100%)",
                        position: "relative",
                        minWidth: "60px",
                        minHeight: "60px",
                        opacity:
                          isThinking && currentPlayer !== playerColor ? 0.7 : 1,
                      }}
                    >
                      {isPossibleMove && !piece && (
                        <div
                          className="possible-move"
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "rgba(50, 205, 50, 0.6)",
                            border: "2px solid rgba(50, 205, 50, 0.8)",
                          }}
                        />
                      )}
                      {piece && (
                        <span
                          className="chess-piece"
                          style={{
                            filter: isSelected
                              ? "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                              : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                            transform: isSelected ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {piece}
                        </span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Move History */}
        <div
          style={{
            flex: "0 0 200px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            maxHeight: "600px",
            overflow: "auto",
          }}
        >
          <div
            style={{
              color: "#ffd700",
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Move History
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {moveHistory.length === 0 ? (
              <div
                style={{
                  color: "#888",
                  fontSize: "14px",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                No moves yet
              </div>
            ) : (
              moveHistory.map((move, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#ffffff",
                    fontFamily: "'Cormorant Garamond', serif",
                    animation: "fadeInUp 0.3s ease",
                  }}
                >
                  <span style={{ color: "#ffd700", marginRight: "8px" }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: "16px" }}>{move.piece}</span>
                  <span
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      marginLeft: "4px",
                    }}
                  >
                    {String.fromCharCode(97 + move.from[1])}
                    {8 - move.from[0]} → {String.fromCharCode(97 + move.to[1])}
                    {8 - move.to[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
