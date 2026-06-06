import React, { useState, useEffect } from "react";

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState("ai"); // "ai" | "pvp"
  const [aiDifficulty, setAiDifficulty] = useState("hard"); // "easy" | "hard"
  const [score, setScore] = useState({ x: 0, o: 0, ties: 0 });

  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  const calculateWinner = (squares) => {
    for (let i = 0; i < winningLines.length; i++) {
      const [a, b, c] = winningLines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: winningLines[i] };
      }
    }
    if (squares.every(s => s !== null)) return { winner: "tie", line: null };
    return null;
  };

  const gameStatus = calculateWinner(board);

  const handleClick = (index) => {
    if (board[index] || gameStatus) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  // AI Logic
  useEffect(() => {
    if (gameMode !== "ai" || isXNext || gameStatus) return;

    const timeout = setTimeout(() => {
      let targetIndex = -1;

      if (aiDifficulty === "easy") {
        // Random move
        const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      } else {
        // MiniMax algorithm (Hard AI)
        targetIndex = getBestMove(board, "O");
      }

      if (targetIndex !== -1) {
        const newBoard = [...board];
        newBoard[targetIndex] = "O";
        setBoard(newBoard);
        setIsXNext(true);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isXNext, gameMode, board, gameStatus, aiDifficulty]);

  // MiniMax implementation
  const getBestMove = (tempBoard, player) => {
    let bestScore = player === "O" ? -Infinity : Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
      if (tempBoard[i] === null) {
        tempBoard[i] = player;
        let currentScore = minimax(tempBoard, 0, player === "O" ? false : true);
        tempBoard[i] = null;

        if (player === "O") {
          if (currentScore > bestScore) {
            bestScore = currentScore;
            move = i;
          }
        } else {
          if (currentScore < bestScore) {
            bestScore = currentScore;
            move = i;
          }
        }
      }
    }
    return move;
  };

  const minimax = (tempBoard, depth, isMaximizing) => {
    const status = calculateWinner(tempBoard);
    if (status) {
      if (status.winner === "O") return 10 - depth;
      if (status.winner === "X") return depth - 10;
      if (status.winner === "tie") return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = "O";
          bestScore = Math.max(bestScore, minimax(tempBoard, depth + 1, false));
          tempBoard[i] = null;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = "X";
          bestScore = Math.min(bestScore, minimax(tempBoard, depth + 1, true));
          tempBoard[i] = null;
        }
      }
      return bestScore;
    }
  };

  // Score tracking
  useEffect(() => {
    if (!gameStatus) return;
    if (gameStatus.winner === "X") {
      setScore(prev => ({ ...prev, x: prev.x + 1 }));
    } else if (gameStatus.winner === "O") {
      setScore(prev => ({ ...prev, o: prev.o + 1 }));
    } else if (gameStatus.winner === "tie") {
      setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
    }
  }, [gameStatus?.winner]);

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleModeChange = (mode) => {
    setGameMode(mode);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setScore({ x: 0, o: 0, ties: 0 });
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 flex flex-col items-center select-none animate-fadeIn">
      {/* Selector */}
      <div className="flex gap-2 p-1 bg-[#111111] border border-[#2a2a2a] rounded-2xl mb-6 w-full">
        <button
          onClick={() => handleModeChange("ai")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            gameMode === "ai"
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          vs Smart AI
        </button>
        <button
          onClick={() => handleModeChange("pvp")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            gameMode === "pvp"
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          2 Players (Local)
        </button>
      </div>

      {gameMode === "ai" && (
        <div className="flex gap-2 items-center mb-6">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">AI Difficulty:</span>
          {["easy", "hard"].map((diff) => (
            <button
              key={diff}
              onClick={() => setAiDifficulty(diff)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition ${
                aiDifficulty === diff
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-[#2a2a2a] text-zinc-500 hover:text-zinc-300 hover:bg-[#161616]"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      )}

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-3 w-full text-center mb-6">
        <div className="p-3 bg-[#111111] border border-[#2a2a2a] rounded-2xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Player (X)</p>
          <p className="text-xl font-extrabold text-white mt-1">{score.x}</p>
        </div>
        <div className="p-3 bg-[#111111] border border-[#2a2a2a] rounded-2xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ties</p>
          <p className="text-xl font-extrabold text-zinc-400 mt-1">{score.ties}</p>
        </div>
        <div className="p-3 bg-[#111111] border border-[#2a2a2a] rounded-2xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {gameMode === "ai" ? "Varta AI (O)" : "Player (O)"}
          </p>
          <p className="text-xl font-extrabold text-white mt-1">{score.o}</p>
        </div>
      </div>

      {/* Game board */}
      <div className="relative aspect-square w-full max-w-[320px] grid grid-cols-3 gap-2 bg-zinc-900/40 p-2 border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
        {board.map((cell, index) => {
          const isWinningCell = gameStatus?.line?.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={`aspect-square bg-[#111111] rounded-xl flex items-center justify-center text-4xl font-black transition-all duration-300 border border-transparent ${
                cell === null ? "hover:bg-[#161616]/80 hover:border-[#2a2a2a]" : ""
              } ${
                isWinningCell 
                  ? "bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-98" 
                  : ""
              }`}
            >
              {cell === "X" && (
                <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-fadeIn">X</span>
              )}
              {cell === "O" && (
                <span className="text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.3)] animate-fadeIn">O</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Match Status */}
      <div className="h-12 flex items-center justify-center mt-6">
        {gameStatus ? (
          <div className="text-center animate-slideUp">
            {gameStatus.winner === "tie" ? (
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">It's a draw match!</p>
            ) : (
              <p className="text-emerald-400 font-black uppercase tracking-widest text-sm">
                Winner: {gameStatus.winner === "O" && gameMode === "ai" ? "Varta AI" : `Player ${gameStatus.winner}`}!
              </p>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
            Current turn: <span className={isXNext ? "text-emerald-400" : "text-teal-400"}>{isXNext ? "X" : "O"}</span>
          </p>
        )}
      </div>

      {/* Reset Button */}
      {(gameStatus || board.some(s => s !== null)) && (
        <button
          onClick={handleReset}
          className="w-full py-3.5 bg-[#161616] border border-[#2a2a2a] text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1e1e1e] transition duration-200 active:scale-[0.98] mt-2 animate-fadeIn"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
