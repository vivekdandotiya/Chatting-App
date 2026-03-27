import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ users }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  const filteredUsers = users?.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="w-full max-w-2xl h-screen bg-white flex flex-col border-r border-gray-200">
      {/* HEADER */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Messages</h1>
        
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 pt-4 pb-3 flex gap-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("chats")}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "chats"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Chats
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "favorites"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Favorites
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "groups"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Groups
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" && (
          <div className="p-3">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 px-5 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-blue-500"
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
                <p className="text-gray-700 text-sm font-semibold">No chats found</p>
                <p className="text-gray-500 text-xs mt-2">
                  {searchQuery ? "Try a different search" : "Start a conversation"}
                </p>
              </div>
            ) : (
              <>
                {/* RECENT SECTION */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-2 mb-3">
                    Recent
                  </h3>
                  {filteredUsers.slice(0, 3).map((u) => (
                    <div
                      key={u._id}
                      onMouseEnter={() => setHoveredId(u._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => navigate(`/chat/${u._id}`)}
                      className="flex items-center gap-3 p-3 m-1 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 active:bg-gray-200 group"
                    >
                      {/* AVATAR WITH 3D EFFECT */}
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md transition-all duration-300 ${
                            hoveredId === u._id
                              ? "scale-110 shadow-xl"
                              : "scale-100"
                          }`}
                        >
                          <span className="text-white font-semibold text-xl">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        {hoveredId === u._id && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300 to-transparent opacity-30 animate-pulse"></div>
                        )}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* USER INFO */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
                          {u.name}
                        </h3>
                        <p className="text-gray-500 text-xs truncate">
                          Active now
                        </p>
                      </div>

                      {/* 3D ANIMATED ELEMENT */}
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div
                          className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                            hoveredId === u._id ? "scale-110" : "scale-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 transition-all duration-300 ${
                              hoveredId === u._id
                                ? "text-blue-600 translate-x-1"
                                : "text-gray-300"
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
                        {hoveredId === u._id && (
                          <div className="absolute inset-0 rounded-full bg-blue-100 -z-10 scale-150"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ALL CHATS SECTION */}
                {filteredUsers.length > 3 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-2 mb-3">
                      All Chats
                    </h3>
                    {filteredUsers.slice(3).map((u) => (
                      <div
                        key={u._id}
                        onMouseEnter={() => setHoveredId(u._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => navigate(`/chat/${u._id}`)}
                        className="flex items-center gap-3 p-3 m-1 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-lg">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-sm truncate">
                            {u.name}
                          </h3>
                          <p className="text-gray-500 text-xs truncate">
                            Offline
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-300 flex-shrink-0"
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
          <div className="flex flex-col items-center justify-center h-64 px-5 text-center p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold">No favorites yet</p>
            <p className="text-gray-500 text-sm mt-2">Star conversations to add them here</p>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="flex flex-col items-center justify-center h-64 px-5 text-center p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold">No groups yet</p>
            <p className="text-gray-500 text-sm mt-2">Create or join group chats</p>
          </div>
        )}
      </div>

      {/* ANIMATED 3D CARD - BOTTOM */}
      <div className="px-6 py-5 border-t border-gray-100">
        <div className="relative h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg">
          {/* ANIMATED BACKGROUND */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 animate-pulse animation-delay-2000"></div>
          </div>

          {/* CONTENT */}
          <div className="relative h-full flex items-center justify-between px-5">
            <div className="flex-1">
              <p className="text-white text-xs font-semibold opacity-90">
                Active now
              </p>
              <p className="text-white text-base font-bold">
                {filteredUsers.length} people online
              </p>
            </div>

            {/* 3D FLOATING ELEMENT */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-600 font-medium">Total</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {filteredUsers.length}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
            <p className="text-xs text-blue-600 font-medium">Online</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{Math.floor(filteredUsers.length * 0.7)}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
            <p className="text-xs text-purple-600 font-medium">Offline</p>
            <p className="text-lg font-bold text-purple-700 mt-1">{Math.ceil(filteredUsers.length * 0.3)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;