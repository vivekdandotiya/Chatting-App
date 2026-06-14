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
  
  const svgRef = useRef(null);
  const timerRef = useRef(null);

  // ⏰ REAL TIME TICKING EFFECT
  useEffect(() => {
    if (!isTicking) {
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
  }, [isTicking]);

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

  const handlePointerDown = (e) => {
    e.preventDefault();
    const { angle, dist } = getPointerAngleAndDist(e);

    // 1. Check if clicked center dot (lock target)
    // In our SVG coordinates (viewBox 0-200), center is (100,100).
    // Center circle has a radius of 20. Relative to bounding box width, we check dist.
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const centerThreshold = (rect.width / 2) * 0.20; // 20% of radius
      
      if (dist < centerThreshold) {
        if (isTicking) {
          setIsTicking(false);
          // Vibrate on stop ticking
          if (navigator.vibrate) navigator.vibrate(40);
        }
        return;
      }
    }

    if (isTicking) return; // Cannot drag while ticking

    // 2. Determine which hand is closer to the click angle
    const currentHourAngle = (hourVal % 12) * 30 + minuteVal * 0.5;
    const currentMinuteAngle = minuteVal * 6;

    const diffHour = angleDiff(angle, currentHourAngle);
    const diffMin = angleDiff(angle, currentMinuteAngle);

    setIsDragging(true);
    setDragHand(diffMin < diffHour ? "minute" : "hour");
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isTicking) return;
    const { angle } = getPointerAngleAndDist(e);

    if (dragHand === "minute") {
      // 360 degrees / 60 minutes = 6 degrees per minute
      const newMin = Math.round(angle / 6) % 60;
      if (newMin !== minuteVal) {
        setMinuteVal(newMin);
        if (navigator.vibrate) navigator.vibrate(8);
      }
    } else if (dragHand === "hour") {
      // 360 degrees / 12 hours = 30 degrees per hour
      let newHour = Math.round(angle / 30) % 12;
      if (newHour === 0) newHour = 12;
      if (newHour !== hourVal) {
        setHourVal(newHour);
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragHand(null);
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

  const handleAction = () => {
    if (mode === "unlock") {
      // Validate combination
      if (targetPassword && hourVal === targetPassword.hour && minuteVal === targetPassword.minute) {
        // Unlock success!
        setIsSuccess(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => {
          if (onUnlock) onUnlock();
        }, 800);
      } else {
        // Unlock failed: trigger shake & red glow
        setIsShaking(true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setTimeout(() => setIsShaking(false), 500);
      }
    } else if (mode === "setup") {
      // Save setup combination
      if (onSave) {
        onSave({ hour: hourVal, minute: minuteVal });
      }
    } else if (mode === "disable") {
      // Verify combination to disable
      if (targetPassword && hourVal === targetPassword.hour && minuteVal === targetPassword.minute) {
        if (onUnlock) onUnlock();
      } else {
        setIsShaking(true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  // Convert hours/minutes to SVG angles
  const minAngle = minuteVal * 6;
  const hrAngle = (hourVal % 12) * 30 + minuteVal * 0.5;
  const secAngle = secondVal * 6;

  // Generate ticks for the clock face (12 hours)
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = i * 30;
    const isPrimary = i % 3 === 0;
    return (
      <line
        key={i}
        x1="100"
        y1="15"
        x2="100"
        y2={isPrimary ? "23" : "19"}
        stroke={isPrimary ? "#fff" : "#4b5563"}
        strokeWidth={isPrimary ? "2" : "1"}
        transform={`rotate(${angle}, 100, 100)`}
      />
    );
  });

  const padZero = (n) => n.toString().padStart(2, "0");

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 bg-[#0a0a0c]/95 backdrop-blur-md font-sans text-white select-none ${
        isSuccess ? "animate-fadeOut" : ""
      }`}
    >
      <div 
        className={`w-full max-w-md bg-[#111115]/80 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isShaking ? "animate-shake border-red-500/50 shadow-red-950/20" : ""
        }`}
      >
        {/* Glow styling */}
        <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-black text-center tracking-tight mb-2 flex items-center gap-2">
          {mode === "setup" && (
            <>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Setup App Lock</span>
            </>
          )}
          {mode === "unlock" && (
            <>
              <svg className="w-5 h-5 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Varta App Locked</span>
            </>
          )}
          {mode === "disable" && (
            <>
              <span className="text-red-400">Disable App Lock</span>
            </>
          )}
        </h2>

        {/* Subtitle / Instructions */}
        <p className="text-zinc-500 text-xs md:text-sm text-center mb-6 max-w-xs leading-relaxed min-h-[40px]">
          {isTicking ? (
            <span className="animate-pulse text-zinc-400">⏰ Ticking... Tap the middle circle of the clock to stop time and enter password.</span>
          ) : (
            <span className="text-emerald-400 font-bold">🔓 Locked. Drag the Hour (White) and Minute (Green) hands to your password.</span>
          )}
        </p>

        {/* CLOCK CONTAINER */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 mb-6 flex items-center justify-center">
          {/* Glassmorphic clock backplate */}
          <div className="absolute inset-0 rounded-full border border-zinc-800 bg-zinc-950/20 shadow-inner pointer-events-none" />
          
          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            className="w-full h-full relative z-10 cursor-pointer overflow-visible"
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            {/* Clock boundary circle */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="#27272a" strokeWidth="1" />
            
            {/* Hour marks */}
            {ticks}

            {/* 12, 3, 6, 9 labels */}
            <text x="100" y="32" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="bold">12</text>
            <text x="172" y="103" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="bold">3</text>
            <text x="100" y="176" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="bold">6</text>
            <text x="28" y="103" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="bold">9</text>

            {/* Hour Hand (White, draggable) */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="50"
              stroke="#ffffff"
              strokeWidth={dragHand === "hour" ? "5" : "4.5"}
              strokeLinecap="round"
              transform={`rotate(${hrAngle}, 100, 100)`}
              className="transition-all duration-75"
            />
            {/* Hour hand dragging highlight */}
            {!isTicking && dragHand === "hour" && (
              <circle cx="100" cy="50" r="6" fill="#fff" transform={`rotate(${hrAngle}, 100, 100)`} />
            )}

            {/* Minute Hand (Green, draggable) */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="#10b981"
              strokeWidth={dragHand === "minute" ? "4" : "3.5"}
              strokeLinecap="round"
              transform={`rotate(${minAngle}, 100, 100)`}
              className="transition-all duration-75"
            />
            {/* Minute hand dragging highlight */}
            {!isTicking && dragHand === "minute" && (
              <circle cx="100" cy="30" r="5" fill="#10b981" transform={`rotate(${minAngle}, 100, 100)`} />
            )}

            {/* Second Hand (Red, only displays when ticking) */}
            {isTicking && (
              <line
                x1="100"
                y1="115"
                x2="100"
                y2="25"
                stroke="#ef4444"
                strokeWidth="1.5"
                transform={`rotate(${secAngle}, 100, 100)`}
              />
            )}

            {/* CENTER TAP TARGET TARGET (Center cap circle) */}
            <circle
              cx="100"
              cy="100"
              r="16"
              fill={isTicking ? "#1f2937" : "#065f46"}
              stroke={isTicking ? "#374151" : "#10b981"}
              strokeWidth="2.5"
              className="transition-all duration-300 hover:scale-105 active:scale-95"
            />
            
            {/* Glowing inner core in middle */}
            <circle
              cx="100"
              cy="100"
              r="6"
              fill={isTicking ? "#ef4444" : "#34d399"}
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* TIME PREVIEW PANEL */}
        <div className="flex flex-col items-center gap-1.5 px-6 py-3 bg-[#16161c]/80 border border-zinc-800/80 rounded-2xl shadow-inner mb-6 w-full text-center">
          <div className="font-mono text-2xl font-black tracking-widest bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent select-all">
            {padZero(hourVal)}:{padZero(minuteVal)}
            {isTicking && <span className="text-zinc-600 text-lg">:{padZero(secondVal)}</span>}
          </div>
          <div className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
            {isTicking ? "Current Real Time" : "Set Target Password"}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 w-full relative z-20">
          {(mode === "setup" || onCancel) && (
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 hover:bg-zinc-800"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleAction}
            disabled={isTicking}
            className={`flex-1 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isTicking
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent"
                : "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/10 hover:brightness-110"
            }`}
          >
            {mode === "unlock" && "Confirm Unlock"}
            {mode === "setup" && "Save Password"}
            {mode === "disable" && "Verify & Disable"}
          </button>
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
