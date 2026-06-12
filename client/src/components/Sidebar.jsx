import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ProfileModal from "./ProfileModal";
import StatusModal from "./StatusModal";
import StatusViewer from "./StatusViewer";

function Sidebar({ users, unread, setUnread, onlineUsers, refreshUsers, socket }) {
  const navigate = useNavigate();
  const { id: activeChatId } = useParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [loadingAction, setLoadingAction] = useState(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeStory, setActiveStory] = useState(null); // Story currently being viewed in StatusViewer
  
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")));
  const [stories, setStories] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Ensure socket joins setup
  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("setup", currentUser._id);
    }
  }, [currentUser]);

  // 🔥 FETCH STORIES
  const fetchStories = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/status?userId=${currentUser._id}`
      );
      setStories(res.data);
    } catch (err) {
      console.error("Stories error:", err);
    }
  };

  useEffect(() => {
    fetchStories();
    if (activeTab === "status") {
      const interval = setInterval(fetchStories, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser?._id, activeTab]);

  // 🔥 SOCKET LISTENERS FOR TYPING & ONLINE LIST
  useEffect(() => {
    if (!socket) return;

    socket.on("typing", ({ sender }) => {
      setTypingUsers((prev) => ({ ...prev, [sender]: true }));
    });

    socket.on("stopTyping", ({ sender }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[sender];
        return copy;
      });
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  const onProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    if (refreshUsers) refreshUsers();
  };

  const filteredUsers = users?.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const friends = filteredUsers.filter(u => u.connectionStatus === "accepted");
  const invites = filteredUsers.filter(u => u.connectionStatus === "pending_received");
  const discover = filteredUsers.filter(u => u.connectionStatus === "none" || u.connectionStatus === "pending_sent" || u.connectionStatus === "rejected");

  const sendInvite = async (receiverId) => {
    try {
      setLoadingAction(receiverId);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/connections/request`, {
        sender: currentUser._id,
        receiver: receiverId
      });
      socket.emit("sendInvite", { sender: currentUser._id, receiver: receiverId });
      if (refreshUsers) refreshUsers();
    } catch (err) {
      console.error(err);
      alert("Invite failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  const respondInvite = async (senderId, action) => {
    try {
      setLoadingAction(senderId);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/connections/respond`, {
        sender: senderId,
        receiver: currentUser._id,
        action
      });
      if (action === "accept") {
        socket.emit("acceptInvite", { sender: senderId, receiver: currentUser._id });
      }
      if (refreshUsers) refreshUsers();
    } catch (err) {
      console.error(err);
      alert("Response failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  const getInitials = (n) => n?.split(" ").map(x => x[0]).join("").toUpperCase() || "?";

  // Check if current user has an active story
  const myStories = stories.find(s => s.user._id === currentUser._id);

  return (
    <div className="w-full h-full max-w-full bg-[#0c0c0c] flex flex-col overflow-hidden border-r border-[#202022] font-sans relative">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-5 border-b border-[#202022] flex-shrink-0 bg-[#0c0c0c] z-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Chats</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
          </h1>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 rounded-full border border-[#2a2a2a] overflow-hidden bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 flex items-center justify-center hover:scale-105 hover:border-emerald-500/50 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-extrabold text-emerald-400">{getInitials(currentUser?.name)}</span>
            )}
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 pt-4 flex gap-2 border-b border-[#202022] overflow-x-auto scrollbar-hide flex-shrink-0 pb-4 bg-[#0c0c0c]">
        {[
          { id: "chats", label: `Chats`, count: friends.length },
          { id: "status", label: "Status", count: stories.length },
          { id: "invites", label: "Invites", count: invites.length },
          { id: "discover", label: "Discover", count: 0 },
          { id: "games", label: "Games", count: 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "games") {
                navigate("/chat");
              }
            }}
            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300 flex-shrink-0 border flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#161616]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === tab.id ? "bg-emerald-400 text-black" : "bg-[#2a2a2a] text-zinc-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div className="animate-fadeIn">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-500 text-sm text-center px-8">
                <div className="w-16 h-16 bg-[#161616] rounded-2xl flex items-center justify-center mb-4 border border-[#2a2a2a] shadow-inner">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mb-1">Silence is golden</p>
                <p className="text-zinc-600 font-medium text-xs">No active connections yet. Head to Discover to find someone to chat with!</p>
              </div>
            ) : (
              friends.map((u) => {
                const isActiveChat = activeChatId === u._id;
                const isTyping = typingUsers[u._id];

                return (
                  <div
                    key={u._id}
                    onClick={() => {
                      navigate(`/chat/${u._id}`);
                      setUnread((prev) => ({ ...prev, [u._id]: 0 }));
                    }}
                    className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      isActiveChat 
                        ? "bg-[#161616] border-[#2a2a2a] shadow-xl" 
                        : "hover:bg-[#161616]/40 border-transparent hover:border-[#2a2a2a]/30"
                    } mb-2 group`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0 border border-[#2a2a2a] overflow-hidden group-hover:scale-102 transition-transform">
                        {u.profilePic ? (
                          <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-400 font-extrabold text-base">{getInitials(u.name)}</span>
                        )}
                      </div>
                      {onlineUsers?.[u._id] && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-[#0c0c0c] rounded-full shadow-lg"
                             style={{ boxShadow: "0 0 10px rgba(16,185,129,0.4)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold text-[14.5px] truncate tracking-tight group-hover:text-emerald-400 transition-colors">{u.name}</h3>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${onlineUsers?.[u._id] ? "text-emerald-400" : "text-zinc-600"}`}>
                          {onlineUsers?.[u._id] ? "Online" : "Offline"}
                        </span>
                      </div>
                      {isTyping ? (
                        <p className="text-emerald-400 text-xs truncate font-bold animate-pulse">typing...</p>
                      ) : (
                        <p className="text-zinc-500 text-xs truncate font-medium">Click to open chat</p>
                      )}
                    </div>
                    {unread && unread[u._id] > 0 && (
                      <span className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse">
                        {unread[u._id]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* STATUS TAB */}
        {activeTab === "status" && (
          <div className="animate-fadeIn space-y-4">
            
            {/* SELF STATUS */}
            <div className="p-3 bg-[#111111] rounded-2xl border border-[#2a2a2a] shadow-md">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">My Status</h4>
              <div 
                onClick={() => {
                  if (myStories) {
                    setActiveStory(myStories);
                  } else {
                    setIsStatusModalOpen(true);
                  }
                }}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#161616] cursor-pointer transition-all duration-300"
              >
                <div className="relative">
                  <div 
                    className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900 border-2 ${
                      myStories ? "border-emerald-500 p-0.5" : "border-[#2a2a2a]"
                    }`}
                  >
                    {currentUser?.profilePic ? (
                      <img src={currentUser.profilePic} alt="Me" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-emerald-400 font-bold text-sm">{getInitials(currentUser?.name)}</span>
                    )}
                  </div>
                  {!myStories && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black rounded-full flex items-center justify-center border-2 border-[#111111] shadow-md font-bold text-xs select-none">
                      +
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-[14px]">My Status</h3>
                  <p className="text-zinc-500 text-[12px] truncate font-medium">
                    {myStories 
                      ? `${myStories.statuses.length} status update${myStories.statuses.length > 1 ? 's' : ''}` 
                      : "Tap to add status update"
                    }
                  </p>
                </div>
                {myStories && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStatusModalOpen(true);
                    }}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl transition border border-white/5 text-zinc-400 hover:text-white"
                    title="Add new status"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* FRIENDS STATUSES */}
            <div className="p-3 bg-[#111111] rounded-2xl border border-[#2a2a2a] shadow-md">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Recent Updates</h4>
              
              {stories.filter(s => s.user._id !== currentUser._id).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-sm text-center">
                  <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-1">No updates</p>
                  <p className="text-zinc-600 font-medium text-xs px-4">None of your connections have posted updates recently.</p>
                </div>
              ) : (
                stories.filter(s => s.user._id !== currentUser._id).map((story) => (
                  <div
                    key={story.user._id}
                    onClick={() => setActiveStory(story)}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#161616] cursor-pointer transition-all duration-300 mb-1"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900 border-2 border-emerald-500 p-0.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        {story.user.profilePic ? (
                          <img src={story.user.profilePic} alt={story.user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-emerald-400 font-bold text-sm">{getInitials(story.user.name)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-[14px]">{story.user.name}</h3>
                      <p className="text-zinc-500 text-[12px] truncate font-medium">
                        {story.statuses.length} update{story.statuses.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* INVITES TAB */}
        {activeTab === "invites" && (
          <div className="animate-fadeIn">
            {invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-500 text-sm text-center">
                 <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mb-1.5">Inbox Clean</p>
                 <p className="text-zinc-600 font-medium text-xs">No pending invitations.</p>
              </div>
            ) : (
              invites.map((u) => (
                <div key={u._id} className="flex flex-col gap-4 p-5 rounded-2xl bg-[#111111] border border-[#2a2a2a] mb-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#161616] flex items-center justify-center flex-shrink-0 border border-[#2a2a2a] overflow-hidden">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-emerald-400 font-bold text-lg">{getInitials(u.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate tracking-tight">{u.name}</h3>
                      <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">Wants to chat</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondInvite(u._id, "accept")}
                      disabled={loadingAction === u._id}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-black rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-md"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondInvite(u._id, "reject")}
                      disabled={loadingAction === u._id}
                      className="flex-1 py-3 bg-[#161616] text-white border border-[#2a2a2a] text-xs font-black rounded-xl hover:bg-[#202022] transition-all active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === "discover" && (
          <div className="animate-fadeIn">
            {discover.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-500 text-sm">
                <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mb-1.5">Lone Wolf</p>
                <p className="text-zinc-600 font-medium text-center text-xs px-10">You've connected with everyone available!</p>
              </div>
            ) : (
              discover.map((u) => (
                <div key={u._id} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#111111] transition-all duration-300 mb-2 border border-transparent hover:border-[#2a2a2a]">
                  <div className="w-11 h-11 rounded-xl bg-[#161616] flex items-center justify-center flex-shrink-0 border border-[#2a2a2a] overflow-hidden">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-500 font-bold text-base">{getInitials(u.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-zinc-200 font-bold text-[14px] truncate tracking-tight">{u.name}</h3>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">New Explorer</p>
                  </div>
                  {u.connectionStatus === "pending_sent" ? (
                    <div className="px-4 py-2 bg-transparent border border-[#2a2a2a] text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl">
                      Waiting
                    </div>
                  ) : (
                    <button
                      onClick={() => sendInvite(u._id)}
                      disabled={loadingAction === u._id}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-md"
                    >
                      Invite
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* GAMES TAB */}
        {activeTab === "games" && (
          <div className="animate-fadeIn">
            {[
              { id: "chess", name: "Tactical Chess", desc: "Interactive board game" },
              { id: "racing", name: "Nitro Racer", desc: "Canvas lane racer" },
              { id: "tictactoe", name: "Criss Cross", desc: "Tic Tac Toe with AI" },
              { id: "puzzle", name: "2048 Puzzle", desc: "Sliding tile merger" }
            ].map((gameItem) => (
              <div 
                key={gameItem.id}
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  searchParams.set("game", gameItem.id);
                  navigate(`/chat?${searchParams.toString()}`);
                }}
                className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-[#161616]/40 border border-transparent hover:border-[#2a2a2a]/30 mb-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-all text-lg">
                  🎮
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">{gameItem.name}</h3>
                  <p className="text-zinc-500 text-xs truncate">{gameItem.desc}</p>
                </div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 group-hover:translate-x-0.5 transition-transform uppercase">Play</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-5 border-t border-[#202022] flex-shrink-0 bg-[#0c0c0c] shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-600 text-[10px] font-black tracking-[0.2em] uppercase mb-1">Global Network</p>
            <p className="text-white text-[15px] font-black tracking-tight">{friends.length} <span className="text-zinc-600 font-medium text-xs ml-1 tracking-normal">Active connections</span></p>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={currentUser} 
        socket={socket}
        onUpdate={onProfileUpdate}
      />

      {/* STATUS ADD MODAL */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentUser={currentUser}
        onStatusPosted={fetchStories}
      />

      {/* FULLSCREEN STORIES VIEWER */}
      {activeStory && (
        <StatusViewer
          userStory={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
}

export default Sidebar;