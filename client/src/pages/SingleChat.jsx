import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "./Chat";

// Interactive voice player sub-component.
const VoicePlayer = ({ voiceUrl, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(voiceUrl);
    
    const onLoadedMetadata = () => {
      setDuration(audioRef.current.duration || 0);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime || 0);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const audioEl = audioRef.current;
    audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("ended", onEnded);

    return () => {
      audioEl.pause();
      audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("ended", onEnded);
    };
  }, [voiceUrl]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[220px] py-1 select-none">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center transition bg-[#2a2a2a] text-emerald-400 hover:text-emerald-300 hover:scale-105 active:scale-95 shadow-md"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full overflow-hidden relative bg-[#2a2a2a]">
          <div 
            className="h-full absolute left-0 top-0 transition-all duration-100 ease-linear bg-gradient-to-r from-emerald-500 to-teal-400"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span>Voice Msg</span>
        </div>
      </div>
    </div>
  );
};

function SingleChat({ onlineUsers, onStartCall }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [targetName, setTargetName] = useState("Chat");
  const [targetPic, setTargetPic] = useState("");
  
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showPickerFor, setShowPickerFor] = useState(null);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  
  // Voice recording states.
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // Typing states.
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Search states.
  const [isSearching, setIsSearching] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);

  const emojis = ["<3", "Ha", "Wow", "Sad", "Thx", "+1"];

  const startNewCall = (callType) => {
    if (onStartCall) {
      onStartCall({
        peerId: id,
        peerName: targetName,
        peerPic: targetPic,
        callType,
        direction: "outgoing"
      });
    }
  };

  const bottomRef = useRef();
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const longPressTimeout = useRef(null);

  const handleTouchStart = (e, msgId) => {
    longPressTimeout.current = setTimeout(() => {
      setShowPickerFor(msgId);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const wakeServer = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
      setIsServerReady(true);
    } catch (err) {
      console.log("Server still sleeping...");
    }
  };

  useEffect(() => {
    wakeServer();
  }, []);

  const appMode = sessionStorage.getItem("appMode") || "phone";
  const isWindows = appMode === "windows";

  useEffect(() => {
    let timer;
    if (loadingStatus) {
      timer = setTimeout(() => setIsWakingUp(true), 3000); // 3s delay
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loadingStatus]);

  // Request notification permission.
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  // Close reaction picker on click outside
  useEffect(() => {
    if (showPickerFor === null) return;

    const handleOutsideClick = (e) => {
      if (!e.target.closest(".reaction-picker-container") && !e.target.closest(".reaction-trigger-btn")) {
        setShowPickerFor(null);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showPickerFor]);

  // Check permission and load messages.
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

          // Mark read.
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

  // Receive message and profile updates.
  useEffect(() => {
    if (!isAllowed) return;

    const handleReceiveMessage = (msg) => {
      // If it belongs to this conversation
      if ((msg.sender === id && msg.receiver === user._id) || (msg.sender === user._id && msg.receiver === id)) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
        
        // Mark read instantly if active
        if (msg.sender === id) {
          socket.emit("markAsRead", { sender: id, receiver: user._id });
        }
      }
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
      if (receiver === id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.receiver === receiver ? { ...m, status: "read" } : m
          )
        );
      }
    };

    const handleReceiveReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    // Sockets for typing
    const handleTyping = ({ sender }) => {
      if (sender === id) {
        setIsTargetTyping(true);
      }
    };

    const handleStopTyping = ({ sender }) => {
      if (sender === id) {
        setIsTargetTyping(false);
      }
    };

    // Sockets for delete message
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId || String(m._id) === String(messageId)
            ? { 
                ...m, 
                isDeleted: true, 
                content: "This message was deleted",
                voiceUrl: null,
                fileUrl: null,
                fileType: null,
                fileName: null,
                reactions: [],
              } 
            : m
        )
      );
    };

    const handleMessageEdited = ({ messageId, content, isEdited, editedAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId || String(m._id) === String(messageId)
            ? { ...m, content, isEdited, editedAt }
            : m
        )
      );
    };

    const handleMessagePinned = ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId || String(m._id) === String(messageId)
            ? { ...m, isPinned }
            : m
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageRead", handleMessageRead);
    socket.on("receiveReaction", handleReceiveReaction);
    socket.on("userProfileUpdated", handleProfileUpdate);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messagePinned", handleMessagePinned);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageRead", handleMessageRead);
      socket.off("receiveReaction", handleReceiveReaction);
      socket.off("userProfileUpdated", handleProfileUpdate);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messagePinned", handleMessagePinned);
    };
  }, [isAllowed, id]);

  // Reset initial load tracking when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMessagesLengthRef.current = 0;
  }, [id]);

  // Auto scroll: instant on open, smooth only on new messages.
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    if (isInitialLoadRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
    } else {
      if (messages.length > prevMessagesLengthRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // Send message.
  const sendMessage = () => {
    if (!message.trim() || !isAllowed) return;

    if (editingMessage) {
      socket.emit("editMessage", {
        messageId: editingMessage._id,
        userId: user._id,
        content: message.trim(),
      });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === editingMessage._id || String(m._id) === String(editingMessage._id)
            ? { ...m, content: message.trim(), isEdited: true, editedAt: new Date() }
            : m
        )
      );
      setEditingMessage(null);
      setMessage("");
      stopLocalTyping();
      return;
    }

    const newMsg = {
      _id: Date.now(),
      sender: user._id,
      receiver: id,
      senderName: user.name,
      content: message,
      messageType: "text",
      replyTo: replyTo
        ? {
            messageId: String(replyTo._id),
            senderName: replyTo.sender === user._id ? user.name : targetName,
            content: replyTo.content || replyTo.fileName || (replyTo.messageType === "voice" ? "Voice message" : "Attachment"),
            messageType: replyTo.messageType || "text",
          }
        : null,
      status: "sent",
      createdAt: new Date(),
    };

    // UI add
    setMessages((prev) => [...prev, newMsg]);

    // Send
    socket.emit("sendMessage", newMsg);
    setMessage("");
    setReplyTo(null);

    // Stop local typing
    stopLocalTyping();
  };

  // Local input changed: typing status.
  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!localTyping && user?._id && id) {
      setLocalTyping(true);
      socket.emit("typing", { sender: user._id, receiver: id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (user?._id && id) {
        socket.emit("stopTyping", { sender: user._id, receiver: id });
        setLocalTyping(false);
      }
    }, 2000);
  };

  const stopLocalTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (localTyping && user?._id && id) {
      socket.emit("stopTyping", { sender: user._id, receiver: id });
      setLocalTyping(false);
    }
  };

  // Delete message for everyone.
  const handleDeleteMessage = (msgId) => {
    if (window.confirm("Delete this message for everyone?")) {
      socket.emit("deleteMessage", { messageId: msgId, userId: user._id });
    }
  };

  const handleCopyMessage = async (msg) => {
    if (!msg?.content) return;
    try {
      await navigator.clipboard.writeText(msg.content);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleStartReply = (msg) => {
    setReplyTo(msg);
    setEditingMessage(null);
    setShowPickerFor(null);
  };

  const handleStartEdit = (msg) => {
    if (msg.sender !== user._id || msg.messageType !== "text") return;
    setEditingMessage(msg);
    setReplyTo(null);
    setMessage(msg.content || "");
    setShowPickerFor(null);
  };

  const handleTogglePin = (msg) => {
    socket.emit("togglePinMessage", { messageId: msg._id, userId: user._id });
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id || String(m._id) === String(msg._id)
          ? { ...m, isPinned: !m.isPinned }
          : m
      )
    );
  };

  const openForwardModal = async (msg) => {
    setForwardMessage(msg);
    setIsForwardOpen(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users?userId=${user._id}`);
      setForwardTargets(
        res.data.filter((u) => u._id !== user._id && u.connectionStatus === "accepted")
      );
    } catch (err) {
      console.error("Forward users error:", err);
      setForwardTargets([]);
    }
  };

  const forwardToUser = (targetUser) => {
    if (!forwardMessage || !targetUser) return;
    const forwardedMsg = {
      _id: Date.now(),
      sender: user._id,
      receiver: targetUser._id,
      senderName: user.name,
      content: forwardMessage.content,
      messageType: forwardMessage.messageType || "text",
      voiceUrl: forwardMessage.voiceUrl || null,
      fileUrl: forwardMessage.fileUrl || null,
      fileType: forwardMessage.fileType || null,
      fileName: forwardMessage.fileName || null,
      isForwarded: true,
      status: "sent",
      createdAt: new Date(),
    };
    socket.emit("sendMessage", forwardedMsg);
    if (targetUser._id === id) {
      setMessages((prev) => [...prev, forwardedMsg]);
    }
    setIsForwardOpen(false);
    setForwardMessage(null);
  };

  // Start recording.
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

  // Stop recording.
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Cancel recording.
  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = null; // Prevent sending
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
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

  // Send voice message.
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
        voiceUrl: URL.createObjectURL(blob),
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
      alert("Voice upload failed.");
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    }
  };

  // File upload logic.
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large (max 10MB)");
      return;
    }

    await uploadFile(file);
    e.target.value = null;
  };

  const uploadFile = async (file) => {
    const tempId = Date.now();
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

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
        _id: tempId,
        fileUrl: res.data.url,
        fileType: res.data.resource_type === "image" ? "image" : "document",
        fileName: res.data.original_name,
        status: "sent",
      };

      socket.emit("sendMessage", serverFileMsg);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: "sent", fileUrl: res.data.url } : m));

    } catch (err) {
      console.error("File upload error:", err);
      alert("Failed to upload file.");
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

  // FILTERED MESSAGES LIST FOR SEARCH
  const filteredMessages = messages.filter((m) => {
    if (!chatSearchQuery.trim()) return true;
    return m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });
  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);
  const galleryImages = messages.filter((m) => m.messageType === "file" && m.fileType === "image" && m.fileUrl && !m.isDeleted);
  const galleryDocs = messages.filter((m) => m.messageType === "file" && m.fileType !== "image" && m.fileUrl && !m.isDeleted);

  if (!user || !user._id) {
    return (
      <div className="h-[100dvh] bg-[#0c0c0c] flex justify-center items-center text-white font-sans">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full w-full bg-[#0c0c0c] text-white overflow-hidden relative font-sans">
      
      {/* HEADER */}
      <div className="bg-[#111111]/85 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-[#202022] flex-shrink-0 z-10 shadow-lg">
        <div className="flex gap-1.5 sm:gap-3 items-center min-w-0 flex-1 mr-2 sm:mr-4">
          {/* Back button hidden on desktop when split screen */}
          <button 
            onClick={() => navigate("/chat")}
            className="md:hidden hover:bg-zinc-800 p-1.5 sm:p-2 rounded-xl transition text-zinc-400 hover:text-white flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
               {targetPic ? (
                 <img src={targetPic} alt={targetName} className="w-full h-full object-cover" />
               ) : (
                 <span className="font-extrabold text-emerald-400 text-sm sm:text-base">{targetName[0]?.toUpperCase()}</span>
               )}
            </div>

            <div className="min-w-0 flex-1">
               <h2 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-snug truncate">{targetName}</h2>
               {isTargetTyping ? (
                 <p className="text-[10px] sm:text-[11px] text-emerald-400 font-bold animate-pulse truncate">typing...</p>
               ) : (
                 <p className="text-[10px] sm:text-[11px] flex items-center gap-1 font-medium select-none text-zinc-500 truncate">
                   {isAllowed ? (
                     onlineUsers?.[id] ? (
                       <>
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                         <span className="text-emerald-400 truncate">Online</span>
                       </>
                     ) : (
                       <>
                         <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                         <span className="truncate">Offline</span>
                       </>
                     )
                   ) : (
                     <span className="truncate">Connection info</span>
                   )}
                 </p>
               )}
            </div>
          </div>
        </div>

        {/* SEARCH & ACTIONS */}
        {isAllowed && (
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <button
              onClick={() => startNewCall("audio")}
              className="p-1.5 sm:p-2 rounded-xl transition border text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800"
              title="Voice call"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button
              onClick={() => startNewCall("video")}
              className="p-1.5 sm:p-2 rounded-xl transition border text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800"
              title="Video call"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl transition border text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800"
              title="Media and documents"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4a2 2 0 012.8 0l1.2 1.2 2.2-2.2a2 2 0 012.8 0l3 3M4 6h16M4 6v12h16V6M8 10h.01" />
              </svg>
            </button>
            <button 
              onClick={() => {
                setIsSearching(!isSearching);
                setChatSearchQuery("");
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition border ${isSearching ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800"}`}
              title="Search chat"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* SEARCH BAR INPUT OVERLAY */}
      {isSearching && (
        <div className="px-5 py-3 border-b border-[#202022] bg-[#111111] flex gap-3 items-center z-10 animate-slideDown">
          <input
            type="text"
            placeholder="Search in this conversation..."
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
            autoFocus
          />
          <button 
            onClick={() => {
              setIsSearching(false);
              setChatSearchQuery("");
            }}
            className="text-xs font-bold text-zinc-400 uppercase hover:text-white transition px-2 py-2"
          >
            Close
          </button>
        </div>
      )}

      {pinnedMessages.length > 0 && isAllowed && (
        <div className="px-5 py-2.5 border-b border-[#202022] bg-[#101010] flex items-center gap-3 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Pinned</span>
          <div className="flex-1 min-w-0 text-xs text-zinc-400 truncate">
            {pinnedMessages[0].content || pinnedMessages[0].fileName || "Pinned attachment"}
          </div>
          <span className="text-[10px] text-zinc-600 font-bold">{pinnedMessages.length}</span>
        </div>
      )}

      {loadingStatus ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0c0c0c]">
           <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
           <h2 className="text-xl font-bold tracking-tight">
             {isWakingUp ? "Server is waking up..." : "Loading chat..."}
           </h2>
        </div>
      ) : !isAllowed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0c0c0c]">
          <div className="w-16 h-16 bg-[#161616] border border-[#2a2a2a] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
             <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Chat Locked</h2>
          <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-6">
             You need to be connected with this user to start chatting. Send an invite from the Discover tab, or ask them to accept yours.
          </p>
          <button 
             onClick={() => navigate('/chat')}
             className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition md:hidden shadow-lg shadow-emerald-500/20"
          >
             Return to Messages
          </button>
        </div>
      ) : (
        <>
          {/* CHAT MESSAGES BODY */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 relative select-none"
            style={{ 
              backgroundColor: "#0c0c0c",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.005' fill-rule='evenodd'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm1-61c3.16 0 5.72-2.56 5.72-5.72 0-3.16-2.56-5.72-5.72-5.72-3.16 0-5.72 2.56-5.72 5.72 0 3.16 2.56 5.72 5.72 5.72zm52-3c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-4 49c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-39 16c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-28-57c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm67 33c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM8 77c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm25-33c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm21-32c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-19 32c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm26 38c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-9-54c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm36 29c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-49 29c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-24-44c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm0 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm80-80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm0 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-40-40c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z'/%3E%3C/g%3E%3C/svg%3E")`
            }}
          >
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 text-center max-w-xs text-xs text-zinc-500 shadow-2xl leading-relaxed">
                  {chatSearchQuery ? "No matching messages found." : "Secure connection active. Direct messages sent here are end-to-end encrypted."}
                </div>
              </div>
            ) : (
              <>
                {filteredMessages.map((msg, i) => {
                  const isMe = msg.sender === user._id;

                  return (
                    <div
                      key={msg._id || i}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} px-2 sm:px-0 relative group mb-3`}
                    >
                      {/* REACTION PICKER POPUP (positioned above the bubble) */}
                      {showPickerFor === msg._id && !msg.isDeleted && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className={`
                            reaction-picker-container absolute -top-12 z-[100] flex gap-2 bg-[#161616] border border-[#2a2a2a] p-1.5 rounded-full shadow-2xl animate-picker
                            ${isMe ? 'right-4' : 'left-4'}
                          `}
                        >
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); addReaction(msg._id, emoji); }}
                              className="hover:scale-125 transition-transform p-1 rounded-full text-base"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bubble Wrapper containing the bubble and absolute hover triggers */}
                      <div className="relative group/bubble flex items-center max-w-[85%] sm:max-w-md lg:max-w-lg">
                        
                        {/* Bubble Container */}
                        <div 
                          onTouchStart={(e) => handleTouchStart(e, msg._id)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchEnd}
                          className={`
                            transition-all relative select-text border
                            ${msg.isDeleted 
                              ? "bg-[#111111] border-[#2a2a2a] text-zinc-600 rounded-2xl p-3 w-full italic text-[13.5px]"
                              : isMe 
                                ? "bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-[#e9edef] rounded-tr-none px-4 py-2.5 rounded-2xl w-full shadow-[0_4px_12px_rgba(16,185,129,0.05)] font-normal text-[14px]" 
                                : "bg-[#161616] border-[#2a2a2a] text-[#e9edef] rounded-tl-none px-4 py-2.5 rounded-2xl w-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] font-normal text-[14px]"
                            } 
                            ${msg.messageType === "file" && msg.fileType === "image" && !msg.isDeleted ? "!p-1 !overflow-hidden" : ""}
                            animate-message
                          `}
                        >
                          {!isMe && !msg.isDeleted && (
                            <p className={`text-[10px] text-emerald-400 mb-0.5 font-bold uppercase tracking-wider ${msg.messageType === "file" && msg.fileType === "image" ? "absolute top-2 left-3 z-10 bg-black/40 px-1 rounded text-white" : ""}`}>
                              {msg.senderName}
                            </p>
                          )}

                          {!msg.isDeleted && (msg.isForwarded || msg.isPinned) && (
                            <div className="flex gap-1.5 mb-1">
                              {msg.isForwarded && <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Forwarded</span>}
                              {msg.isPinned && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Pinned</span>}
                            </div>
                          )}

                          {msg.replyTo && !msg.isDeleted && (
                            <div className="mb-2 rounded-lg border-l-2 border-emerald-400 bg-black/20 px-3 py-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 truncate">{msg.replyTo.senderName || "Reply"}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{msg.replyTo.content || msg.replyTo.messageType || "Message"}</p>
                            </div>
                          )}

                          {msg.isDeleted ? (
                            <div className="flex items-center gap-2 select-none">
                              <span className="text-[12px]">X</span>
                              <span>This message was deleted</span>
                            </div>
                          ) : msg.messageType === "voice" ? (
                            <VoicePlayer voiceUrl={msg.voiceUrl} isMe={isMe} />
                          ) : msg.messageType === "file" ? (
                            <div className="min-w-[150px]">
                              {msg.fileType === "image" ? (
                                <div className="relative group/img">
                                  <img 
                                    src={msg.fileUrl} 
                                    alt="Chat Attachment" 
                                    className="max-w-full rounded-xl max-h-[300px] object-cover cursor-zoom-in"
                                    onClick={(e) => { e.stopPropagation(); setPreviewImage(msg.fileUrl); }}
                                  />
                                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] text-white">
                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && (
                                      <span className={msg.status === "read" ? "text-emerald-400" : "text-white/70"}>
                                        {msg.status === "read" ? "Read" : msg.status === "delivered" ? "Delivered" : "Sent"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-1.5 bg-[#111111] border border-[#2a2a2a] rounded-xl">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 border border-[#2a2a2a]">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-bold truncate pr-2 text-white">{msg.fileName || "Document"}</p>
                                    <a 
                                      href={msg.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="break-words leading-relaxed whitespace-pre-line text-zinc-100">{msg.content}</p>
                          )}

                          {msg.isEdited && !msg.isDeleted && (
                            <p className="text-[9px] text-zinc-600 mt-1 text-right font-semibold">Edited</p>
                          )}

                          {/* TIME & STATUS */}
                          {(!msg.messageType || msg.messageType !== "file" || msg.fileType !== "image" || msg.isDeleted) ? (
                            <div className={`text-[9px] flex gap-1 justify-end items-center mt-1 select-none font-medium ${msg.isDeleted ? 'text-zinc-700' : isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>

                              {isMe && !msg.isDeleted && (
                                <span className="text-[11px] font-semibold leading-none">
                                  {msg.status === "sent" && "Sent"}
                                  {msg.status === "delivered" && "Delivered"}
                                  {msg.status === "read" && <span className="text-emerald-400">Read</span>}
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* REACTIONS FLOATING AT BOTTOM */}
                          {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                            <div className={`
                              absolute -bottom-4 flex -space-x-1 items-center z-10 select-none
                              ${isMe ? 'right-2' : 'left-2'}
                            `}>
                              <div className="flex bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded-full shadow-lg scale-90 sm:scale-100">
                                {msg.reactions.map((r, idx) => (
                                  <span key={idx} className="text-[12px]">
                                    {r.emoji}
                                  </span>
                                ))}
                                {msg.reactions.length > 1 && (
                                  <span className="ml-1 text-[9px] text-zinc-500 font-bold flex items-center">
                                    {msg.reactions.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ABSOLUTE HOVER ACTIONS LIST (WhatsApp style next to bubble) */}
                        {!msg.isDeleted && (
                          <div 
                            className={`
                              absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20
                              ${isMe ? 'right-[calc(100%+8px)] flex-row-reverse' : 'left-[calc(100%+8px)] flex-row'}
                            `}
                          >
                            {/* Emoji trigger */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowPickerFor(showPickerFor === msg._id ? null : msg._id); }}
                              className="reaction-trigger-btn w-7 h-7 rounded-full text-zinc-400 hover:text-[#00a884] hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                              title="React"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartReply(msg); }}
                              className="w-7 h-7 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                              title="Reply"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l-4-4m0 0l4-4m-4 4h11a4 4 0 014 4v1" />
                              </svg>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); openForwardModal(msg); }}
                              className="w-7 h-7 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                              title="Forward"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h15" />
                              </svg>
                            </button>

                            {msg.content && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyMessage(msg); }}
                                className="w-7 h-7 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                                title="Copy"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h10v10H8zM6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleTogglePin(msg); }}
                              className="w-7 h-7 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                              title={msg.isPinned ? "Unpin" : "Pin"}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l6 6-3 1-4 7-2-2 7-4 1-3-6-6z" />
                              </svg>
                            </button>

                            {/* Delete trigger (only for outgoing messages) */}
                            {isMe && (
                              <>
                              {msg.messageType === "text" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }}
                                  className="w-7 h-7 rounded-full text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                                  title="Edit message"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id); }}
                                className="w-7 h-7 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center bg-[#111111] border border-[#2a2a2a]/60 shadow-md"
                                title="Delete message"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              </>
                            )}
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

          {/* CHAT INPUT FORM */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-4 bg-[#111111]/95 backdrop-blur-md z-10 border-t border-[#202022] flex-shrink-0">
            {(replyTo || editingMessage) && (
              <div className="max-w-6xl mx-auto mb-3 rounded-xl border border-[#2a2a2a] bg-[#161616] px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {editingMessage ? "Editing message" : `Replying to ${replyTo?.sender === user._id ? "you" : targetName}`}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {editingMessage?.content || replyTo?.content || replyTo?.fileName || "Attachment"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setEditingMessage(null);
                    if (editingMessage) setMessage("");
                  }}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#202022] transition"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {isRecording ? (
              <div className="flex items-center gap-3 sm:gap-4 bg-red-950/20 rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 border border-red-500/20 animate-pulse max-w-6xl mx-auto">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm font-semibold text-red-400 truncate">Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <button 
                  onClick={cancelRecording}
                  className="text-zinc-500 hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex-shrink-0"
                >
                  Cancel
                </button>
                <div className="w-px h-6 bg-[#2a2a2a] flex-shrink-0"></div>
                <button 
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-2.5 relative items-center max-w-6xl mx-auto select-none">
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
                  className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 border border-[#2a2a2a] rounded-xl flex items-center justify-center bg-[#161616] transition hover:scale-105 active:scale-95 ${isUploading ? 'opacity-50' : 'text-zinc-400 hover:text-white hover:border-emerald-500/30'}`}
                >
                  {isUploading ? (
                     <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                     </svg>
                  )}
                </button>

                <input
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={isUploading ? "Uploading attachment..." : editingMessage ? "Edit message..." : "Type a message..."}
                  disabled={isUploading}
                  className="flex-1 min-w-0 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#161616] border border-[#2a2a2a] text-[#e9edef] placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs sm:text-sm transition"
                />

                {!message.trim() && !editingMessage ? (
                  <button
                    onClick={startRecording}
                    className="border border-[#2a2a2a] bg-[#161616] text-zinc-400 hover:text-white w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:scale-105 hover:border-emerald-500/30 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 text-black w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:brightness-110 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
            title="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {isForwardOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Forward message</h3>
              <button onClick={() => setIsForwardOpen(false)} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#202022] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-3">
              {forwardTargets.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No accepted contacts available.</p>
              ) : (
                forwardTargets.map((target) => (
                  <button
                    key={target._id}
                    onClick={() => forwardToUser(target)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#202022] transition text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#111111] border border-[#2a2a2a] overflow-hidden flex items-center justify-center text-emerald-400 font-bold">
                      {target.profilePic ? <img src={target.profilePic} alt={target.name} className="w-full h-full object-cover" /> : target.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-semibold truncate">{target.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Media and documents</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{galleryImages.length} images / {galleryDocs.length} docs</p>
              </div>
              <button onClick={() => setIsGalleryOpen(false)} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#202022] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-6">
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Images</h4>
                {galleryImages.length === 0 ? (
                  <p className="text-xs text-zinc-500">No shared images yet.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {galleryImages.map((item) => (
                      <button key={item._id} onClick={() => setPreviewImage(item.fileUrl)} className="aspect-square rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#111111]">
                        <img src={item.fileUrl} alt={item.fileName || "Shared image"} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Documents</h4>
                {galleryDocs.length === 0 ? (
                  <p className="text-xs text-zinc-500">No shared documents yet.</p>
                ) : (
                  <div className="space-y-2">
                    {galleryDocs.map((item) => (
                      <a key={item._id} href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#111111] border border-[#2a2a2a] hover:border-emerald-500/30 transition">
                        <span className="text-xs text-white font-semibold truncate">{item.fileName || "Document"}</span>
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Open</span>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION KEYFRAMES & STYLING */}
      <style>{`
        @keyframes messageFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message {
          animation: messageFadeIn 0.18s cubic-bezier(0.1, 1, 0.1, 1) forwards;
        }
        @keyframes pickerBounceUp {
          0% { opacity: 0; transform: scale(0.9) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-picker {
          animation: pickerBounceUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default SingleChat;
