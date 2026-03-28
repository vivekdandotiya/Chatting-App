import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function Chat() {
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState({});

  const currentUser =
    JSON.parse(sessionStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!currentUser || !currentUser._id) {
      console.log("User missing ❌");
      return;
    }

    const fetchUsers = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users`
      );

      const filtered = res.data.filter(
        (u) => u._id !== currentUser._id
      );

      setUsers(filtered);
    };

    const fetchUnread = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/unread/${currentUser._id}`
      );

      const obj = {};
      res.data.forEach((item) => {
        obj[item._id] = item.count;
      });

      setUnread(obj);
    };

    fetchUsers();
    fetchUnread();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar users={users} unread={unread} />
    </div>
  );
}

export default Chat;