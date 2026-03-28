import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function Chat() {
  const [users, setUsers] = useState([]);

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

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

    // 🔥 auto refresh users (Render sleep fix)
    const interval = setInterval(fetchUsers, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 prevent blank screen
  if (!users.length) {
    return <h2 className="text-center mt-10">Loading users...</h2>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar users={users} />
    </div>
  );
}

export default Chat;