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
  const [recipientName, setRecipientName] = useState("Chat");
  const [isLoading, setIsLoading] = useState(true);

  const bottomRef = useRef();
  const inputRef = useRef();
  const contentRef = useRef();

  // 🔔 REQUEST NOTIFICATION
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  if (!user || !user._id) {
    return (
      <div className="w-screen h-screen max-w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔥 LOAD MESSAGES - Fixed version
  useEffect(() => {
    if (!user || !user._id || !id) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching messages for:", user._id, "and", id);
        
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
        );

        console.log("Messages received:", res.data);
        
        const fetchedMessages = res.data || [];
        
        // Set all messages
        setMessages(fetchedMessages);

        // Extract recipient name from messages
        if (fetchedMessages.length > 0) {
          // Find any message from the other person
          const otherPersonMsg = fetchedMessages.find(
            (m) => m.sender !== user._id
          );
          
          if (otherPersonMsg) {
            setRecipientName(otherPersonMsg.senderName);
          } else {
            // All messages are from me, find the receiver name
            const myMsg = fetchedMessages.find((m) => m.sender === user._id);
            if (myMsg && myMsg.receiver) {
              // Try to get name from message content or use generic name
              setRecipientName("User");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // ✅ mark read
    socket.emit("markAsRead", {
      sender: id,
      receiver: user._id,
    });
  }, [id, user._id, user]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("setup", user._id);
    }
  }, [user?._id]);

  // 🔥 RECEIVE MESSAGE
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log("Received message:", msg);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    const handleMessageDelivered = (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, status: "delivered" } : m
        )
      );
    };

    const handleMessageRead = ({ receiver }) => {
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
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Delay slightly to allow DOM to update
    const timer = setTimeout(scrollToBottom, 0);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle viewport changes when keyboard appears
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen max-w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden relative">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-3 sticky top-0 flex-shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center transition-all duration-200 hover:border-slate-600/50 active:scale-95"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-slate-200"
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
          <h2 className="text-sm md:text-lg font-bold text-white truncate">
            {recipientName}
          </h2>
          <p className="text-xs md:text-sm text-slate-400">Active now</p>
        </div>

        <div className="flex-shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xs md:text-base">
            {recipientName?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
      </div>

      {/* MESSAGES CONTAINER */}
      <div
        ref={contentRef}
        className="relative z-10 flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400 text-xs md:text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl flex items-center justify-center mb-3 border border-slate-700/50">
              <svg
                className="w-7 h-7 md:w-8 md:h-8 text-slate-400"
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
            <p className="text-slate-300 font-semibold text-sm md:text-base">Say hello! 👋</p>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Start a conversation</p>
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
                    className={`group relative max-w-xs md:max-w-sm px-3 md:px-4 py-2 md:py-2.5 rounded-2xl transition-all duration-300 ${
                      isMe
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        : "bg-slate-800/60 text-slate-100 rounded-bl-none border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/80"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-bold text-slate-400 mb-0.5">
                        {msg.senderName}
                      </p>
                    )}

                    <p className="text-xs md:text-sm break-words leading-relaxed">
                      {msg.content}
                    </p>

                    <div className="flex items-center gap-1 justify-end mt-1">
                      <span className="text-xs opacity-75">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isMe && (
                        <span className="text-xs font-bold opacity-80">
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

      {/* INPUT AREA - FIXED AT BOTTOM WITH KEYBOARD SUPPORT */}
      <div className="relative z-20 px-3 md:px-4 py-2.5 md:py-3 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-300"></div>
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Auto-expand height
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="relative w-full px-3 md:px-4 py-2.5 md:py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:bg-slate-800 focus:border-blue-500/50 transition-all duration-300 resize-none max-h-24 text-xs md:text-sm"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 disabled:shadow-none font-semibold active:scale-95"
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

      <style>{`
        html, body {
          -webkit-text-size-adjust: 100%;
          -moz-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        * {
          -webkit-user-select: text;
          -moz-user-select: text;
          user-select: text;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background-color: rgb(51, 65, 85);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

export default SingleChat;