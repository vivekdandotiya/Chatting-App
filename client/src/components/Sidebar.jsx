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

  return (
    <div className="w-full h-screen bg-white dark:bg-[#0f0f0f] flex flex-col border-r border-gray-200 dark:border-gray-800">
      {/* HEADER */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f]">
        <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-3 md:mb-4">
          Messages
        </h1>

        {/* SEARCH BAR */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-full text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-gray-300 dark:focus:border-gray-700 transition-all"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-3 md:px-6 pt-3 md:pt-4 pb-2 md:pb-3 flex gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("chats")}
          className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === "chats"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          All Chats
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === "favorites"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          Favorites
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === "groups"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          Groups
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f0f0f]">
        {activeTab === "chats" && (
          <div className="p-2 md:p-3">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 px-4 md:px-5 text-center">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400"
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
                <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold">
                  No chats found
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                  {searchQuery ? "Try a different search" : "Start a conversation"}
                </p>
              </div>
            ) : (
              <>
                {/* RECENT SECTION */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-3">
                    Recent
                  </h3>
                  {filteredUsers.slice(0, 3).map((u) => (
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
                      className="flex items-center gap-3 p-2 md:p-3 m-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-all duration-200 active:bg-gray-200 dark:active:bg-gray-800 group"
                    >
                      {/* AVATAR WITH 3D EFFECT */}
                      <div className="relative w-12 md:w-14 h-12 md:h-14 flex-shrink-0">
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 flex items-center justify-center shadow-md transition-all duration-300 ${
                            hoveredId === u._id
                              ? "scale-110 shadow-lg"
                              : "scale-100"
                          }`}
                        >
                          <span className="text-white font-semibold text-lg md:text-xl">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        {hoveredId === u._id && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-600 to-transparent opacity-20 animate-pulse"></div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 md:w-4 h-3 md:h-4 bg-green-500 rounded-full border-2 border-white dark:border-black"></div>
                      </div>

                      {/* USER INFO */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white font-semibold text-sm md:text-base truncate group-hover:text-black dark:group-hover:text-gray-200 transition-colors">
                          {u.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                          Active now
                        </p>
                      </div>

                      {unread && unread[u._id] > 0 && (
                        <span className="bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0">
                          {unread[u._id]}
                        </span>
                      )}

                      {/* 3D ANIMATED ELEMENT */}
                      <div className="relative w-8 md:w-10 h-8 md:h-10 flex-shrink-0 hidden md:flex items-center justify-center">
                        <div
                          className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                            hoveredId === u._id ? "scale-110" : "scale-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 transition-all duration-300 ${
                              hoveredId === u._id
                                ? "text-black dark:text-white translate-x-1"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ALL CHATS SECTION */}
                {filteredUsers.length > 3 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-3">
                      All Chats
                    </h3>
                    {filteredUsers.slice(3).map((u) => (
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
                        className="flex items-center gap-3 p-2 md:p-3 m-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-all duration-200"
                      >
                        <div className="w-11 md:w-12 h-11 md:h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-base md:text-lg">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 dark:text-white font-semibold text-sm md:text-base truncate">
                            {u.name}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                            Offline
                          </p>
                        </div>
                        {unread && unread[u._id] > 0 && (
                          <span className="bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0">
                            {unread[u._id]}
                          </span>
                        )}
                        <svg
                          className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 hidden md:block"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="flex flex-col items-center justify-center h-64 px-4 md:px-5 text-center p-6">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-sm md:text-base">
              No favorites yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-2">
              Star conversations to add them here
            </p>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="flex flex-col items-center justify-center h-64 px-4 md:px-5 text-center p-6">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-sm md:text-base">
              No groups yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-2">
              Create or join group chats
            </p>
          </div>
        )}
      </div>

      {/* STATS CARD - BOTTOM */}
      <div className="px-3 md:px-6 py-3 md:py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f]">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-black shadow-lg p-4 md:p-5 mb-3">
          {/* CONTENT */}
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white text-xs font-semibold opacity-80">
                Active now
              </p>
              <p className="text-white text-base md:text-lg font-bold">
                {filteredUsers.length} people online
              </p>
            </div>

            {/* ICON */}
            <div className="relative w-10 md:w-12 h-10 md:h-12 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center animate-bounce">
                <svg
                  className="w-5 md:w-6 h-5 md:h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 md:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Total
            </p>
            <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white mt-1">
              {filteredUsers.length}
            </p>
          </div>
          <div className="p-2 md:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Online
            </p>
            <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white mt-1">
              {Math.floor(filteredUsers.length * 0.7)}
            </p>
          </div>
          <div className="p-2 md:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Offline
            </p>
            <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white mt-1">
              {Math.ceil(filteredUsers.length * 0.3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;