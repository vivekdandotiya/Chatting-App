import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// ✅ FIXED SOCKET
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

function SingleChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef();

  // 🔥 LOAD CHAT HISTORY
  useEffect(() => {
    if (!user || !user._id || !id) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
        );

        setMessages(res.data || []);
      } catch (err) {
        console.log("Message fetch error:", err);
        setMessages([]);
      }
    };

    fetchMessages();

    // 🔥 retry (Render sleep fix)
    setTimeout(fetchMessages, 3000);

    socket.emit("setup", user._id);

    // 🔥 MARK READ
    socket.emit("markAsRead", {
      sender: id,
      receiver: user._id,
    });

  }, [id]);

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-white">

      {/* HEADER */}
      <div className="bg-[#202c33] px-5 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/chat")}>←</button>
        <h2>Chat</h2>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.sender === user._id;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="bg-gray-700 px-4 py-2 rounded-lg">

                {!isMe && (
                  <p className="text-xs text-gray-300">
                    {msg.senderName}
                  </p>
                )}

                <p>{msg.content}</p>

                {/* ✅ TIME + TICKS */}
                <div className="text-[10px] flex gap-1 justify-end mt-1">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {isMe && (
                    <span>
                      {msg.status === "read"
                        ? "✓✓"
                        : msg.status === "delivered"
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="p-3 flex gap-2 bg-gray-800">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 p-2 rounded"
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default SingleChat;