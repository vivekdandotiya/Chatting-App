import React, { useState, useEffect, useRef } from "react";

const CallOverlay = ({
  user,
  peerId,
  peerName,
  peerPic,
  socket,
  callType = "audio", // "audio" | "video"
  initialDirection = "outgoing", // "outgoing" | "incoming"
  incomingOfferSignal = null,
  onClose
}) => {
  const [direction, setDirection] = useState(initialDirection); // "outgoing" | "incoming" | "active"
  const [callStatus, setCallStatus] = useState(initialDirection === "outgoing" ? "Dialing..." : "Incoming Call...");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  
  // Synthesized audio references
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const gainRef = useRef(null);
  const ringingIntervalRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  // 🔊 Synthesize dialing / ringing audio
  const startRingingSound = (isOutgoing) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      if (isOutgoing) {
        // Dialing tone: US ringback tone (440Hz + 480Hz)
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
      } else {
        // Incoming ring tone: UK ring ring tone (400Hz + 450Hz)
        osc1.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.setValueAtTime(450, ctx.currentTime);
      }

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      gainRef.current = gainNode;

      const triggerTone = () => {
        if (!gainRef.current || ctx.state === "closed") return;
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        
        // Ring-ring pattern: 0.4s sound, 0.2s silence, 0.4s sound
        setTimeout(() => {
          if (gainNode) gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }, 400);

        setTimeout(() => {
          if (gainNode) gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        }, 600);

        setTimeout(() => {
          if (gainNode) gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }, 1000);
      };

      triggerTone();
      ringingIntervalRef.current = setInterval(triggerTone, 3000);

    } catch (err) {
      console.warn("Failed to generate dialing tone:", err);
    }
  };

  const stopRingingSound = () => {
    if (ringingIntervalRef.current) {
      clearInterval(ringingIntervalRef.current);
      ringingIntervalRef.current = null;
    }
    try {
      if (osc1Ref.current) osc1Ref.current.stop();
      if (osc2Ref.current) osc2Ref.current.stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Capture user media streams
  const getMediaStream = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === "video" ? { width: 640, height: 480, facingMode: "user" } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Failed to access camera/mic:", err);
      setCallStatus("Failed to access camera or microphone.");
      setTimeout(() => cleanupAndClose(), 2000);
      return null;
    }
  };

  // Initialize RTCPeerConnection
  const initPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Add local tracks to P2P
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Remote stream capture
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          peerId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setDirection("active");
        setCallStatus("Connected");
        stopRingingSound();
        startDurationTimer();
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        cleanupAndClose();
      }
    };

    return pc;
  };

  // 📞 Outgoing Call flow
  const startCall = async () => {
    startRingingSound(true);
    const stream = await getMediaStream();
    if (!stream) return;

    const pc = initPeerConnection(stream);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("initiateCall", {
        senderId: user._id,
        receiverId: peerId,
        signalData: offer,
        callType,
        callerName: user.name,
        callerPic: user.profilePic || ""
      });
    } catch (err) {
      console.error("Failed to create offer:", err);
      cleanupAndClose();
    }
  };

  // 📞 Accept Call flow
  const acceptIncomingCall = async () => {
    stopRingingSound();
    setCallStatus("Connecting...");
    const stream = await getMediaStream();
    if (!stream) {
      // If mic/cam failed, reject call
      socket.emit("rejectCall", { callerId: peerId });
      cleanupAndClose();
      return;
    }

    const pc = initPeerConnection(stream);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferSignal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("acceptCall", {
        callerId: peerId,
        signalData: answer
      });

      setDirection("active");
      setCallStatus("Connected");
      startDurationTimer();
    } catch (err) {
      console.error("Failed to answer call:", err);
      cleanupAndClose();
    }
  };

  // Decline incoming call
  const rejectIncomingCall = () => {
    stopRingingSound();
    socket.emit("rejectCall", { callerId: peerId });
    cleanupAndClose();
  };

  // End active call
  const endActiveCall = () => {
    socket.emit("endCall", { peerId });
    cleanupAndClose();
  };

  const startDurationTimer = () => {
    if (durationIntervalRef.current) return;
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanupAndClose = () => {
    stopRingingSound();
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    
    if (onClose) onClose();
  };

  // Socket event bindings
  useEffect(() => {
    if (direction === "outgoing") {
      startCall();
    } else if (direction === "incoming") {
      startRingingSound(false);
    }

    const handleCallAccepted = async ({ signalData }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signalData)
          );
          setDirection("active");
          setCallStatus("Connected");
          stopRingingSound();
          startDurationTimer();
        } catch (err) {
          console.error("Failed to set remote answer:", err);
          cleanupAndClose();
        }
      }
    };

    const handleCallRejected = () => {
      setCallStatus("Call Rejected");
      setTimeout(() => cleanupAndClose(), 1500);
    };

    const handleCallEnded = () => {
      setCallStatus("Call Ended");
      setTimeout(() => cleanupAndClose(), 1500);
    };

    const handleCallFailed = ({ message }) => {
      setCallStatus(message || "Call Failed");
      setTimeout(() => cleanupAndClose(), 1500);
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.warn("Failed to add ICE candidate:", err);
        }
      }
    };

    socket.on("callAccepted", handleCallAccepted);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);
    socket.on("callFailed", handleCallFailed);
    socket.on("iceCandidate", handleIceCandidate);

    return () => {
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
      socket.off("callFailed", handleCallFailed);
      socket.off("iceCandidate", handleIceCandidate);
      stopRingingSound();
    };
  }, [direction, peerId]);

  // Controls triggers
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream && callType === "video") {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 bg-[#08080a]/95 backdrop-blur-md select-none font-sans text-white">
      
      {/* Blueprint background grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, #cbd5e1 1.2px, transparent 1.2px), linear-gradient(to bottom, #cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="w-full max-w-lg bg-[#0e0e12]/90 border border-zinc-800/80 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden h-[80vh] min-h-[550px]">
        {/* Glow aesthetics */}
        <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

        {/* HEADER / LOGO */}
        <div className="w-full flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Varta {callType === "video" ? "Video Call" : "Voice Call"}
          </span>
          {direction === "active" && (
            <span className="font-mono text-xs font-bold text-zinc-400">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative mb-6 rounded-2xl overflow-hidden bg-zinc-950/40 border border-zinc-900">
          
          {/* VIDEO STREAMS VIEW */}
          {callType === "video" && (direction === "active" || direction === "outgoing") ? (
            <div className="w-full h-full relative">
              {/* Remote Stream Video */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950/70 p-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center text-3xl text-emerald-400 font-bold mb-4 shadow-xl">
                    {peerPic ? <img src={peerPic} alt={peerName} className="w-full h-full object-cover" /> : peerName[0]?.toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{peerName}</h3>
                  <p className="text-xs text-zinc-500">{callStatus}</p>
                </div>
              )}

              {/* Local Stream PIP (Floating corner Box) */}
              <div className="absolute right-4 bottom-4 w-28 h-38 sm:w-32 sm:h-44 rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-950 shadow-2xl z-20">
                {isCameraOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          ) : (
            // AUDIO CALL VIEW
            <div className="flex flex-col items-center p-6 text-center select-none z-10">
              <div className="relative mb-6">
                {/* Pulsing ring decor */}
                {(direction === "incoming" || direction === "outgoing" || callStatus === "Connected") && (
                  <div className="absolute inset-0 w-32 h-32 rounded-full border border-emerald-500/20 animate-ping pointer-events-none" style={{ animationDuration: "2s" }} />
                )}
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-900 flex items-center justify-center text-4xl text-emerald-400 font-black shadow-2xl relative">
                  {peerPic ? (
                    <img src={peerPic} alt={peerName} className="w-full h-full object-cover" />
                  ) : (
                    peerName[0]?.toUpperCase()
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">{peerName}</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-black flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${direction === "active" ? "bg-emerald-400" : "bg-teal-400 animate-pulse"}`}></span>
                {callStatus}
              </p>
            </div>
          )}
        </div>

        {/* INCOMING ACTION BUTTONS */}
        {direction === "incoming" ? (
          <div className="flex gap-4 w-full relative z-10">
            <button
              onClick={rejectIncomingCall}
              className="flex-1 py-4 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 transform rotate-135" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              Decline
            </button>
            <button
              onClick={acceptIncomingCall}
              className="flex-1 py-4 bg-emerald-500 text-black hover:brightness-110 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              Accept
            </button>
          </div>
        ) : (
          // OUTGOING / ACTIVE CALL CONTROLS
          <div className="flex items-center justify-center gap-4 w-full relative z-10">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                isMuted
                  ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                  : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-white"
              }`}
            >
              {isMuted ? (
                // Mic Off Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18" />
                </svg>
              ) : (
                // Mic On Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            {/* Video Toggle Button (Only show if callType is video) */}
            {callType === "video" && (
              <button
                onClick={toggleCamera}
                className={`p-4 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                  isCameraOff
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                    : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              >
                {isCameraOff ? (
                  // Camera Off Icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                  </svg>
                ) : (
                  // Camera On Icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={endActiveCall}
              className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-500/10"
            >
              <svg className="w-4 h-4 transform rotate-135" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
