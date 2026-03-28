import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function Chat() {
  const [users, setUsers] = useState([]);
  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users`);

      // ❌ remove logged-in user
      const filtered = res.data.filter(
        (u) => u._id !== currentUser._id
      );

      setUsers(filtered);
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar users={users} />
    </div>
  );
}

export default Chat;