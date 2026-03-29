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
  const [recipientName, setRecipientName] = useState("");

  const bottomRef = useRef();

  // 🔔 REQUEST NOTIFICATION
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  if (!user || !user._id) {
    return (
      <h2 className="text-white text-center mt-10">Loading...</h2>
    );
  }

  // 🔥 LOAD MESSAGES
  useEffect(() => {
    if (!user || !id) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
        );

        setMessages(res.data || []);
        if (res.data.length > 0) {
          setRecipientName(res.data[0].senderName === user.name ? res.data[0].senderName : res.data[0].senderName);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();

    // ✅ mark read
    socket.emit("markAsRead", {
      sender: id,
      receiver: user._id,
    });
  }, [id, user]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("setup", user._id);
    }
  }, [user]);

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
      _id: Date.now(),
      sender: user._id,
      receiver: id,
      senderName: user.name,
      content: message,
      status: "sent",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    socket.emit("sendMessage", newMsg);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* HEADER */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 md:p-4 flex items-center gap-3 md:gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-bold text-black dark:text-white truncate">
            {recipientName || "Chat"}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Active now
          </p>
        </div>

        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 flex items-center justify-center">
          <span className="text-white font-semibold text-sm md:text-base">
            {recipientName?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-white dark:bg-black">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm md:text-base">
              Start a conversation
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-2">
              Send your first message below
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender === user._id;

              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                      isMe
                        ? "bg-black text-white dark:bg-white dark:text-black rounded-br-none"
                        : "bg-gray-100 text-black dark:bg-gray-900 dark:text-white rounded-bl-none"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {msg.senderName}
                      </p>
                    )}

                    <p className="text-sm md:text-base break-words">
                      {msg.content}
                    </p>

                    <div className="text-[10px] md:text-xs flex items-center gap-1 justify-end mt-1 opacity-70">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isMe && (
                        <span className="font-bold ml-1">
                          {msg.status === "sent" && "✓"}
                          {msg.status === "delivered" && "✓✓"}
                          {msg.status === "read" && "✓✓"}
                        </span>
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

      {/* INPUT AREA */}
      <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex gap-2 sticky bottom-0">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 md:py-3 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm md:text-base"
        />

        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold text-sm md:text-base"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16109004 C3.34915502,0.9039926 2.40734225,1.01520249 1.77946707,1.4865022 C0.994623095,2.11681295 0.837654326,3.20727025 1.15159189,3.99275714 L3.03521743,10.4337501 C3.03521743,10.5908475 3.19218622,10.7479449 3.50612381,10.7479449 L16.6915026,11.5334318 C16.6915026,11.5334318 17.1624089,11.5334318 17.1624089,12.0046748 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SingleChat;