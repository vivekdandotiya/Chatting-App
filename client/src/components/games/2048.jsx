import React, { useState, useEffect, useCallback } from "react";

export default function Game2048() {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(parseInt(localStorage.getItem("2048_best") || "0"));
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const initGame = useCallback(() => {
    let newBoard = Array(16).fill(0);
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const addRandomTile = (currentBoard) => {
    const emptyIndices = currentBoard.map((val, idx) => val === 0 ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return currentBoard;

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[randomIndex] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const getTileColor = (val) => {
    switch (val) {
      case 2: return "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20";
      case 4: return "bg-emerald-900/20 text-emerald-300 border border-emerald-500/30";
      case 8: return "bg-emerald-800/30 text-emerald-200 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]";
      case 16: return "bg-emerald-700/40 text-emerald-100 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
      case 32: return "bg-emerald-600/40 text-white border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
      case 64: return "bg-emerald-500/40 text-white border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)]";
      case 128: return "bg-teal-900/30 text-teal-300 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]";
      case 256: return "bg-teal-800/40 text-teal-200 border border-teal-500/50 shadow-[0_0_18px_rgba(45,212,191,0.3)]";
      case 512: return "bg-teal-700/40 text-teal-100 border border-teal-400/60 shadow-[0_0_20px_rgba(45,212,191,0.4)]";
      case 1024: return "bg-teal-600/40 text-white border border-teal-400/80 shadow-[0_0_22px_rgba(45,212,191,0.5)]";
      case 2048: return "bg-gradient-to-r from-emerald-500 to-teal-400 text-black border border-white/20 shadow-[0_0_30px_rgba(16,185,129,0.6)] font-black";
      default: return "bg-[#111111] text-zinc-500 border border-[#2a2a2a]";
    }
  };

  const slideRowLeft = (row) => {
    let filtered = row.filter(val => val !== 0);
    let newRow = [];
    let addedScore = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        addedScore += mergedVal;
        if (mergedVal === 2048) setGameWon(true);
        i++; // skip next
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }
    return { row: newRow, addedScore };
  };

  const moveLeft = useCallback((currentBoard) => {
    let newBoard = [];
    let totalAddedScore = 0;
    let moved = false;

    for (let i = 0; i < 4; i++) {
      const row = currentBoard.slice(i * 4, i * 4 + 4);
      const res = slideRowLeft(row);
      newBoard = newBoard.concat(res.row);
      totalAddedScore += res.addedScore;
      if (JSON.stringify(row) !== JSON.stringify(res.row)) moved = true;
    }

    return { board: newBoard, score: totalAddedScore, moved };
  }, []);

  const rotateBoard95Right = (currentBoard) => {
    const newBoard = Array(16).fill(0);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        newBoard[c * 4 + (3 - r)] = currentBoard[r * 4 + c];
      }
    }
    return newBoard;
  };

  const rotateBoard90Left = (currentBoard) => {
    let temp = rotateBoard95Right(currentBoard);
    temp = rotateBoard95Right(temp);
    return rotateBoard95Right(temp);
  };

  const move = useCallback((direction) => {
    if (gameOver) return;

    let tempBoard = [...board];
    let rotations = 0;

    // Rotate board to align direction as "Left"
    if (direction === "up") {
      tempBoard = rotateBoard90Left(tempBoard);
      rotations = 1;
    } else if (direction === "right") {
      tempBoard = rotateBoard95Right(tempBoard);
      tempBoard = rotateBoard95Right(tempBoard);
      rotations = 2;
    } else if (direction === "down") {
      tempBoard = rotateBoard95Right(tempBoard);
      rotations = 3;
    }

    const res = moveLeft(tempBoard);

    // Rotate back
    let finalBoard = res.board;
    if (rotations === 1) {
      finalBoard = rotateBoard95Right(finalBoard);
    } else if (rotations === 2) {
      finalBoard = rotateBoard95Right(finalBoard);
      finalBoard = rotateBoard95Right(finalBoard);
    } else if (rotations === 3) {
      finalBoard = rotateBoard90Left(finalBoard);
    }

    if (res.moved) {
      const updatedBoard = addRandomTile(finalBoard);
      setBoard(updatedBoard);
      
      const newScore = score + res.score;
      setScore(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem("2048_best", newScore.toString());
      }

      // Check game over
      checkGameOver(updatedBoard);
    }
  }, [board, gameOver, moveLeft, score, bestScore]);

  const checkGameOver = (currentBoard) => {
    if (currentBoard.includes(0)) return;

    // Try sliding rows left/up/down/right to check for possible moves
    const leftRes = moveLeft(currentBoard);
    
    let tempBoard = rotateBoard90Left(currentBoard);
    const upRes = moveLeft(tempBoard);

    if (!leftRes.moved && !upRes.moved) {
      setGameOver(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        move("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        move("down");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        move("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        move("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <div className="w-full max-w-sm mx-auto p-4 flex flex-col items-center select-none animate-fadeIn font-sans">
      
      {/* Header Info */}
      <div className="flex justify-between items-center w-full mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">2048</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Join the numbers!</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-[#111111] border border-[#2a2a2a] px-4 py-2 rounded-xl text-center min-w-[70px]">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Score</p>
            <p className="text-base font-extrabold text-white mt-0.5">{score}</p>
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] px-4 py-2 rounded-xl text-center min-w-[70px]">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Best</p>
            <p className="text-base font-extrabold text-white mt-0.5">{bestScore}</p>
          </div>
        </div>
      </div>

      {/* Game Grid Container */}
      <div className="relative aspect-square w-full grid grid-cols-4 gap-2 bg-zinc-900/40 p-2 border border-[#2a2a2a] rounded-2xl shadow-2xl mb-6">
        
        {board.map((tile, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-xl flex items-center justify-center text-lg sm:text-2xl font-extrabold transition-all duration-150 ${getTileColor(tile)}`}
          >
            {tile > 0 ? tile : ""}
          </div>
        ))}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-fadeIn z-20">
            <h3 className="text-2xl font-black text-red-500 uppercase tracking-wider mb-2">Game Over</h3>
            <p className="text-zinc-500 text-sm mb-6">No more available merges!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Win Screen */}
        {gameWon && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-fadeIn z-20">
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-wider mb-2">You Win!</h3>
            <p className="text-zinc-500 text-sm mb-6">You reached the 2048 tile!</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setGameWon(false)}
                className="flex-1 py-3 bg-[#161616] border border-[#2a2a2a] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#202022] active:scale-95 transition"
              >
                Keep Playing
              </button>
              <button
                onClick={initGame}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition"
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controller Buttons for Touch Devices */}
      <div className="w-full flex flex-col items-center gap-2 max-w-[200px]">
        <button
          onClick={() => move("up")}
          className="w-12 h-12 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95"
        >
          ▲
        </button>
        <div className="flex justify-between w-full">
          <button
            onClick={() => move("left")}
            className="w-12 h-12 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95"
          >
            ◀
          </button>
          <button
            onClick={initGame}
            className="px-3 rounded-xl bg-[#161616] border border-[#2a2a2a] text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white transition active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={() => move("right")}
            className="w-12 h-12 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => move("down")}
          className="w-12 h-12 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95"
        >
          ▼
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-6 text-center leading-relaxed">
        Use Arrow keys, WASD, or the buttons above to slide tiles
      </p>
    </div>
  );
}
