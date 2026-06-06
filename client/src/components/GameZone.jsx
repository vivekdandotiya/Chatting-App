import React from "react";
import { useNavigate } from "react-router-dom";
import TicTacToe from "./games/TicTacToe";
import Game2048 from "./games/2048";
import CarRacing from "./games/CarRacing";
import Chess from "./games/Chess";

export default function GameZone({ game, onClose }) {
  const navigate = useNavigate();

  const gamesList = [
    {
      id: "chess",
      title: "Tactical Chess",
      desc: "Play classic Chess board game with legal move helpers.",
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      tag: "Board Game"
    },
    {
      id: "racing",
      title: "Nitro Racer",
      desc: "Steer and dodge high-speed traffic in an endless canvas racer.",
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      tag: "Arcade"
    },
    {
      id: "tictactoe",
      title: "Criss Cross",
      desc: "Classic Tic Tac Toe with local 2-player mode and smart AI.",
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      tag: "Casual"
    },
    {
      id: "puzzle",
      title: "2048 Puzzle",
      desc: "Slide, merge numbers, and attempt to reach the legendary 2048 tile.",
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      tag: "Mind Puzzle"
    }
  ];

  const activeGame = game && game !== "list" ? gamesList.find(g => g.id === game) : null;

  const handleSelectGame = (gameId) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("game", gameId);
    navigate(`/chat?${searchParams.toString()}`);
  };

  const handleBackToPicker = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("game", "list");
    navigate(`/chat?${searchParams.toString()}`);
  };

  const renderActiveGame = () => {
    if (!activeGame) return null;
    switch (activeGame.id) {
      case "tictactoe":
        return <TicTacToe />;
      case "puzzle":
        return <Game2048 />;
      case "racing":
        return <CarRacing />;
      case "chess":
        return <Chess />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#0c0c0c] flex flex-col overflow-hidden relative select-none">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-[#202022] flex items-center justify-between bg-[#111111]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {activeGame ? (
            <button
              onClick={handleBackToPicker}
              className="p-2 hover:bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center"
              title="Back to Game List"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center"
              title="Close Games"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}

          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeGame ? activeGame.title : "Game Zone"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              {activeGame ? activeGame.tag : "Play instant games"}
            </p>
          </div>
        </div>

        {activeGame && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#161616] border border-[#2a2a2a] text-zinc-400 hover:text-white rounded-xl transition"
            title="Exit Game Zone"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {activeGame ? (
          <div className="w-full h-full flex items-center justify-center">
            {renderActiveGame()}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            {/* GRID OF GAMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gamesList.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleSelectGame(g.id)}
                  className="group relative cursor-pointer rounded-2xl bg-[#161616] border border-[#2a2a2a] p-6 hover:border-emerald-500/30 hover:bg-[#1c1c1c] transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.04)]"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center group-hover:scale-105 group-hover:border-emerald-500/30 group-hover:bg-gradient-to-tr group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300 shadow-inner">
                      {g.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight">{g.title}</h3>
                      <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mt-0.5">{g.tag}</p>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-6">{g.desc}</p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <span>Play Now</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
