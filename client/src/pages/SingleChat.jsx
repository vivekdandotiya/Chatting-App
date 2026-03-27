import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
const socket = io(import.meta.env.VITE_BACKEND_URL);

function SingleChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <div className="text-white p-5">Loading...</div>;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef();

  // 🔥 LOAD CHAT HISTORY
 useEffect(() => {
  if (!user || !user._id) return; // 🔥 FIX

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
      );
      setMessages(res.data);
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  fetchMessages();

  socket.emit("setup", user._id);

}, [id, user]);
  // 🔥 RECEIVE MESSAGE
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

  // 🔥 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 SEND MESSAGE
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

  // 🔥 ENTER KEY SEND
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-white">

      {/* 🔥 HEADER */}
      <div className="bg-[#202c33] px-5 py-4 flex items-center gap-4 shadow-md">
        <button
          onClick={() => navigate("/chat")}
          className="text-white text-lg hover:text-gray-300"
        >
          ←
        </button>

        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      {/* 🔥 CHAT AREA */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/dark-mosaic.png')",
          backgroundColor: "#0b141a",
        }}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender === user._id;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end pr-2" : "justify-start pl-2"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl shadow ${
                  isMe
                    ? "bg-[#005c4b] text-white rounded-br-none"
                    : "bg-[#202c33] text-white rounded-bl-none"
                }`}
              >
                {/* sender name */}
                {!isMe && (
                  <p className="text-xs text-gray-400 mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* message */}
                <p className="text-sm leading-relaxed break-words">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* 🔥 INPUT AREA */}
      <div className="bg-[#202c33] px-5 py-4 flex gap-3 items-center">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-[#2a3942] text-white placeholder-gray-400 outline-none"
        />

        <button
          onClick={sendMessage}
          className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default SingleChat;