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

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

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
    return <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center text-white"><h2 className="text-xl">Loading users...</h2></div>;
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden">
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