import React, { useState, useEffect, useRef } from "react";

export default function CarRacing() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem("racing_high") || "0"));
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Game states held in refs to allow canvas loop to read them immediately
  const keysRef = useRef({ Left: false, Right: false });
  const playerRef = useRef({ x: 145, y: 380, width: 30, height: 55, targetX: 145 });
  const obstaclesRef = useRef([]);
  const coinsRef = useRef([]);
  const roadOffsetRef = useRef(0);
  const gameSpeedRef = useRef(4);
  const distanceRef = useRef(0);

  const initGame = () => {
    playerRef.current = { x: 145, y: 380, width: 30, height: 55, targetX: 145 };
    obstaclesRef.current = [];
    coinsRef.current = [];
    roadOffsetRef.current = 0;
    gameSpeedRef.current = 4;
    distanceRef.current = 0;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  // Steer controls
  const steer = (dir) => {
    if (!gameStarted || gameOver) return;
    const player = playerRef.current;
    if (dir === "left") {
      player.targetX = Math.max(70, player.targetX - 75);
    } else if (dir === "right") {
      player.targetX = Math.min(220, player.targetX + 75);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        steer("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        steer("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver]);

  // Main Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const spawnObstacle = () => {
      const lanes = [70, 145, 220];
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
      
      // Avoid spawning on top of active coins/obstacles
      const tooClose = obstaclesRef.current.some(o => Math.abs(o.y) < 150 && o.x === randomLane) || 
                       coinsRef.current.some(c => Math.abs(c.y) < 150 && c.x === randomLane);
      
      if (!tooClose) {
        obstaclesRef.current.push({
          x: randomLane,
          y: -60,
          width: 30,
          height: 55,
          color: ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b"][Math.floor(Math.random() * 4)]
        });
      }
    };

    const spawnCoin = () => {
      const lanes = [70, 145, 220];
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

      const tooClose = obstaclesRef.current.some(o => Math.abs(o.y) < 100 && o.x === randomLane) || 
                       coinsRef.current.some(c => Math.abs(c.y) < 100 && (c.x - 15) === randomLane);
      
      if (!tooClose) {
        coinsRef.current.push({
          x: randomLane + 15, // center it in lane
          y: -30,
          radius: 8
        });
      }
    };

    const checkCollision = (rect1, rect2) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    const update = () => {
      if (!gameStarted || gameOver) return;

      // Speed progression
      distanceRef.current += 1;
      if (distanceRef.current % 500 === 0) {
        gameSpeedRef.current += 0.5;
      }

      // Smooth player slide movement
      const player = playerRef.current;
      player.x += (player.targetX - player.x) * 0.25;

      // Road offset
      roadOffsetRef.current = (roadOffsetRef.current + gameSpeedRef.current) % 40;

      // Spawn items
      if (Math.random() < 0.012) spawnObstacle();
      if (Math.random() < 0.015) spawnCoin();

      // Move & Update Obstacles
      obstaclesRef.current.forEach((obs, idx) => {
        obs.y += gameSpeedRef.current;
        
        // Player collision
        if (checkCollision(player, obs)) {
          setGameOver(true);
          setGameStarted(false);
          
          // Save highscore
          const finalScore = Math.floor(distanceRef.current / 10) + score;
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem("racing_high", finalScore.toString());
          }
        }
      });
      // Filter out off-screen obstacles
      obstaclesRef.current = obstaclesRef.current.filter(o => o.y < 500);

      // Move & Update Coins
      const remainingCoins = [];
      coinsRef.current.forEach((coin) => {
        coin.y += gameSpeedRef.current;

        // Player coin pickup
        const dist = Math.hypot((player.x + 15) - coin.x, (player.y + 27) - coin.y);
        if (dist < 25) {
          setScore(prev => prev + 50); // collect bonus
        } else if (coin.y < 500) {
          remainingCoins.push(coin);
        }
      });
      coinsRef.current = remainingCoins;
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(0, 0, 320, 480);

      // Draw Road Borders
      ctx.fillStyle = "#3a3a4c";
      ctx.fillRect(50, 0, 10, 480);
      ctx.fillRect(260, 0, 10, 480);

      // Draw Road Surface
      ctx.fillStyle = "#16161a";
      ctx.fillRect(60, 0, 200, 480);

      // Draw Road Dashed Lines
      ctx.strokeStyle = "#555";
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      ctx.lineWidth = 3;

      // Lane dividers
      ctx.beginPath();
      ctx.moveTo(130, 0);
      ctx.lineTo(130, 480);
      ctx.moveTo(200, 0);
      ctx.lineTo(200, 480);
      ctx.stroke();

      // Reset Line Dash
      ctx.setLineDash([]);

      const player = playerRef.current;

      if (gameStarted || gameOver) {
        // Draw Player Car (Sleek Emerald Racing Car)
        // Shadows/Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#10b981";
        ctx.fillStyle = "#10b981";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        ctx.shadowBlur = 0; // reset
        
        // Wheels
        ctx.fillStyle = "#000";
        ctx.fillRect(player.x - 3, player.y + 8, 4, 12);
        ctx.fillRect(player.x + player.width - 1, player.y + 8, 4, 12);
        ctx.fillRect(player.x - 3, player.y + 35, 4, 12);
        ctx.fillRect(player.x + player.width - 1, player.y + 35, 4, 12);
        
        // Cockpit
        ctx.fillStyle = "#022c22";
        ctx.fillRect(player.x + 5, player.y + 18, player.width - 10, 15);
        ctx.fillStyle = "#2dd4bf";
        ctx.fillRect(player.x + 8, player.y + 20, player.width - 16, 10);

        // Draw Obstacles (Other cars)
        obstaclesRef.current.forEach(obs => {
          ctx.fillStyle = obs.color;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          // Wheels
          ctx.fillStyle = "#000";
          ctx.fillRect(obs.x - 3, obs.y + 8, 4, 12);
          ctx.fillRect(obs.x + obs.width - 1, obs.y + 8, 4, 12);
          ctx.fillRect(obs.x - 3, obs.y + 35, 4, 12);
          ctx.fillRect(obs.x + obs.width - 1, obs.y + 35, 4, 12);
        });

        // Draw Coins (Gold spinning circles)
        coinsRef.current.forEach(coin => {
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#fbbf24";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#fbbf24";
          ctx.fill();
          ctx.shadowBlur = 0; // reset
          ctx.closePath();
        });
      } else {
        // Draw splash screen logo/car
        ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
        ctx.fillRect(60, 150, 200, 180);
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver, score, highScore]);

  const finalScoreVal = Math.floor(distanceRef.current / 10) + score;

  return (
    <div className="w-full max-w-sm mx-auto p-4 flex flex-col items-center select-none animate-fadeIn font-sans">
      
      {/* Header Info */}
      <div className="flex justify-between items-center w-full mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent uppercase tracking-tight">Nitro Racer</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Dodge and collect!</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-[#111111] border border-[#2a2a2a] px-3 py-1.5 rounded-xl text-center min-w-[60px]">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Score</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{gameStarted ? finalScoreVal : 0}</p>
          </div>
          <div className="bg-[#111111] border border-[#2a2a2a] px-3 py-1.5 rounded-xl text-center min-w-[60px]">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Best</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Canvas Box */}
      <div className="relative border border-[#2a2a2a] bg-[#16161a] rounded-2xl overflow-hidden shadow-2xl w-full max-w-[320px] aspect-[2/3] flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={480} 
          className="w-full h-full object-contain"
        />

        {/* Start Overlay */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-pulse-glow">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Nitro Racer</h3>
            <p className="text-zinc-500 text-xs mb-8 max-w-[200px] leading-relaxed">Steer left or right to avoid traffic and collect gold coins.</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition"
            >
              Start Engine
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fadeIn">
            <h3 className="text-xl font-black text-red-500 uppercase tracking-wider mb-2">Wrecked!</h3>
            <p className="text-zinc-400 text-sm mb-1">Final Score: <span className="font-extrabold text-white">{finalScoreVal}</span></p>
            <p className="text-zinc-600 text-xs mb-8">Crash collision detected.</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition"
            >
              Drive Again
            </button>
          </div>
        )}
      </div>

      {/* Steering Controller Buttons for Mobile/Mouse */}
      <div className="w-full flex justify-between gap-6 max-w-[260px] mt-4">
        <button
          onClick={() => steer("left")}
          className="flex-1 py-4 rounded-xl bg-[#111111] border border-[#2a2a2a] text-lg font-bold text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
        >
          Steer Left
        </button>
        <button
          onClick={() => steer("right")}
          className="flex-1 py-4 rounded-xl bg-[#111111] border border-[#2a2a2a] text-lg font-bold text-zinc-400 hover:text-white hover:border-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
        >
          Steer Right
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-5 text-center leading-relaxed">
        Use A / D, Left / Right arrow keys, or the steer buttons above to play
      </p>
    </div>
  );
}
