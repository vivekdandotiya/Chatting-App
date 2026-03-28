import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

function SingleChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef();

  // LOAD CHAT
 useEffect(() => {
  if (!user || !user._id) return;

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
      );

      console.log("MESSAGES:", res.data); // 🔥 DEBUG

      setMessages(res.data);

      socket.emit("markAsRead", {
        sender: id,          // jisne message bheja
        receiver: user._id,  // current user
      });

    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  fetchMessages();

  socket.emit("setup", user._id);

}, [id, user]); // 🔥 IMPORTANT

  

  // RECEIVE
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("messagesRead", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user._id ? { ...m, status: "read" } : m
        )
      );
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messagesRead");
    };
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND
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

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-white">
      
      {/* HEADER */}
      <div className="bg-[#202c33] px-5 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/chat")}>←</button>
        <h2>Chat</h2>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.sender === user._id;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-xl ${
                  isMe ? "bg-green-600" : "bg-gray-700"
                }`}
              >
                <p>{msg.content}</p>

                <div className="text-[10px] flex justify-end gap-1 mt-1">
                  {/* TIME */}
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}

                  {/* TICKS */}
                  {isMe && (
                    <span>
                      {msg.status === "sent" || msg.status === undefined ? "✔" : ""}
                      {msg.status === "delivered" && "✔✔"}
                      {msg.status === "read" && (
                        <span className="text-blue-400">✔✔</span>
                      )}
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
      <div className="p-4 flex gap-2 bg-[#202c33]">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-800 rounded"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default SingleChat;