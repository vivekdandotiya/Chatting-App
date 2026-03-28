import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

function SingleChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return <div>Loading...</div>;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const bottomRef = useRef();

  // LOAD MESSAGES
  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
      );
      setMessages(res.data);
    };

    fetchMessages();
    socket.emit("setup", user._id);
  }, [id, user]);

  // RECEIVE MESSAGE
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (
        (msg.sender === id && msg.receiver === user._id) ||
        (msg.sender === user._id && msg.receiver === id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [id, user]);

  // ONLINE USERS
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  // TYPING
  useEffect(() => {
    socket.on("typing", (senderId) => {
      if (senderId === id) setIsTyping(true);
    });

    socket.on("stopTyping", (senderId) => {
      if (senderId === id) setIsTyping(false);
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [id]);

  // NOTIFICATION
  useEffect(() => {
    socket.on("notification", (data) => {
      if (Notification.permission === "granted") {
        new Notification(data.from, {
          body: data.content,
        });
      }
    });

    return () => socket.off("notification");
  }, []);

  // ASK PERMISSION
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      sender: user._id,
      senderName: user.name,
      receiver: id,
      content: message,
    });

    setMessage("");
  };

  // TYPING HANDLER
  const handleTyping = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", {
      sender: user._id,
      receiver: id,
    });

    setTimeout(() => {
      socket.emit("stopTyping", {
        sender: user._id,
        receiver: id,
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-white">

      {/* HEADER */}
      <div className="bg-[#202c33] px-5 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/chat")}>←</button>

        <div>
          <h2>Chat</h2>
          <p className="text-xs text-green-400">
            {onlineUsers.includes(id) ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.sender === user._id;

          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded ${isMe ? "bg-green-500" : "bg-gray-700"}`}>
                {!isMe && <p className="text-xs">{msg.senderName}</p>}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isTyping && <p className="text-gray-400">typing...</p>}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2">
        <input
          value={message}
          onChange={handleTyping}
          className="flex-1 p-2 rounded bg-gray-800"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default SingleChat;