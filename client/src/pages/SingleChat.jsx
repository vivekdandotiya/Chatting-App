import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});

function SingleChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef();

  // 🔔 REQUEST NOTIFICATION
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  // 🔥 LOAD MESSAGES
  useEffect(() => {
    if (!user || !id) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
        );

        setMessages(res.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();
    setTimeout(fetchMessages, 3000);

    useEffect(() => {
  socket.emit("setup", user._id);
}, []);

    socket.emit("markAsRead", {
      sender: id,
      receiver: user._id,
    });

  }, [id]);

  // 🔥 RECEIVE MESSAGE
  useEffect(() => {
  socket.on("receiveMessage", (msg) => {
    setMessages((prev) => {
  const exists = prev.some((m) => m._id === msg._id);
  if (exists) return prev;
  return [...prev, msg];
});
  });

  socket.on("messageDelivered", (msg) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id ? { ...m, status: "delivered" } : m
      )
    );
  });

  socket.on("messageRead", ({ receiver }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.receiver === receiver ? { ...m, status: "read" } : m
      )
    );
  });

  return () => {
    socket.off("receiveMessage");
    socket.off("messageDelivered");
    socket.off("messageRead");
  };
}, []);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 SEND MESSAGE
  const sendMessage = () => {
  if (!message.trim()) return;

  const newMsg = {
    _id: Date.now(), // temporary id
    sender: user._id,
    receiver: id,
    senderName: user.name,
    content: message,
    status: "sent",
    createdAt: new Date(),
  };

  // ✅ UI me turant add
  setMessages((prev) => [...prev, newMsg]);

  // ✅ backend ko bhejo
  socket.emit("sendMessage", newMsg);

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
      <div className="bg-[#202c33] p-4 flex gap-4">
        <button onClick={() => navigate("/chat")}>←</button>
        <h2>Chat</h2>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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

                <div className="text-[10px] flex gap-1 justify-end">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {isMe && (
  <>
    {msg.status === "sent" && "✓"}
    {msg.status === "delivered" && "✓✓"}
    {msg.status === "read" && "✓✓"}
  </>
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
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-[#2a3942] text-white"
        />

        <button
          onClick={sendMessage}
          className="bg-green-500 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default SingleChat;