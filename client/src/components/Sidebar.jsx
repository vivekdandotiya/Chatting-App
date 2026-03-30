import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProfileModal from "./ProfileModal";

function Sidebar({ users, unread, setUnread, onlineUsers, refreshUsers, socket }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [loadingAction, setLoadingAction] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(JSON.parse(sessionStorage.getItem("user")));

  // Ensure socket joins setup
  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("setup", currentUser._id);
    }
  }, [currentUser]);

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

  return (
    <div className="w-full h-[100dvh] max-w-full bg-[#0a0a0a] flex flex-col overflow-hidden border-r border-[#27272a] font-sans">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-5 border-b border-[#27272a] flex-shrink-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center justify-between mb-5">
           <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Messages
          </h1>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 rounded-full border border-[#27272a] overflow-hidden bg-[#18181b] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-400">{getInitials(currentUser?.name)}</span>
            )}
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-[#27272a] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-all duration-300"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 pt-4 flex gap-2 border-b border-[#27272a] overflow-x-auto scrollbar-hide flex-shrink-0 pb-4 bg-[#0a0a0a]">
        {["chats", "invites", "discover"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab
                ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                : "text-gray-500 hover:text-white hover:bg-[#18181b]"
            }`}
          >
            {tab === "chats" && `Chats (${friends.length})`}
            {tab === "invites" && `Invites ${invites.length > 0 ? `(${invites.length})` : ''}`}
            {tab === "discover" && "Discover"}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div className="animate-fadeIn">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-gray-600 text-sm text-center px-8">
                <div className="w-16 h-16 bg-[#121212] rounded-3xl flex items-center justify-center mb-4 border border-[#27272a]">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px] mb-1">Silence is golden</p>
                <p className="text-gray-600 font-medium">No active connections yet. Head to Discover to find someone to chat with!</p>
              </div>
            ) : (
              friends.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    navigate(`/chat/${u._id}`);
                    setUnread((prev) => ({ ...prev, [u._id]: 0 }));
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#121212] cursor-pointer transition-all duration-300 border border-transparent hover:border-[#27272a] mb-2 group shadow-sm hover:shadow-md"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a] overflow-hidden group-hover:scale-105 transition-transform">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black text-lg">{getInitials(u.name)}</span>
                      )}
                    </div>
                    {onlineUsers?.[u._id] && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-black rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-bold text-[15px] truncate tracking-tight">{u.name}</h3>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-gray-500 text-[13px] truncate font-medium">Click to open chat</p>
                  </div>
                  {unread && unread[u._id] > 0 && (
                    <span className="w-6 h-6 bg-white text-black text-[11px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      {unread[u._id]}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* INVITES TAB */}
        {activeTab === "invites" && (
          <div className="animate-fadeIn">
            {invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-gray-600 text-sm text-center">
                 <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Inbox Clean</p>
                 <p className="text-gray-600 font-medium">No pending invitations.</p>
              </div>
            ) : (
              invites.map((u) => (
                <div key={u._id} className="flex flex-col gap-4 p-5 rounded-2xl bg-[#121212] border border-[#27272a] mb-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a] overflow-hidden">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{getInitials(u.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate tracking-tight">{u.name}</h3>
                      <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-0.5">Wants to chat</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondInvite(u._id, "accept")}
                      disabled={loadingAction === u._id}
                      className="flex-1 py-3 bg-white text-black text-xs font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondInvite(u._id, "reject")}
                      disabled={loadingAction === u._id}
                      className="flex-1 py-3 bg-[#18181b] text-white border border-[#27272a] text-xs font-black rounded-xl hover:bg-[#27272a] transition-all active:scale-95"
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
              <div className="flex flex-col items-center justify-center h-60 text-gray-600 text-sm">
                <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Lone Wolf</p>
                <p className="text-gray-600 font-medium text-center px-10">You've connected with everyone available!</p>
              </div>
            ) : (
              discover.map((u) => (
                <div key={u._id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#121212] transition-all duration-300 mb-2 border border-transparent hover:border-[#27272a]">
                  <div className="w-12 h-12 rounded-xl bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a] overflow-hidden">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 font-bold text-lg">{getInitials(u.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-200 font-bold text-[14px] truncate tracking-tight">{u.name}</h3>
                    <p className="text-gray-600 text-[11px] font-medium uppercase tracking-tighter truncate">New Explorer</p>
                  </div>
                  {u.connectionStatus === "pending_sent" ? (
                    <div className="px-4 py-2 bg-transparent border border-[#27272a] text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl">
                      Waiting
                    </div>
                  ) : (
                    <button
                      onClick={() => sendInvite(u._id)}
                      disabled={loadingAction === u._id}
                      className="px-5 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                    >
                      Invite
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-5 border-t border-[#27272a] flex-shrink-0 bg-[#0a0a0a] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-[10px] font-black tracking-[0.2em] uppercase mb-1">Global Network</p>
            <p className="text-white text-[15px] font-black tracking-tight">{friends.length} <span className="text-gray-600 font-medium text-xs ml-1 tracking-normal">Active connections</span></p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={currentUser} 
        socket={socket}
        onUpdate={onProfileUpdate}
      />
    </div>
  );
}

export default Sidebar;