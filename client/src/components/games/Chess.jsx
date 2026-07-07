import React, { useState } from "react";

// Initial board setup
const initialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRow = ["r", "n", "b", "q", "k", "b", "n", "r"];

  // Black pieces
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: "b" };
    board[1][c] = { type: "p", color: "b" };
  }

  // White pieces
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: "p", color: "w" };
    board[7][c] = { type: backRow[c], color: "w" };
  }

  return board;
};

export default function Chess() {
  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState("w"); // "w" | "b"
  const [selected, setSelected] = useState(null); // { r, c }
  const [validMoves, setValidMoves] = useState([]); // Array of { r, c }
  const [gameLog, setGameLog] = useState([]);
  const [winner, setWinner] = useState(null); // null | "w" | "b"

  const getPieceLabel = (type) => {
    switch (type) {
      case "r": return "Rook";
      case "n": return "Knight";
      case "b": return "Bishop";
      case "q": return "Queen";
      case "k": return "King";
      case "p": return "Pawn";
      default: return "";
    }
  };

  const getPieceAbbr = (type) => type.toUpperCase();

  const getValidMoves = (r, c, currentBoard) => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves = [];
    const color = piece.color;
    const opponentColor = color === "w" ? "b" : "w";

    const addMoveIfValid = (nr, nc) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const target = currentBoard[nr][nc];
      if (!target) {
        moves.push({ r: nr, c: nc });
        return true; // continue sliding
      }
      if (target.color === opponentColor) {
        moves.push({ r: nr, c: nc });
      }
      return false; // block slide
    };

    switch (piece.type) {
      case "p": {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;

        // Forward 1
        if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
          moves.push({ r: r + dir, c });
          // Forward 2
          if (r === startRow && !currentBoard[r + dir * 2][c]) {
            moves.push({ r: r + dir * 2, c });
          }
        }
        // Diagonal Captures
        [-1, 1].forEach((dc) => {
          const nc = c + dc;
          const nr = r + dir;
          if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
            const target = currentBoard[nr][nc];
            if (target && target.color === opponentColor) {
              moves.push({ r: nr, c: nc });
            }
          }
        });
        break;
      }
      case "r": {
        // Up, Down, Left, Right
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            const keepGoing = addMoveIfValid(nr, nc);
            if (!keepGoing) break;
            step++;
          }
        });
        break;
      }
      case "b": {
        // Diagonals
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            const keepGoing = addMoveIfValid(nr, nc);
            if (!keepGoing) break;
            step++;
          }
        });
        break;
      }
      case "n": {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          addMoveIfValid(r + dr, c + dc);
        });
        break;
      }
      case "q": {
        // Combined Rook + Bishop
        const dirs = [
          [-1, 0], [1, 0], [0, -1], [0, 1],
          [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            const keepGoing = addMoveIfValid(nr, nc);
            if (!keepGoing) break;
            step++;
          }
        });
        break;
      }
      case "k": {
        const dirs = [
          [-1, 0], [1, 0], [0, -1], [0, 1],
          [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        dirs.forEach(([dr, dc]) => {
          addMoveIfValid(r + dr, c + dc);
        });
        break;
      }
      default:
        break;
    }

    return moves;
  };

  const handleSquareClick = (r, c) => {
    if (winner) return;
    const piece = board[r][c];

    // If a piece is selected and target is a valid move
    if (selected && validMoves.some((m) => m.r === r && m.c === c)) {
      const newBoard = board.map((row) => [...row]);
      const movingPiece = newBoard[selected.r][selected.c];
      const targetPiece = newBoard[r][c];

      // Perform move
      newBoard[r][c] = movingPiece;
      newBoard[selected.r][selected.c] = null;

      // Log movement
      const moveText = `${movingPiece.color === "w" ? "White" : "Black"} ${getPieceLabel(movingPiece.type)}: ${String.fromCharCode(97 + selected.c)}${8 - selected.r} -> ${String.fromCharCode(97 + c)}${8 - r}`;
      setGameLog((prev) => [moveText, ...prev]);

      // Check King Capture
      if (targetPiece && targetPiece.type === "k") {
        setWinner(movingPiece.color);
      }

      setBoard(newBoard);
      setTurn(turn === "w" ? "b" : "w");
      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Select a piece of current turn color
    if (piece && piece.color === turn) {
      setSelected({ r, c });
      setValidMoves(getValidMoves(r, c, board));
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    setBoard(initialBoard());
    setTurn("w");
    setSelected(null);
    setValidMoves([]);
    setGameLog([]);
    setWinner(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col md:flex-row gap-6 animate-fadeIn select-none font-sans justify-center items-center">
      
      {/* Game Board Column */}
      <div className="flex flex-col items-center">
        {/* Turn indicator */}
        <div className="mb-4 flex items-center justify-between w-full max-w-[320px] px-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Turn:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ${
            turn === "w" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
          }`}>
            {turn === "w" ? "White" : "Black"}
          </span>
        </div>

        {/* Board container */}
        <div className="border border-[#2a2a2a] p-1.5 rounded-2xl bg-[#111111] shadow-2xl relative">
          <div className="grid grid-cols-8 gap-0.5 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isSelected = selected && selected.r === r && selected.c === c;
                const isValidTarget = validMoves.some((m) => m.r === r && m.c === c);
                const isDarkSquare = (r + c) % 2 === 1;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative w-full h-full flex items-center justify-center transition-all ${
                      isDarkSquare 
                        ? "bg-[#161616]" 
                        : "bg-[#1d1d1f]"
                    } ${
                      isSelected 
                        ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" 
                        : ""
                    } ${
                      isValidTarget 
                        ? "after:w-3 after:h-3 after:bg-emerald-400 after:rounded-full after:absolute after:opacity-75 hover:bg-emerald-500/10" 
                        : ""
                    }`}
                  >
                    {piece && (
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-black border transition ${
                        piece.color === "w"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                          : "bg-teal-500/10 border-teal-500/30 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]"
                      }`}>
                        {getPieceAbbr(piece.type)}
                      </div>
                    )}

                    {/* Coordinates hint (files/ranks) */}
                    {c === 0 && (
                      <span className="absolute left-0.5 top-0.5 text-[7px] font-bold text-zinc-600 uppercase">
                        {8 - r}
                      </span>
                    )}
                    {r === 7 && (
                      <span className="absolute right-0.5 bottom-0.5 text-[7px] font-bold text-zinc-600 uppercase">
                        {String.fromCharCode(97 + c)}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Winner Overlay */}
          {winner && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-fadeIn z-20">
              <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-wider mb-1">Victory!</h3>
              <p className="text-zinc-300 text-xs mb-6">
                {winner === "w" ? "White" : "Black"} wins by capturing the King!
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        <button
          onClick={resetGame}
          className="w-full max-w-[332px] py-3.5 mt-6 bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition duration-200 active:scale-[0.98]"
        >
          Reset Game
        </button>
      </div>

      {/* Log Column */}
      <div className="flex-1 w-full max-w-[280px] h-[360px] bg-[#111111] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col overflow-hidden">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 border-b border-[#2a2a2a] pb-2">Move Log</h4>
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
          {gameLog.length === 0 ? (
            <p className="text-zinc-600 text-xs italic text-center py-12">No moves registered yet.</p>
          ) : (
            gameLog.map((log, index) => (
              <div key={index} className="text-[11px] font-semibold text-zinc-400 border-b border-[#16161a] pb-1 animate-slideUp">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
