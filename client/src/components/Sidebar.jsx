import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ users, unread, setUnread }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  const filteredUsers = users?.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getAvatarColor = (index) => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-blue-500",
      "from-rose-500 to-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full h-[100dvh] max-w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col overflow-hidden relative">
      {/* ANIMATED BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-10 px-4 pt-4 pb-3 border-b border-slate-700/50 backdrop-blur-sm flex-shrink-0">
        <h1 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight">
          Messages
        </h1>

        {/* SEARCH BAR */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-300"></div>
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-blue-400 transition"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 md:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm md:text-base text-white placeholder-slate-400 focus:outline-none focus:bg-slate-800 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="relative z-10 px-3 pt-2 pb-1.5 flex gap-2 border-b border-slate-700/50 overflow-x-auto scrollbar-hide flex-shrink-0">
        {["chats", "favorites", "groups"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-300 ${
              activeTab === tab
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-300 hover:text-white hover:bg-slate-800/30"
            }`}
          >
            {tab === "chats" && "All"}
            {tab === "favorites" && "⭐"}
            {tab === "groups" && "👥"}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {activeTab === "chats" && (
          <div className="p-2 md:p-3">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 px-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-4 relative group">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z"
                    />
                  </svg>
                </div>
                <p className="text-slate-200 text-sm font-semibold">No chats</p>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Try different search" : "Start chatting"}
                </p>
              </div>
            ) : (
              <>
                {/* RECENT SECTION */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                    Recent
                  </h3>
                  {filteredUsers.slice(0, 3).map((u, idx) => (
                    <div
                      key={u._id}
                      onMouseEnter={() => setHoveredId(u._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => {
                        navigate(`/chat/${u._id}`);
                        setUnread((prev) => ({
                          ...prev,
                          [u._id]: 0,
                        }));
                      }}
                      className="group relative mx-1 mb-1.5 px-2.5 py-2.5 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 cursor-pointer transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50 backdrop-blur-sm active:scale-95 md:active:scale-100"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* AVATAR */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-11 h-11 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${getAvatarColor(
                              idx
                            )} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                              hoveredId === u._id ? "scale-110" : "scale-100"
                            }`}
                          >
                            <span className="text-white font-bold text-base md:text-lg">
                              {u.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 shadow-lg"></div>
                        </div>

                        {/* USER INFO */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm md:text-base truncate group-hover:text-blue-400 transition">
                            {u.name}
                          </h3>
                          <p className="text-slate-400 text-xs truncate">
                            Active
                          </p>
                        </div>

                        {/* UNREAD BADGE */}
                        {unread && unread[u._id] > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                            {unread[u._id] > 9 ? "9+" : unread[u._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ALL CHATS SECTION */}
                {filteredUsers.length > 3 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                      All Chats
                    </h3>
                    {filteredUsers.slice(3).map((u, idx) => (
                      <div
                        key={u._id}
                        onMouseEnter={() => setHoveredId(u._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => {
                          navigate(`/chat/${u._id}`);
                          setUnread((prev) => ({
                            ...prev,
                            [u._id]: 0,
                          }));
                        }}
                        className="group relative mx-1 mb-1.5 px-2.5 py-2.5 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 cursor-pointer transition-all duration-300 border border-slate-700/20 hover:border-slate-600/30 backdrop-blur-sm active:scale-95 md:active:scale-100"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* AVATAR */}
                          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-200 font-semibold text-sm">
                              {u.name?.[0]?.toUpperCase()}
                            </span>
                          </div>

                          {/* USER INFO */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-200 font-semibold text-sm truncate">
                              {u.name}
                            </h3>
                            <p className="text-slate-500 text-xs truncate">
                              Offline
                            </p>
                          </div>

                          {/* UNREAD BADGE */}
                          {unread && unread[u._id] > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                              {unread[u._id] > 9 ? "9+" : unread[u._id]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="flex flex-col items-center justify-center h-96 px-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-slate-200 font-semibold text-sm">No favorites</p>
            <p className="text-slate-400 text-xs mt-1">Star to add</p>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="flex flex-col items-center justify-center h-96 px-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <p className="text-slate-200 font-semibold text-sm">No groups</p>
            <p className="text-slate-400 text-xs mt-1">Create or join</p>
          </div>
        )}
      </div>

      {/* STATS FOOTER */}
      <div className="relative z-10 px-3 py-3 md:py-4 border-t border-slate-700/50 backdrop-blur-sm bg-gradient-to-t from-slate-950/50 to-transparent flex-shrink-0">
        {/* ONLINE STATUS CARD */}
        <div className="relative mb-2.5 p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 backdrop-blur-sm overflow-hidden group">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase">Online</p>
              <p className="text-white text-base md:text-lg font-bold mt-0.5">
                {filteredUsers.length}
              </p>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center animate-pulse shadow-lg flex-shrink-0">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-2 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center hover:bg-slate-800/70 transition">
            <p className="text-slate-400 text-xs font-medium">Total</p>
            <p className="text-white text-lg md:text-xl font-bold mt-1">
              {filteredUsers.length}
            </p>
          </div>
          <div className="p-2 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center hover:bg-slate-800/70 transition">
            <p className="text-blue-400 text-xs font-medium">Online</p>
            <p className="text-blue-300 text-lg md:text-xl font-bold mt-1">
              {Math.floor(filteredUsers.length * 0.7)}
            </p>
          </div>
          <div className="p-2 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center hover:bg-slate-800/70 transition">
            <p className="text-slate-400 text-xs font-medium">Offline</p>
            <p className="text-slate-300 text-lg md:text-xl font-bold mt-1">
              {Math.ceil(filteredUsers.length * 0.3)}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        * {
          -webkit-user-select: text;
          -moz-user-select: text;
          user-select: text;
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background-color: rgb(51, 65, 85);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;