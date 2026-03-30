import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

export { socket };

function Chat() {
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  const wakeServer = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
      setIsServerReady(true);
    } catch (err) {
      console.log("Server still sleeping...");
    }
  };

  useEffect(() => {
    wakeServer();
  }, []);

  const appMode = sessionStorage.getItem("appMode") || "phone";
  const isWindows = appMode === "windows";

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setIsWakingUp(true), 3000); // 3s delay
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const refreshUsers = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users?userId=${currentUser._id}`
      );
      const filtered = res.data.filter((u) => u._id !== currentUser._id);
      setUsers(filtered);
    } catch (err) {
      console.log("Users error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH USERS ON LOAD
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(refreshUsers, 5000);
    return () => clearInterval(interval);
  }, [currentUser?._id]);

  // 🔥 SOCKET SETUP
  useEffect(() => {
    if (!currentUser) return;

    socket.emit("setup", currentUser._id);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      if (msg.sender !== currentUser._id) {
        setUnread((prev) => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1,
        }));
      }
    });

    socket.on("receiveInvite", () => {
      refreshUsers();
    });

    socket.on("inviteAccepted", () => {
      refreshUsers();
    });

    socket.on("userProfileUpdated", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === data.userId
            ? { ...u, name: data.name, profilePic: data.profilePic }
            : u
        )
      );
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("receiveMessage");
      socket.off("receiveInvite");
      socket.off("inviteAccepted");
      socket.off("userProfileUpdated");
    };

  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-medium tracking-tight">
          {isWakingUp ? "Server is waking up..." : "Loading users..."}
        </h2>
        {isWakingUp && <p className="text-[#8e8e93] text-sm italic">This may take a minute on cold starts.</p>}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden relative">
      {/* SERVER STATUS DOT */}
      {isWindows ? (
        <>
          {!isServerReady && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-[#27272a] rounded-full z-[100] backdrop-blur-sm animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Server Waking...</span>
            </div>
          )}
          {isServerReady && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-[#27272a] rounded-full z-[100] backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Server Ready</span>
            </div>
          )}
        </>
      ) : (
        <>
          {!isServerReady ? (
            <div className="absolute top-6 right-6 flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-full z-[100] backdrop-blur-md animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Waking...</span>
            </div>
          ) : (
            <div className="absolute top-6 right-6 flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-full z-[100] backdrop-blur-md">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-[#444]">Ready</span>
            </div>
          )}
        </>
      )}

      <Sidebar
        users={users}
        unread={unread}
        setUnread={setUnread} 
        onlineUsers={onlineUsers}
        refreshUsers={refreshUsers}
        socket={socket}
      />
    </div>
  );
}

export default Chat;