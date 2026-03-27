import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ChatWindow({ socket, user, selectedUser }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();

  // load history
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      const res = await axios.get(
        `http://localhost:5000/api/messages/${user._id}/${selectedUser._id}`
      );

      setMessages(res.data);
    };

    fetchMessages();
  }, [selectedUser, user]);

  // real-time
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (
        msg.sender === selectedUser?._id ||
        msg.receiver === selectedUser?._id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [socket, selectedUser]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message || !selectedUser) return;

    const msgData = {
      sender: user._id,
      receiver: selectedUser._id,
      content: message,
    };

    socket.emit("sendMessage", msgData);
    setMessage("");
  };

  if (!selectedUser) {
    return (
      <div className="w-3/4 flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="w-3/4 flex flex-col h-screen bg-[#121212]">
      {/* header */}
      <div className="p-4 border-b border-gray-800 font-semibold">
        {selectedUser.name}
      </div>

      {/* messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.sender === user._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl max-w-xs ${
                msg.sender === user._id
                  ? "bg-white text-black"
                  : "bg-gray-800 text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* input */}
      <div className="p-4 border-t border-gray-800 flex">
        <input
          className="flex-1 bg-[#1e1e1e] text-white border border-gray-700 p-2 rounded-lg outline-none"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="ml-3 px-5 bg-white text-black rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;