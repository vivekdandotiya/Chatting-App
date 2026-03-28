import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});

function Chat() {
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  // 🔥 FETCH USERS
  useEffect(() => {
    if (!currentUser || !currentUser._id) return;

    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users`
        );

        const filtered = res.data.filter(
          (u) => u._id !== currentUser._id
        );

        setUsers(filtered);
      } catch (err) {
        console.log("Users error:", err);
      }
    };

    fetchUsers();

    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

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

    return () => {
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, []);

  if (!users.length) {
    return <h2 className="text-center mt-10">Loading users...</h2>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        users={users}
        unread={unread}
        setUnread={setUnread} 
        onlineUsers={onlineUsers}
      />
    </div>
  );
}

export default Chat;