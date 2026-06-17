import React, { useState, useEffect, useRef } from "react";

const AppLockScreen = ({ mode = "unlock", targetPassword = null, onUnlock, onSave, onCancel }) => {
  const [isTicking, setIsTicking] = useState(mode === "unlock");
  const [hourVal, setHourVal] = useState(12);
  const [minuteVal, setMinuteVal] = useState(0);
  const [secondVal, setSecondVal] = useState(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragHand, setDragHand] = useState(null); // "hour" or "minute"
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 📝 STUDY TIMER STATES
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const svgRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // play synthesized audio alarm beep using Web Audio API
  const playAlarmBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (err) {
      console.error("Audio Context failed:", err);
    }
  };

  // ⏰ REAL TIME TICKING EFFECT
  useEffect(() => {
    if (!isTicking || isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateClockToRealTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      let mins = now.getMinutes();
      let secs = now.getSeconds();
      
      setHourVal(hrs % 12 || 12);
      setMinuteVal(mins);
      setSecondVal(secs);
    };

    updateClockToRealTime();
    timerRef.current = setInterval(updateClockToRealTime, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTicking, isTimerRunning]);

  // ⏳ STUDY TIMER COUNTDOWN EFFECT
  useEffect(() => {
    if (!isTimerRunning || countdownSeconds === null) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setIsTimerRunning(false);
          playAlarmBeep();
          if (navigator.vibrate) navigator.vibrate([150, 100, 150, 100, 150]);
          alert("Focus timer completed! Time to take a break.");
          setIsTicking(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isTimerRunning, countdownSeconds]);

  // Angle calculations helper
  const getPointerAngleAndDist = (e) => {
    if (!svgRef.current) return { angle: 0, dist: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    
    // Support mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Coordinates relative to center of the clock (0,0)
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    
    const dist = Math.sqrt(x * x + y * y);
    
    // Angle in degrees from 12 o'clock position (clockwise)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    return { angle, dist };
  };

  const angleDiff = (a, b) => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  };

  // Check if current hour and minute match the password
  const checkPasswordMatch = (h, m) => {
    if (mode === "unlock" || mode === "disable") {
      if (targetPassword && h === targetPassword.hour && m === targetPassword.minute) {
        setIsSuccess(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playAlarmBeep();
        setTimeout(() => {
          if (onUnlock) onUnlock();
        }, 800);
        return true;
      }
    }
    return false;
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const { angle, dist } = getPointerAngleAndDist(e);

    // 1. Check if clicked center dot (lock target)
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const centerThreshold = (rect.width / 2) * 0.20; // 20% of radius
      
      if (dist < centerThreshold) {
        if (isTimerRunning) {
          // Stop running timer
          setIsTimerRunning(false);
          setCountdownSeconds(null);
          setIsTicking(true);
          if (navigator.vibrate) navigator.vibrate(30);
        } else if (isTicking) {
          // Stop ticking real time, enter drag mode
          setIsTicking(false);
          if (navigator.vibrate) navigator.vibrate(40);
        } else {
          // Resume real-time ticking
          setIsTicking(true);
          if (navigator.vibrate) navigator.vibrate(20);
        }
        return;
      }
    }

    if (isTicking || isTimerRunning) return; // Cannot drag while ticking or counting down

    // 2. Determine which hand is closer to the click angle
    const currentHourAngle = (hourVal % 12) * 30 + minuteVal * 0.5;
    const currentMinuteAngle = minuteVal * 6;

    const diffHour = angleDiff(angle, currentHourAngle);
    const diffMin = angleDiff(angle, currentMinuteAngle);

    setIsDragging(true);
    setDragHand(diffMin < diffHour ? "minute" : "hour");
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isTicking || isTimerRunning) return;
    const { angle } = getPointerAngleAndDist(e);

    if (dragHand === "minute") {
      const newMin = Math.round(angle / 6) % 60;
      if (newMin !== minuteVal) {
        setMinuteVal(newMin);
        if (navigator.vibrate) navigator.vibrate(8);
        checkPasswordMatch(hourVal, newMin);
      }
    } else if (dragHand === "hour") {
      let newHour = Math.round(angle / 30) % 12;
      if (newHour === 0) newHour = 12;
      if (newHour !== hourVal) {
        setHourVal(newHour);
        if (navigator.vibrate) navigator.vibrate(15);
        checkPasswordMatch(newHour, minuteVal);
      }
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragHand(null);
      checkPasswordMatch(hourVal, minuteVal);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
    } else {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    }
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, dragHand, hourVal, minuteVal]);

  const handleSaveSetup = () => {
    if (mode === "setup" && onSave) {
      onSave({ hour: hourVal, minute: minuteVal });
    }
  };

  // Start study countdown timer based on hand positions
  const handleStartTimer = () => {
    // Treat hour hand (1-12) as hours (if not 12) and minutes as minutes
    let hrs = hourVal === 12 ? 0 : hourVal;
    let mins = minuteVal;
    
    // Fallback if set to exactly 12:00 (0h 0m), default to 25 mins (Pomodoro)
    if (hrs === 0 && mins === 0) {
      mins = 25;
      setHourVal(12);
      setMinuteVal(25);
    }

    const totalSeconds = (hrs * 3600) + (mins * 60);
    setCountdownSeconds(totalSeconds);
    setIsTimerRunning(true);
    setIsTicking(false);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const applyPreset = (hrs, mins) => {
    setIsTicking(false);
    setHourVal(hrs === 0 ? 12 : hrs);
    setMinuteVal(mins);
    const totalSeconds = (hrs * 3600) + (mins * 60);
    setCountdownSeconds(totalSeconds);
    setIsTimerRunning(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setCountdownSeconds(null);
    setIsTicking(true);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  // Determine hands positions for rendering
  let renderHr = hourVal;
  let renderMin = minuteVal;
  let renderSec = secondVal;

  if (isTimerRunning && countdownSeconds !== null) {
    const remMins = Math.floor(countdownSeconds / 60);
    const remSecs = countdownSeconds % 60;
    const remHrs = Math.floor(remMins / 60) % 12 || 12;

    renderHr = remHrs;
    renderMin = remMins % 60;
    renderSec = remSecs;
  }

  // Convert hours/minutes to SVG angles
  const minAngle = renderMin * 6;
  const hrAngle = (renderHr % 12) * 30 + renderMin * 0.5;
  const secAngle = renderSec * 6;

  // Generate ticks for the clock face (60 minutes/seconds)
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const angle = i * 6;
    const isHour = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    return (
      <line
        key={i}
        x1="100"
        y1="12"
        x2="100"
        y2={isQuarter ? "22" : isHour ? "18" : "15"}
        stroke={isQuarter ? "#ffffff" : isHour ? "#71717a" : "#27272a"}
        strokeWidth={isQuarter ? "2" : isHour ? "1.5" : "0.75"}
        transform={`rotate(${angle}, 100, 100)`}
      />
    );
  });

  const padZero = (n) => n.toString().padStart(2, "0");

  // Format digital countdown string
  const formatCountdown = () => {
    if (countdownSeconds === null) return "00:00:00";
    const hrs = Math.floor(countdownSeconds / 3600);
    const mins = Math.floor((countdownSeconds % 3600) / 60);
    const secs = countdownSeconds % 60;
    return `${padZero(hrs)}:${padZero(mins)}:${padZero(secs)}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 font-sans text-white select-none ${
        isSuccess ? "animate-fadeOut" : ""
      }`}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to right, rgba(0, 0, 0, 0.5) 2px, transparent 2px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 2px, transparent 2px)
        `,
        backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
        backgroundColor: "#08080a"
      }}
    >
      <div 
        className={`w-full max-w-md bg-[#0e0e12]/90 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isShaking ? "animate-shake border-red-500/50 shadow-red-950/20" : ""
        }`}
      >
        {/* Glow styling */}
        <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

        {/* Title / Cover Header */}
        <h2 className="text-xl md:text-2xl font-black text-center tracking-tight mb-2 flex items-center gap-2">
          {mode === "setup" ? (
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Setup Focus Clock</span>
          ) : (
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Focus Study Clock</span>
          )}
        </h2>

        {/* Cover Subtitle */}
        <p className="text-zinc-500 text-xs md:text-sm text-center mb-6 max-w-xs leading-relaxed min-h-[40px]">
          {isTimerRunning ? (
            <span className="text-emerald-400 font-bold animate-pulse">🔥 Deep study session active. Focus on your work!</span>
          ) : isTicking ? (
            <span className="text-zinc-400">🕒 Real Time clock active. Tap the center button to set study countdown blocks.</span>
          ) : (
            <span className="text-teal-400 font-semibold">⚙️ Drag hands to select your study time duration.</span>
          )}
        </p>

        {/* CLOCK CONTAINER */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 mb-6 flex items-center justify-center">
          {/* Glassmorphic clock backplate */}
          <div className="absolute inset-0 rounded-full border border-zinc-800/60 bg-zinc-950/30 shadow-inner pointer-events-none" />
          
          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            className="w-full h-full relative z-10 cursor-pointer overflow-visible"
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            {/* SVG DEFS FOR GRADIENTS AND FILTERS */}
            <defs>
              <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.6" />
              </filter>
            </defs>

            {/* Glass clock outer borders */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="#27272a" strokeWidth="2.5" />
            <circle cx="100" cy="100" r="89" fill="none" stroke="#18181b" strokeWidth="0.5" />
            
            {/* Hour marks */}
            {ticks}

            {/* 12, 3, 6, 9 labels */}
            <text x="100" y="35" textAnchor="middle" fill="#e4e4e7" fontSize="11" fontWeight="800" fontFamily="sans-serif">12</text>
            <text x="165" y="104" textAnchor="middle" fill="#e4e4e7" fontSize="11" fontWeight="800" fontFamily="sans-serif">3</text>
            <text x="100" y="173" textAnchor="middle" fill="#e4e4e7" fontSize="11" fontWeight="800" fontFamily="sans-serif">6</text>
            <text x="35" y="104" textAnchor="middle" fill="#e4e4e7" fontSize="11" fontWeight="800" fontFamily="sans-serif">9</text>

            {/* Hour Hand (Sleek white bar with shadow) */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="54"
              stroke="#ffffff"
              strokeWidth={dragHand === "hour" ? "5.5" : "4.5"}
              strokeLinecap="round"
              filter="url(#handShadow)"
              transform={`rotate(${hrAngle}, 100, 100)`}
              className="transition-all duration-75"
            />
            {/* Inner accent strip on hour hand */}
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="58"
              stroke="#a1a1aa"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${hrAngle}, 100, 100)`}
              className="transition-all duration-75 pointer-events-none"
            />
            {/* Hour hand dragging highlight */}
            {!isTicking && !isTimerRunning && dragHand === "hour" && (
              <circle cx="100" cy="54" r="5" fill="#ffffff" opacity="0.8" transform={`rotate(${hrAngle}, 100, 100)`} />
            )}

            {/* Minute Hand (Sleek emerald bar with shadow) */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="34"
              stroke="#10b981"
              strokeWidth={dragHand === "minute" ? "4.5" : "3.5"}
              strokeLinecap="round"
              filter="url(#handShadow)"
              transform={`rotate(${minAngle}, 100, 100)`}
              className="transition-all duration-75"
            />
            {/* Inner accent strip on minute hand */}
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="38"
              stroke="#6ee7b7"
              strokeWidth="1.2"
              strokeLinecap="round"
              transform={`rotate(${minAngle}, 100, 100)`}
              className="transition-all duration-75 pointer-events-none"
            />
            {/* Minute hand dragging highlight */}
            {!isTicking && !isTimerRunning && dragHand === "minute" && (
              <circle cx="100" cy="34" r="4" fill="#10b981" opacity="0.8" transform={`rotate(${minAngle}, 100, 100)`} />
            )}

            {/* Second Hand (Sleek rose colored needle with circular counterweight) */}
            {(isTicking || isTimerRunning) && (
              <>
                <line
                  x1="100"
                  y1="115"
                  x2="100"
                  y2="24"
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  filter="url(#handShadow)"
                  transform={`rotate(${secAngle}, 100, 100)`}
                />
                <circle
                  cx="100"
                  cy="115"
                  r="2.5"
                  fill="#f43f5e"
                  filter="url(#handShadow)"
                  transform={`rotate(${secAngle}, 100, 100)`}
                />
              </>
            )}

            {/* CENTER BUTTON CAP (Polished layered button) */}
            <g 
              className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* Outer ring */}
              <circle
                cx="100"
                cy="100"
                r="10"
                fill="#18181b"
                stroke={isTimerRunning ? "#ef4444" : isTicking ? "#3f3f46" : "#10b981"}
                strokeWidth="1.5"
                filter="url(#handShadow)"
              />
              {/* Inner core */}
              <circle
                cx="100"
                cy="100"
                r="4.5"
                fill={isTimerRunning || isTicking ? "#f43f5e" : "#34d399"}
                className={isTimerRunning ? "animate-pulse" : ""}
              />
            </g>
          </svg>
        </div>

        {/* QUICK STUDY PRESETS */}
        {mode !== "setup" && !isTimerRunning && (
          <div className="flex gap-1.5 justify-center w-full mb-4">
            <button
              onClick={() => applyPreset(0, 15)}
              className="flex-1 py-2 px-0.5 bg-[#18181b]/80 border border-zinc-800/80 hover:border-emerald-500/30 hover:bg-emerald-950/10 text-zinc-400 hover:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              15m Focus
            </button>
            <button
              onClick={() => applyPreset(0, 25)}
              className="flex-1 py-2 px-0.5 bg-[#18181b]/80 border border-zinc-800/80 hover:border-emerald-500/30 hover:bg-emerald-950/10 text-zinc-400 hover:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              25m Pomo
            </button>
            <button
              onClick={() => applyPreset(0, 45)}
              className="flex-1 py-2 px-0.5 bg-[#18181b]/80 border border-zinc-800/80 hover:border-emerald-500/30 hover:bg-emerald-950/10 text-zinc-400 hover:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              45m Study
            </button>
            <button
              onClick={() => applyPreset(1, 0)}
              className="flex-1 py-2 px-0.5 bg-[#18181b]/80 border border-zinc-800/80 hover:border-emerald-500/30 hover:bg-emerald-950/10 text-zinc-400 hover:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              1h Deep
            </button>
          </div>
        )}

        {/* DIGITAL TRACKER PREVIEW */}
        <div className="flex flex-col items-center gap-1.5 px-6 py-3 bg-[#16161c]/80 border border-zinc-800/80 rounded-2xl shadow-inner mb-6 w-full text-center">
          <div className="font-mono text-2xl font-black tracking-widest bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {isTimerRunning ? (
              formatCountdown()
            ) : (
              <>
                {padZero(hourVal % 12 || 12)}:{padZero(minuteVal)}
                {isTicking && <span className="text-zinc-600 text-lg">:{padZero(secondVal)}</span>}
              </>
            )}
          </div>
          <div className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
            {isTimerRunning ? "Remaining Study Time" : isTicking ? "Current Real Time" : "Set Timer Duration"}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 w-full relative z-20">
          {mode === "setup" ? (
            <>
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSetup}
                disabled={isTicking}
                className={`flex-1 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isTicking
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/10 hover:brightness-110"
                }`}
              >
                Save Focus Target
              </button>
            </>
          ) : (
            // Unlock or Disable Mode (Disguised Study Timer Interface)
            <>
              {isTimerRunning ? (
                <button
                  onClick={handleStopTimer}
                  className="w-full py-3.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Stop Study Session
                </button>
              ) : (
                <>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleStartTimer}
                    disabled={isTicking}
                    className={`flex-1 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isTicking
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent"
                        : "bg-gradient-to-r from-teal-500 to-emerald-400 text-black shadow-lg shadow-teal-500/10 hover:brightness-110"
                    }`}
                  >
                    Start Study Timer
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Shake & Scale animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.95); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-fadeOut {
          animation: fadeOut 0.8s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default AppLockScreen;
