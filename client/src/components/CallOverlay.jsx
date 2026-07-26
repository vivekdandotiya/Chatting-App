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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [debugInfo, setDebugInfo] = useState("Initializing WebRTC...");

  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const callInitiatedRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Synthesized audio references
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const gainRef = useRef(null);
  const ringingIntervalRef = useRef(null);

  // Attach local stream to video element safely (prevent blinking on re-render)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true; // Ensure local mic is muted in PIP preview to stop screeching feedback
    }
  }, [localStream, callType]);

  // Attach remote stream to video element safely (prevent blinking on re-render)
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => console.log("Remote video play error:", err));
    }
  }, [remoteStream, callType]);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      { urls: "stun:openrelay.metered.ca:80" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject"
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ],
    iceCandidatePoolSize: 10,
    sdpSemantics: "unified-plan"
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

  // Capture user media streams with HD audio and video constraints + automatic fallback
  const getMediaStream = async () => {
    // Attempt 1: Ideal HD constraints with boolean audio noise suppression flags
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user"
        } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err1) {
      console.warn("HD video constraints failed, retrying with basic media fallback:", err1);
      // Attempt 2: Standard video/audio fallback
      try {
        const fallbackConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: callType === "video" ? true : false
        };
        const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        setLocalStream(stream);
        return stream;
      } catch (err2) {
        console.error("Camera/mic access failed:", err2);
        setCallStatus("Camera or microphone access denied.");
        setTimeout(() => cleanupAndClose(), 3000);
        return null;
      }
    }
  };

  // Initialize RTCPeerConnection
  const initPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Add local tracks to P2P and configure senders
    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (sender && sender.getParameters) {
        try {
          const params = sender.getParameters();
          if (params && params.encodings && params.encodings.length > 0) {
            if (track.kind === "video") {
              params.encodings[0].maxBitrate = 2000000; // 2.0 Mbps target
            } else if (track.kind === "audio") {
              params.encodings[0].maxBitrate = 128000; // 128 kbps HD voice
            }
            sender.setParameters(params).catch(() => {});
          }
        } catch (e) {
          // ignore sender parameter warnings
        }
      }
    });

    // Remote stream capture
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
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
      console.log("Connection State:", pc.connectionState);
      setDebugInfo((prev) => `${prev}\nConn: ${pc.connectionState}`);
      
      if (pc.connectionState === "connected") {
        setDirection("active");
        setCallStatus("Connected");
        stopRingingSound();
        startDurationTimer();
      } else if (pc.connectionState === "failed") {
        setCallStatus("Connection failed. Reconnecting...");
      } else if (pc.connectionState === "closed") {
        cleanupAndClose();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE State:", pc.iceConnectionState);
      setDebugInfo((prev) => `${prev}\nICE: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        setCallStatus("ICE connection establishing...");
      }
    };

    return pc;
  };

  const processIceQueue = async () => {
    if (peerConnectionRef.current && iceCandidatesQueueRef.current.length > 0) {
      console.log(`Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates...`);
      for (const candidate of iceCandidatesQueueRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Failed to add queued ICE candidate:", err);
        }
      }
      iceCandidatesQueueRef.current = [];
    }
  };

  // Safe SDP optimization
  const optimizeSdp = (sdp) => {
    if (!sdp) return sdp;
    let modifiedSdp = sdp;
    try {
      if (modifiedSdp.includes("useinbandfec=1")) {
        modifiedSdp = modifiedSdp.replace(
          "useinbandfec=1",
          "useinbandfec=1;maxaveragebitrate=128000"
        );
      }
    } catch (e) {
      console.warn("SDP format skipped:", e);
    }
    return modifiedSdp;
  };

  // 📞 Outgoing Call flow
  const startCall = async () => {
    startRingingSound(true);
    const stream = await getMediaStream();
    if (!stream) return;

    const pc = initPeerConnection(stream);
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      });

      let finalOffer = offer;
      try {
        const optimizedOfferSdp = optimizeSdp(offer.sdp);
        finalOffer = new RTCSessionDescription({ type: offer.type, sdp: optimizedOfferSdp });
      } catch (sdpErr) {
        console.warn("Offer SDP optimization skipped:", sdpErr);
        finalOffer = offer;
      }

      await pc.setLocalDescription(finalOffer);

      socket.emit("initiateCall", {
        senderId: user._id,
        receiverId: peerId,
        signalData: finalOffer,
        callType,
        callerName: user.name,
        callerPic: user.profilePic || ""
      });
    } catch (err) {
      console.error("Failed to create offer:", err);
      setCallStatus("Call setup failed.");
      setTimeout(() => cleanupAndClose(), 2000);
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
      
      let finalAnswer = answer;
      try {
        const optimizedAnswerSdp = optimizeSdp(answer.sdp);
        finalAnswer = new RTCSessionDescription({ type: answer.type, sdp: optimizedAnswerSdp });
      } catch (sdpErr) {
        console.warn("Answer SDP optimization skipped:", sdpErr);
        finalAnswer = answer;
      }

      await pc.setLocalDescription(finalAnswer);

      socket.emit("acceptCall", {
        callerId: peerId,
        signalData: finalAnswer
      });

      setDirection("active");
      setCallStatus("Connected");
      startDurationTimer();
      await processIceQueue();
    } catch (err) {
      console.error("Failed to answer call:", err);
      setCallStatus("Call connection failed.");
      setTimeout(() => cleanupAndClose(), 2000);
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
    if (direction === "outgoing" && !callInitiatedRef.current) {
      callInitiatedRef.current = true;
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
          await processIceQueue();
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
      if (candidate) {
        setDebugInfo((prev) => `${prev}\nCand Recv: ${candidate.candidate.substring(0, 20)}...`);
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.warn("Failed to add ICE candidate:", err);
          }
        } else {
          iceCandidatesQueueRef.current.push(candidate);
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

      <div className={`w-full bg-[#0e0e12]/90 border border-zinc-800/80 p-4 sm:p-6 flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-[1010] max-w-none h-full rounded-none" : "max-w-lg rounded-3xl h-[85vh] min-h-[550px]"
      }`}>
        {/* Glow aesthetics */}
        <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

        {/* HEADER / LOGO */}
        <div className="w-full flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4 sm:mb-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Varta {callType === "video" ? "Video Call" : "Voice Call"}
          </span>
          <div className="flex items-center gap-3">
            {direction === "active" && (
              <span className="font-mono text-xs font-bold text-zinc-400">
                {formatDuration(callDuration)}
              </span>
            )}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0M4 4l0 5m11 0l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5m11 0l5 5m0 0l-5 0m5 0l0-5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
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
                    className="w-full h-full object-cover scale-x-[-1]"
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

        {/* DEBUG PANEL */}
        {debugInfo && (
          <div className="mt-4 p-2 bg-black/40 border border-zinc-800/80 rounded-lg w-full max-h-24 overflow-y-auto text-[9px] font-mono text-zinc-500 leading-tight select-text text-left">
            {debugInfo.split('\n').map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}
      </div>
      {remoteStream && callType === "audio" && (
        <audio
          ref={(el) => {
            if (el) {
              el.srcObject = remoteStream;
              el.play().catch((err) => console.log("Audio play failed:", err));
            }
          }}
          autoPlay
        />
      )}
    </div>
  );
};

export default CallOverlay;
