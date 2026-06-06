import React, { useState, useEffect, useRef } from "react";

export default function StatusViewer({ userStory, onClose }) {
  const { user, statuses } = userStory;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef(null);
  const duration = 5000; // 5 seconds per status
  const intervalStep = 50; // Update progress every 50ms

  const activeStatus = statuses[currentIndex];

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next slide
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            // Completed all stories, close
            onClose();
            return 100;
          }
        }
        return prev + (intervalStep / duration) * 100;
      });
    }, intervalStep);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused, statuses.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    } else {
      setProgress(0); // Restart current slide
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      onClose(); // Exit
    }
  };

  const handleScreenTouchStart = () => {
    setIsPaused(true);
  };

  const handleScreenTouchEnd = (e, clickArea) => {
    setIsPaused(false);
    if (clickArea === "left") {
      handlePrev();
    } else if (clickArea === "right") {
      handleNext();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-[#070707] z-[250] flex flex-col justify-between font-sans select-none overflow-hidden animate-fadeIn">
      {/* BACKGROUND BLUR EFFECT */}
      {activeStatus.type === "image" ? (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${activeStatus.content})` }}
        ></div>
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-10 scale-110 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle, ${activeStatus.backgroundColor} 0%, transparent 80%)` }}
        ></div>
      )}

      {/* TOP CONTROLS */}
      <div className="absolute top-0 inset-x-0 p-5 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-[260] flex flex-col gap-4">
        {/* PROGRESS BARS */}
        <div className="flex gap-1.5 w-full">
          {statuses.map((_, idx) => {
            let widthVal = "0%";
            if (idx < currentIndex) widthVal = "100%";
            else if (idx === currentIndex) widthVal = `${progress}%`;

            return (
              <div key={idx} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all ease-linear"
                  style={{ 
                    width: widthVal,
                    transitionDuration: idx === currentIndex ? `${intervalStep}ms` : "0ms" 
                  }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* HEADER: USER DETAILS & CLOSE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-emerald-500/20 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 overflow-hidden flex items-center justify-center">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-emerald-400 font-extrabold text-sm">
                  {user.name?.split(" ").map(x => x[0]).join("").toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-white text-[14.5px] font-bold tracking-tight">{user.name}</h3>
              <p className="text-zinc-500 text-[11px] font-medium mt-0.5">{formatTime(activeStatus.createdAt)}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition z-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* STORY CONTENT (MIDDLE VIEW) */}
      <div 
        className="flex-1 flex items-center justify-center w-full h-full relative"
        onMouseDown={handleScreenTouchStart}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={handleScreenTouchStart}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* INTERACTIVE TAP REGIONS */}
        <div 
          onClick={() => handleScreenTouchEnd(null, "left")}
          className="absolute left-0 top-0 bottom-0 w-[30%] z-40 cursor-w-resize"
          title="Previous status"
        ></div>
        <div 
          onClick={() => handleScreenTouchEnd(null, "right")}
          className="absolute right-0 top-0 bottom-0 w-[30%] z-40 cursor-e-resize"
          title="Next status"
        ></div>

        {/* CONTENT DISPLAY */}
        {activeStatus.type === "text" ? (
          <div 
            style={{ backgroundColor: activeStatus.backgroundColor }}
            className="w-full h-full flex items-center justify-center px-8 text-center text-white text-2xl font-bold leading-normal break-words"
          >
            <span className="max-w-xl drop-shadow-lg">{activeStatus.content}</span>
          </div>
        ) : (
          <div className="w-full h-full max-h-[80vh] max-w-4xl relative z-30 p-4 flex items-center justify-center">
            <img 
              src={activeStatus.content} 
              alt="Status" 
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/[0.05]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
