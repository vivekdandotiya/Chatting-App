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
  const [isAllowed, setIsAllowed] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [targetName, setTargetName] = useState("Chat");
  const [targetPic, setTargetPic] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showPickerFor, setShowPickerFor] = useState(null); // For mobile tap toggle
  
  // 🎤 VOICE RECORDING STATES
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const emojis = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

  const bottomRef = useRef();

  // 🔔 REQUEST NOTIFICATION
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  // 🔥 CHECK PERMISSION AND LOAD MESSAGES
  useEffect(() => {
    if (!user || !id) return;

    const checkAccessAndFetch = async () => {
      try {
        setLoadingStatus(true);
        // Check connection status
        const usersRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users?userId=${user._id}`
        );
        const targetUser = usersRes.data.find((u) => u._id === id);

        if (targetUser) {
          setTargetName(targetUser.name);
          setTargetPic(targetUser.profilePic || "");
        }

        if (targetUser && targetUser.connectionStatus === "accepted") {
          setIsAllowed(true);
          // Fetch messages
          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/messages/${user._id}/${id}`
          );
          if (res.data && Array.isArray(res.data)) {
            setMessages(res.data);
          } else {
            setMessages([]);
          }

          // ✅ mark read
          socket.emit("markAsRead", {
            sender: id,
            receiver: user._id,
          });
        } else {
          setIsAllowed(false);
        }
      } catch (err) {
        console.error("Error fetching access or messages:", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkAccessAndFetch();
  }, [id, user?._id]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("setup", user._id);
    }
  }, [user?._id]);

  // 🔥 RECEIVE MESSAGE & PROFILE UPDATES
  useEffect(() => {
    if (!isAllowed) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    const handleProfileUpdate = (data) => {
      if (data.userId === id) {
        setTargetName(data.name);
        setTargetPic(data.profilePic);
      }
    };

    const handleMessageDelivered = (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          (m._id === msg._id || m.content === msg.content && m.sender === msg.sender && typeof m._id === 'number') 
            ? { ...m, _id: msg._id, status: "delivered" } 
            : m
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

    const handleReceiveReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageRead", handleMessageRead);
    socket.on("receiveReaction", handleReceiveReaction);
    socket.on("userProfileUpdated", handleProfileUpdate);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageRead", handleMessageRead);
      socket.off("receiveReaction", handleReceiveReaction);
      socket.off("userProfileUpdated", handleProfileUpdate);
    };
  }, [isAllowed, id]);


  // 🔥 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim() || !isAllowed) return;

    const newMsg = {
      _id: Date.now(),
      sender: user._id,
      receiver: id,
      senderName: user.name,
      content: message,
      messageType: "text",
      status: "sent",
      createdAt: new Date(),
    };

    // ✅ UI me turant add
    setMessages((prev) => [...prev, newMsg]);

    // ✅ backend ko bhejo
    socket.emit("sendMessage", newMsg);
    setMessage("");
  };

  // 🎤 START RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendVoiceMessage(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone");
    }
  };

  // 🎤 STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // 🎤 CANCEL RECORDING
  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = null; // Prevent sending
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const addReaction = (messageId, emoji) => {
    if (!messageId || !user?._id) return;
    
    // Optimistic Update
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        const reactions = [...(m.reactions || [])];
        const existingIdx = reactions.findIndex(r => r.user === user._id);
        if (existingIdx > -1) {
          if (reactions[existingIdx].emoji === emoji) reactions.splice(existingIdx, 1);
          else reactions[existingIdx].emoji = emoji;
        } else {
          reactions.push({ user: user._id, emoji });
        }
        return { ...m, reactions };
      }
      return m;
    }));

    socket.emit("sendReaction", {
      messageId: String(messageId),
      userId: user._id,
      emoji,
    });
    
    setHoveredMessageId(null);
    setShowPickerFor(null);
  };

  // 🎤 SEND VOICE MESSAGE
  const sendVoiceMessage = async (blob) => {
    const tempId = Date.now();
    try {
      const formData = new FormData();
      formData.append("voice", blob, "voice.webm");

      // Optimistic UI
      const optimisticMsg = {
        _id: tempId,
        sender: user._id,
        receiver: id,
        senderName: user.name,
        messageType: "voice",
        voiceUrl: URL.createObjectURL(blob), // Local preview
        status: "sending...",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Upload to server
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload/voice`, formData);
      
      if (!res.data.url) throw new Error("No URL returned from server");

      // Send via socket
      socket.emit("sendMessage", {
        ...optimisticMsg,
        voiceUrl: res.data.url,
        status: "sent",
      });
    } catch (err) {
      console.error("Voice upload error:", err);
      // Detailed alert
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Voice Error: ${errorMsg}. Make sure Cloudinary is configured on Render!`);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    }
  };

  // 📁 FILE UPLOAD LOGIC
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large (max 10MB)");
      return;
    }

    await uploadFile(file);
    e.target.value = null; // Reset input
  };

  const uploadFile = async (file) => {
    const tempId = Date.now();
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      // Optimistic UI
      const isImage = file.type.startsWith("image/");
      const optimisticMsg = {
        _id: tempId,
        sender: user._id,
        receiver: id,
        senderName: user.name,
        messageType: "file",
        fileUrl: isImage ? URL.createObjectURL(file) : null,
        fileType: isImage ? "image" : "document",
        fileName: file.name,
        status: "uploading...",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload/file`, formData);
      
      const serverFileMsg = {
        ...optimisticMsg,
        _id: tempId, // Keep tempId for replacement logic
        fileUrl: res.data.url,
        fileType: res.data.resource_type === "image" ? "image" : "document",
        fileName: res.data.original_name,
        status: "sent",
      };

      socket.emit("sendMessage", serverFileMsg);
      
      // Update local message state from "uploading" to "sent"
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: "sent", fileUrl: res.data.url } : m));

    } catch (err) {
      console.error("File upload error:", err);
      alert("Failed to upload file. Please try again.");
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user || !user._id) {
    return <div className="h-[100dvh] bg-[#0a0a0a] flex justify-center items-center text-white"><h2 className="text-xl">Loading...</h2></div>;
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#0a0a0a] px-4 py-3 flex gap-4 items-center border-b border-[#27272a] flex-shrink-0">
        <button 
          onClick={() => navigate("/chat")}
          className="hover:bg-[#18181b] p-2 rounded-full transition text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center overflow-hidden">
             {targetPic ? (
               <img src={targetPic} alt={targetName} className="w-full h-full object-cover" />
             ) : (
               <span className="font-bold">{targetName[0]?.toUpperCase()}</span>
             )}
          </div>

          <div>
             <h2 className="text-base font-semibold">{targetName}</h2>
             <p className="text-xs text-gray-500">{isAllowed ? 'Connected' : 'Looking for connection'}</p>
          </div>
        </div>
      </div>

      {loadingStatus ? (
        <div className="flex-1 flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !isAllowed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a]">
          <div className="w-16 h-16 bg-[#121212] border border-[#27272a] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
             <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Chat Locked</h2>
          <p className="text-gray-400 text-sm max-w-sm">
             You need to be connected with this user to start chatting. Send an invite from the Discover tab, or ask them to accept yours.
          </p>
          <button 
             onClick={() => navigate('/chat')}
             className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
          >
             Return to Messages
          </button>
        </div>
      ) : (
        <>
          {/* CHAT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scrollbar-thin scrollbar-thumb-[#27272a]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 text-center max-w-xs text-sm text-gray-400 shadow-xl">
                  Connection established. Send a message to start the conversation.
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isMe = msg.sender === user._id;

                  return (
                    <div
                      key={i}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} px-2 sm:px-0 relative group`}
                      onMouseEnter={() => setHoveredMessageId(msg._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {/* REACTION PICKER TRIGGER (SMILEY) */}
                      {hoveredMessageId === msg._id && !isMe && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowPickerFor(showPickerFor === msg._id ? null : msg._id); }}
                          className="p-1 text-gray-400 hover:text-white transition-opacity duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}

                      {/* REACTION PICKER */}
                      {showPickerFor === msg._id && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className={`
                            absolute -top-12 z-20 flex gap-2 bg-[#1f1f23] border border-[#3f3f46] 
                            p-2 rounded-full shadow-2xl transition-all duration-200
                            ${isMe ? 'right-0' : 'left-0'}
                          `}
                        >
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); addReaction(msg._id, emoji); }}
                              className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-800"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div 
                        onClick={() => setShowPickerFor(showPickerFor === msg._id ? null : msg._id)}
                        className={`
                          cursor-pointer transition-all relative group/bubble
                          ${isMe ? "bg-white text-black rounded-tr-sm" : "bg-[#18181b] border border-[#27272a] text-white rounded-tl-sm"} 
                          px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-md lg:max-w-lg shadow-sm font-medium text-sm
                          ${msg.messageType === "file" && msg.fileType === "image" ? "!p-1 !overflow-hidden" : ""}
                        `}
                      >
                        {/* SMILEY BUTTON INSIDE FOR ME */}
                        {isMe && hoveredMessageId === msg._id && (
                          <div 
                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setShowPickerFor(showPickerFor === msg._id ? null : msg._id); }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        {!isMe && (
                          <p className={`text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider ${msg.messageType === "file" && msg.fileType === "image" ? "absolute top-2 left-3 z-10 bg-black/40 px-1 rounded text-white" : ""}`}>
                            {msg.senderName}
                          </p>
                        )}

                        {msg.messageType === "voice" ? (
                          <div className="flex items-center gap-3 min-w-[200px] py-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const audio = new Audio(msg.voiceUrl);
                                audio.play();
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm ${isMe ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-gray-100'}`}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                            <div className="flex-1 flex flex-col gap-1">
                              <div className={`h-1 rounded-full overflow-hidden ${isMe ? 'bg-black/10' : 'bg-white/10'}`}>
                                <div className={`h-full w-1/3 ${isMe ? 'bg-black/40' : 'bg-white/40'}`}></div>
                              </div>
                              <span className={`text-[10px] font-bold ${isMe ? 'text-black/50' : 'text-white/50'}`}>Voice Message</span>
                            </div>
                          </div>
                        ) : msg.messageType === "file" ? (
                           <div className="min-w-[150px]">
                              {msg.fileType === "image" ? (
                                 <div className="relative group/img">
                                    <img 
                                      src={msg.fileUrl} 
                                      alt="Chat Attachment" 
                                      className="max-w-full rounded-xl max-h-[300px] object-cover cursor-zoom-in"
                                      onClick={(e) => { e.stopPropagation(); window.open(msg.fileUrl, '_blank'); }}
                                    />
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white">
                                       <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                       {isMe && (
                                          <span className={msg.status === "read" ? "text-blue-400" : "text-white/70"}>
                                             {msg.status === "sent" ? "✓" : msg.status === "delivered" ? "✓✓" : "✓✓"}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-3 p-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-black/10' : 'bg-white/10'}`}>
                                       <svg className={`w-6 h-6 ${isMe ? 'text-black/60' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                       </svg>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                       <p className="text-xs font-bold truncate pr-2">{msg.fileName || "Document"}</p>
                                       <a 
                                         href={msg.fileUrl} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isMe ? 'text-black/40' : 'text-white/40'}`}
                                         onClick={(e) => e.stopPropagation()}
                                       >
                                         Download
                                       </a>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ) : (
                          <p className="break-words leading-relaxed">{msg.content}</p>
                        )}

                        {msg.messageType !== "file" || msg.fileType !== "image" ? (
                           <div className={`text-[10px] flex gap-1 justify-end mt-1.5 ${isMe ? 'opacity-50' : 'opacity-40'}`}>
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
                                 {msg.status === "read" && <span className="text-blue-600">✓✓</span>}
                               </>
                             )}
                           </div>
                        ) : null}

                        {/* DISPLAY REACTIONS */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`
                            absolute -bottom-4 flex -space-x-1 items-center z-10
                            ${isMe ? 'right-2' : 'left-2'}
                          `}>
                            <div className="flex bg-[#202023] border border-[#2d2d30] px-1.5 py-0.5 rounded-full shadow-lg scale-90 sm:scale-100">
                              {msg.reactions.map((r, idx) => (
                                <span key={idx} className="text-[14px]">
                                  {r.emoji}
                                </span>
                              ))}
                              {msg.reactions.length > 1 && (
                                <span className="ml-1 text-[10px] text-gray-400 font-bold flex items-center">
                                  {msg.reactions.length}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 bg-[#0a0a0a] border-t border-[#27272a]">
            {isRecording ? (
              <div className="flex items-center gap-4 bg-[#121212] rounded-full px-6 py-3 border border-red-500/30 animate-pulse">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <button 
                  onClick={cancelRecording}
                  className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <div className="w-px h-6 bg-gray-800"></div>
                <button 
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shadow-lg shadow-red-500/20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 relative items-center">
                {/* 📎 ATTACHMENT BUTTON */}
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileSelect} 
                   className="hidden" 
                   accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${isUploading ? 'opacity-50' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  {isUploading ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                     </svg>
                  )}
                </button>

                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isUploading ? "Uploading file..." : "Type your message..."}
                  disabled={isUploading}
                  className="flex-1 px-5 py-3 rounded-full bg-[#121212] border border-[#27272a] text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition"
                />

                {!message.trim() ? (
                  <button
                    onClick={startRecording}
                    className="bg-white hover:bg-gray-200 w-12 h-12 rounded-full text-black flex items-center justify-center flex-shrink-0 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    className="bg-white hover:bg-gray-200 w-12 h-12 rounded-full text-black flex items-center justify-center flex-shrink-0 transition"
                  >
                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SingleChat;