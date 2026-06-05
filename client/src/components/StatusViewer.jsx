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
    // If it was a quick tap, navigate
    // clickArea can be "left" or "right"
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
    <div className="fixed inset-0 bg-black z-[250] flex flex-col justify-between font-sans select-none overflow-hidden animate-fadeIn">
      {/* BACKGROUND FOR IMAGE */}
      {activeStatus.type === "image" && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${activeStatus.content})` }}
        ></div>
      )}

      {/* TOP CONTROLS */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-[260] flex flex-col gap-3">
        {/* PROGRESS BARS */}
        <div className="flex gap-1.5 w-full">
          {statuses.map((_, idx) => {
            let widthVal = "0%";
            if (idx < currentIndex) widthVal = "100%";
            else if (idx === currentIndex) widthVal = `${progress}%`;

            return (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear"
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
            <div className="w-10 h-10 rounded-full border border-white/20 bg-zinc-800 overflow-hidden flex items-center justify-center">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user.name?.split(" ").map(x => x[0]).join("").toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-white text-[15px] font-bold tracking-tight">{user.name}</h3>
              <p className="text-white/60 text-xs mt-0.5">{formatTime(activeStatus.createdAt)}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span className="max-w-xl">{activeStatus.content}</span>
          </div>
        ) : (
          <div className="w-full h-full max-h-[85vh] max-w-4xl relative z-30 p-2 flex items-center justify-center">
            <img 
              src={activeStatus.content} 
              alt="Status" 
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
