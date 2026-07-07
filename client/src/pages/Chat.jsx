import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import SingleChat from "./SingleChat";
import GameZone from "../components/GameZone";
import io from "socket.io-client";
import AppLockScreen from "../components/AppLockScreen";

const socket = io(import.meta.env.VITE_BACKEND_URL);

export { socket };

const VartaHome = () => {
  const handleOpenGameZone = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("game", "list");
    window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="flex-1 h-full bg-[#0c0c0c] flex flex-col items-center justify-center text-center p-8 select-none relative">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
      
      <div className="max-w-md z-10 flex flex-col items-center animate-fadeIn">
        {/* Varta Premium Logo */}
        <div className="w-32 h-32 rounded-[2.5rem] bg-[#161616] border border-[#2a2a2a] flex items-center justify-center mb-8 shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <img src="/fevicon.png" alt="Logo" className="w-16 h-16 object-cover relative z-10 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
        </div>
        
        <h2 className="text-3xl font-black tracking-tight text-white mb-3 flex items-center gap-2">
          <span>Welcome to</span>
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Varta</span>
        </h2>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-sm">
          Connect instantly with friends. Send real-time messages, share moments via status updates, or play interactive games in our brand new Game Zone!
        </p>

        <button 
          onClick={handleOpenGameZone}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
        >
          Open Game Zone
        </button>
        
        <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest bg-[#111111] border border-[#2a2a2a] px-4 py-2.5 rounded-xl shadow-inner">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span>End-to-end secure connection</span>
        </div>
      </div>
    </div>
  );
};

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const activeChatIdRef = useRef(id);
  useEffect(() => {
    activeChatIdRef.current = id;
  }, [id]);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  const activeGame = new URLSearchParams(location.search).get("game");

  const currentUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  const [sessionUnlocked, setSessionUnlocked] = useState(sessionStorage.getItem("varta_unlocked") === "true");

  const wakeServer = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
      setIsServerReady(true);
    } catch (err) {
      console.log("Server still sleeping...");
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    wakeServer();

    // Subscribe to push notifications.
    const subscribeToPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications are not supported on this device/browser.");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Push notifications permission denied.");
          return;
        }

        // Get public VAPID key
        const keyRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/vapid-public-key`);
        const vapidPublicKey = keyRes.data.publicKey;

        if (!vapidPublicKey) {
          console.log("No VAPID public key received.");
          return;
        }

        // Convert key helper
        const urlBase64ToUint8Array = (base64String) => {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Verify if VAPID key matches. If not, unsubscribe and re-subscribe
          let keyMismatch = false;
          if (subscription.options && subscription.options.applicationServerKey) {
            const currentKey = new Uint8Array(subscription.options.applicationServerKey);
            if (currentKey.length !== convertedKey.length) {
              keyMismatch = true;
            } else {
              for (let i = 0; i < convertedKey.length; i++) {
                if (currentKey[i] !== convertedKey[i]) {
                  keyMismatch = true;
                  break;
                }
              }
            }
          } else {
            keyMismatch = true;
          }

          if (keyMismatch) {
            console.log("VAPID key mismatch detected. Re-subscribing...");
            await subscription.unsubscribe();
            subscription = null;
          }
        }

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });
        }

        // Send to backend
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/subscribe`, {
          userId: currentUser._id,
          subscription
        });
        console.log("Push notification subscription successful!");
      } catch (err) {
        console.error("Failed to subscribe to push notifications:", err);
      }
    };

    subscribeToPush();
  }, [currentUser, navigate]);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      // Populate unread count badges from the server data
      const serverUnread = {};
      filtered.forEach((u) => {
        if (u.unreadCount > 0) {
          serverUnread[u._id] = u.unreadCount;
        }
      });
      setUnread((prev) => ({ ...prev, ...serverUnread }));
    } catch (err) {
      console.log("Users error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on load.
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(refreshUsers, 5000);
    return () => clearInterval(interval);
  }, [currentUser?._id]);

  // Socket setup.
  useEffect(() => {
    if (!currentUser?._id) return;

    const handleConnect = () => {
      socket.emit("setup", currentUser._id);
    };

    socket.on("connect", handleConnect);
    
    // Proactively setup if already connected
    if (socket.connected) {
      handleConnect();
    }

    socket.on("onlineUsers", (usersList) => {
      const onlineMap = {};
      usersList.forEach(uId => onlineMap[uId] = true);
      setOnlineUsers(onlineMap);
    });

    socket.on("receiveMessage", (msg) => {
      if (msg.sender !== currentUser._id && msg.sender !== activeChatIdRef.current) {
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
      socket.off("connect", handleConnect);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
      socket.off("receiveInvite");
      socket.off("inviteAccepted");
      socket.off("userProfileUpdated");
    };

  }, [currentUser?._id]);

  const handleCloseGame = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("game");
    navigate(`/chat${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  };

  const hasLock = currentUser?.appLockPassword && currentUser.appLockPassword.hour !== null && currentUser.appLockPassword.minute !== null;

  if (hasLock && !sessionUnlocked) {
    return (
      <AppLockScreen
        mode="unlock"
        targetPassword={currentUser.appLockPassword}
        onUnlock={() => {
          sessionStorage.setItem("varta_unlocked", "true");
          setSessionUnlocked(true);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0c0c0c] flex flex-col items-center justify-center text-white gap-5">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">
            {isWakingUp ? "Server is waking up..." : "Loading conversations..."}
          </h2>
          {isWakingUp && (
            <p className="text-zinc-500 text-xs mt-2 max-w-xs leading-relaxed">
              Our backend goes to sleep after inactivity. This cold start may take up to a minute.
            </p>
          )}
        </div>
      </div>
    );
  }

  // STATUS DOT COMPONENT
  const renderServerStatusDot = () => {
    return (
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-full z-[100] backdrop-blur-sm">
        <div className={`w-2 h-2 ${isServerReady ? "bg-emerald-400" : "bg-red-400 animate-pulse"} rounded-full`}></div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
          {isServerReady ? "Server Ready" : "Server Waking..."}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden relative bg-[#0c0c0c]">
      {renderServerStatusDot()}

      {isDesktop ? (
        // DESKTOP SPLIT VIEW
        <div className="flex h-full w-full">
          <div className="w-[380px] shrink-0 h-full border-r border-[#202022]">
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
            {activeGame ? (
              <GameZone game={activeGame} />
            ) : id ? (
              <SingleChat key={id} onlineUsers={onlineUsers} />
            ) : (
              <VartaHome />
            )}
          </div>
        </div>
      ) : (
        // MOBILE / SINGLE COLUMN VIEW
        activeGame ? (
          <GameZone game={activeGame} onClose={handleCloseGame} />
        ) : id ? (
          <SingleChat key={id} onlineUsers={onlineUsers} />
        ) : (
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
