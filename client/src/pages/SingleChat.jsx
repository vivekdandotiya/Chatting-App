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

  if (!user || !user._id) {
    return <h2 className="text-white text-center mt-10">Loading...</h2>;
  }

  // 🔥 LOAD MESSAGES - FIXED
  useEffect(() => {
    if (!user || !id) return;

    const fetchMessages = async () => {
      try {
        console.log("Fetching messages from:", `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`);
        
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
        );

        console.log("Messages received:", res.data);
        
        // Make sure we set the messages correctly
        if (res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      }
    };

    fetchMessages();

    // ✅ mark read
    socket.emit("markAsRead", {
      sender: id,
      receiver: user._id,
    });
  }, [id, user._id]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("setup", user._id);
    }
  }, [user._id]);

  // 🔥 RECEIVE MESSAGE
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log("New message received:", msg);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    const handleMessageDelivered = (msg) => {
      console.log("Message delivered:", msg._id);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, status: "delivered" } : m
        )
      );
    };

    const handleMessageRead = ({ receiver }) => {
      console.log("Message read by:", receiver);
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver === receiver ? { ...m, status: "read" } : m
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageRead", handleMessageRead);
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
      _id: Date.now(),
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
      <div className="bg-[#202c33] p-4 flex gap-4 items-center">
        <button 
          onClick={() => navigate("/chat")}
          className="hover:opacity-80 transition"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender === user._id;

              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`${isMe ? "bg-[#056162]" : "bg-[#262e35]"} px-4 py-2 rounded-lg max-w-xs`}>
                    {!isMe && (
                      <p className="text-xs text-gray-300 mb-1">
                        {msg.senderName}
                      </p>
                    )}

                    <p className="text-sm break-words">{msg.content}</p>

                    <div className="text-[10px] flex gap-1 justify-end mt-1 opacity-70">
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
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* INPUT */}
      <div className="p-3 flex gap-2 bg-gray-800 border-t border-gray-700">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-[#2a3942] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#056162]"
        />

        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="bg-[#056162] hover:bg-[#067273] px-6 rounded-full text-white font-semibold disabled:opacity-50 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default SingleChat;