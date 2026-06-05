import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import SingleChat from "./SingleChat";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

export { socket };

const WhatsAppWebHome = () => (
  <div className="flex-1 h-full bg-[#0e0e10] flex flex-col items-center justify-center text-center p-8 select-none relative">
    {/* Grid Background Effect */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
    
    <div className="max-w-md z-10 flex flex-col items-center animate-fadeIn">
      {/* WhatsApp Web Premium Logo/Icon */}
      <div className="w-32 h-32 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-8 shadow-2xl relative group">
        <div className="absolute inset-0 bg-[#075e54]/10 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <svg className="w-16 h-16 text-[#075e54] opacity-90 relative z-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.004 2C6.51 2 2.014 6.5 2.014 12c0 2.13.67 4.11 1.81 5.76L2 22l4.38-1.78c1.6.98 3.48 1.55 5.51 1.55 5.51 0 10.09-4.5 10.09-10S17.49 2 12.004 2zm0 1.83c4.5 0 8.26 3.67 8.26 8.17 0 4.5-3.76 8.17-8.26 8.17-1.85 0-3.55-.61-4.94-1.63l-.35-.26-2.58 1.05.77-2.48-.3-.28c-1.1-1.04-1.79-2.52-1.79-4.14 0-4.5 3.76-8.17 8.26-8.17z" />
          <path d="M12.004 6.42c-3.08 0-5.58 2.5-5.58 5.58 0 1.25.41 2.41 1.12 3.35l.08.11-1.03 2.97 3.03-1.01.12.08a5.532 5.532 0 002.26.49c3.08 0 5.58-2.5 5.58-5.58 0-3.08-2.5-5.58-5.58-5.58zm0 1.02c2.51 0 4.56 2.05 4.56 4.56S14.51 16.56 12 16.56s-4.56-2.05-4.56-4.56S9.49 7.44 12 7.44z"/>
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-white mb-3">WhatsApp for Web</h2>
      <p className="text-[#8e8e93] text-sm leading-relaxed mb-8">
        Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
      </p>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest bg-black/40 border border-[#27272a] px-4 py-2 rounded-full shadow-inner">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>End-to-end encrypted</span>
      </div>
    </div>
  </div>
);

function Chat() {
  const { id } = useParams();
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

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768 && appMode !== "phone");

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768 && appMode !== "phone");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [appMode]);

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

    socket.on("onlineUsers", (usersList) => {
      // socket map keys contains socket online user ids
      const onlineMap = {};
      usersList.forEach(uId => onlineMap[uId] = true);
      setOnlineUsers(onlineMap);
    });

    socket.on("receiveMessage", (msg) => {
      if (msg.sender !== currentUser._id && msg.sender !== id) {
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

  }, [id]);

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

  // STATUS DOT COMPONENT
  const renderServerStatusDot = () => {
    if (isWindows) {
      return (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-[#27272a] rounded-full z-[100] backdrop-blur-sm">
          <div className={`w-2 h-2 ${isServerReady ? "bg-green-500" : "bg-red-500 animate-pulse"} rounded-full`}></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            {isServerReady ? "Server Ready" : "Server Waking..."}
          </span>
        </div>
      );
    }
    return (
      <div className="absolute top-6 right-6 flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-full z-[100] backdrop-blur-md">
        <div className={`w-1.5 h-1.5 ${isServerReady ? "bg-green-500" : "bg-red-500 animate-pulse"} rounded-full`}></div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          {isServerReady ? "Ready" : "Waking..."}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden relative bg-[#0a0a0a]">
      {renderServerStatusDot()}

      {isDesktop ? (
        // DESKTOP SPLIT VIEW
        <div className="flex h-full w-full">
          <div className="w-[380px] shrink-0 h-full border-r border-[#27272a]">
            <Sidebar
              users={users}
              unread={unread}
              setUnread={setUnread} 
              onlineUsers={onlineUsers}
              refreshUsers={refreshUsers}
              socket={socket}
            />
          </div>
          <div className="flex-1 h-full relative">
            {id ? <SingleChat key={id} /> : <WhatsAppWebHome />}
          </div>
        </div>
      ) : (
        // MOBILE / PHONE SIMULATOR SINGLE COLUMN VIEW
        id ? <SingleChat /> : (
          <Sidebar
            users={users}
            unread={unread}
            setUnread={setUnread} 
            onlineUsers={onlineUsers}
            refreshUsers={refreshUsers}
            socket={socket}
          />
        )
      )}
    </div>
  );
}

export default Chat;