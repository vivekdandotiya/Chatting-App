import React, { useState, useEffect } from "react";

function PhoneWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scale, setScale] = useState(1);
  const [screenState, setScreenState] = useState("off"); // 'off', 'lock', 'unlocked'
  const [passcode, setPasscode] = useState("");
  const [time, setTime] = useState(new Date());
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      
      if (!mobileCheck) {
        // Reduced to 0.85 to make the overall phone slightly smaller vertically on the screen
        const availableHeight = window.innerHeight * 0.85;
        const availableWidth = window.innerWidth * 0.95;
        
        // Physical footprint includes 12px borders -> 800 + 24 = 824px height
        const scaleH = availableHeight / 824;
        const scaleW = availableWidth / 384; // 360 + 24px borders
        
        // Scale down if monitor is small. Don't scale up past 1x to avoid blurriness.
        setScale(Math.min(1, scaleH, scaleW));
      }
    };
    
    handleResize(); // Initial setup
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (passcode.length < 4) {
      const newPass = passcode + num;
      setPasscode(newPass);
      if (newPass.length === 4) {
        setTimeout(() => {
          if (newPass === "1234") {
            setScreenState("unlocked");
            setPasscode("");
          } else {
            setError(true);
            setTimeout(() => {
              setError(false);
              setPasscode("");
            }, 400); // wiggle duration
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
  };

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] flex items-center justify-center relative font-sans overflow-hidden">
      {/* PHONE DEVICE - ABSOLUTE PIXEL SIZING W/ CSS SCALING */}
      {/* Reduced to 360x800 for a slightly thinner and tighter aspect ratio */}
      <div 
        className="relative bg-black rounded-[3rem] border-[12px] border-black ring-[3px] ring-[#3a3a3c] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col shrink-0"
        style={{ 
          width: "360px", 
          height: "800px", 
          transform: `scale(${scale})`, 
          transformOrigin: "center center" 
        }}
      >
        
        {/* HARDWARE BUTTONS */}
        {/* Silence switch */}
        <div className="absolute top-[102px] -left-[15px] w-[3px] h-[25px] bg-[#3a3a3c] rounded-l-sm"></div>
        {/* Volume up */}
        <div className="absolute top-[168px] -left-[16px] w-[4px] h-[55px] bg-[#3a3a3c] rounded-l-sm"></div>
        {/* Volume down */}
        <div className="absolute top-[252px] -left-[16px] w-[4px] h-[55px] bg-[#3a3a3c] rounded-l-sm"></div>
        {/* Power button */}
        <div 
          onClick={() => screenState === "off" ? setScreenState("lock") : setScreenState("off")}
          className="absolute top-[210px] -right-[16px] w-[4px] h-[85px] bg-[#3a3a3c] rounded-r-sm cursor-pointer hover:bg-[#5a5a5c] transition group z-50 flex items-center justify-center"
          title="Toggle Power"
        >
          {screenState === "off" && (
            <div className="absolute right-[-50px] px-2 py-1 bg-white text-black text-[10px] rounded uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none whitespace-nowrap">
              Wake
            </div>
          )}
        </div>

        {/* DYNAMIC ISLAND / NOTCH - Fixed size */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[35px] flex items-center justify-end px-3 z-[60]">
          <div className="w-full h-full bg-black rounded-full shadow-[inset_0_0_2px_rgba(255,255,255,0.08)] flex items-center justify-end px-2">
            {screenState !== "off" && (
              /* Camera dot */
              <div className="w-[10px] h-[10px] rounded-full bg-[#0a0a2a] ring-[1px] ring-blue-900/40 relative">
                <div className="w-[4px] h-[4px] rounded-full bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute w-[1.5px] h-[1.5px] right-1 top-1 rounded-full bg-white/40 blur-[0.5px]"></div>
              </div>
            )}
          </div>
        </div>

        {/* SCREEN CONTENT */}
        <div className="w-full h-full relative rounded-[2.3rem] overflow-hidden bg-black flex flex-col isolation">
          
          {screenState === "off" && (
            <div className="w-full h-full bg-black"></div>
          )}

          {screenState === "lock" && (
            <div className="w-full h-full bg-[#000000] flex flex-col items-center justify-between py-[90px] px-6 text-white relative select-none">
              
              {/* LOCKSCREEN CLOCK & DATE */}
              <div className="flex flex-col items-center mt-6 animate-fadeIn w-full">
                <svg className="w-5 h-5 mb-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9v-2c0-3.31-2.69-6-6-6S6 2.69 6 6v2c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4zm-2 0H8v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2z"/></svg>
                <div className="font-light tracking-tighter mt-1 leading-none text-center w-full text-[5.5rem]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </div>
                <div className="text-xl text-gray-200 mt-2 font-medium tracking-wide">
                  {time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>

              {/* KEYPAD AREA */}
              <div className="flex flex-col items-center w-full max-w-[300px] mb-4 animate-slideUp shrink-0">
                <h3 className="text-white mb-8 font-medium tracking-wide text-base">Enter Passcode</h3>
                
                {/* Dots */}
                <div className={`flex gap-6 mb-12 w-[60%] justify-center ${error ? "animate-wiggle" : ""}`}>
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-[14px] h-[14px] rounded-full border-[1.5px] ${passcode.length > i ? "bg-white border-white" : "border-white bg-transparent"} transition-all duration-150`}
                    ></div>
                  ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-4 w-full px-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => handleKeyPress(num.toString())}
                      className="w-[75px] h-[75px] rounded-full bg-[#1e1e1e]/60 hover:bg-[#333333] active:bg-[#555555] flex flex-col items-center justify-center transition-colors text-white"
                    >
                      <span className="text-[2.2rem] font-light leading-none">{num}</span>
                      <span className="text-[0.6rem] tracking-[0.15em] text-[#8e8e8e] uppercase font-bold mt-1">
                        {num === 2 ? "ABC" : num === 3 ? "DEF" : num === 4 ? "GHI" : num === 5 ? "JKL" : num === 6 ? "MNO" : num === 7 ? "PQRS" : num === 8 ? "TUV" : num === 9 ? "WXYZ" : " "}
                      </span>
                    </button>
                  ))}
                  
                  {/* Bottom Row */}
                  <div className="col-span-1 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setScreenState("off");
                          setPasscode("");
                        }}
                        className="text-base font-medium text-white/80 hover:text-white transition"
                      >
                        Cancel
                      </button>
                  </div>
                  <button 
                    onClick={() => handleKeyPress("0")}
                    className="w-[75px] h-[75px] rounded-full bg-[#1e1e1e]/60 hover:bg-[#333333] active:bg-[#555555] flex flex-col items-center justify-center transition-colors text-white"
                  >
                    <span className="text-[2.2rem] font-light leading-none">0</span>
                  </button>
                  <div className="col-span-1 flex items-center justify-center">
                    {passcode.length > 0 && (
                      <button 
                        onClick={handleDelete}
                        className="text-base font-medium text-white/80 hover:text-white transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fake torch/camera icons at bottom */}
              <div className="absolute bottom-10 left-10 w-[50px] h-[50px] rounded-full bg-[#1e1e1e]/60 flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zM11 16h2v2h-2z"/></svg>
              </div>
              <div className="absolute bottom-10 right-10 w-[50px] h-[50px] rounded-full bg-[#1e1e1e]/60 flex items-center justify-center">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>

            </div>
          )}

          {screenState === "unlocked" && (
            <div className="w-full h-full bg-[#0a0a0a] text-black relative">
              {/* Safe Area View Wrapper */}
              <div className="absolute top-0 left-0 right-0 bottom-0 pt-[47px] pb-[34px] overflow-hidden">
                <div className="w-full h-full relative custom-dvh-fix overflow-y-auto overflow-x-hidden scrollbar-hide">
                  {children}
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Home Indicator line */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[135px] h-[5px] bg-white rounded-full z-[100] mix-blend-difference pointer-events-none"></div>
      </div>
      
      {screenState === "off" && (
        <div className="absolute top-10 flex items-center gap-3 animate-pulse">
           <svg className="w-6 h-6 text-white rotate-180 scale-y-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
           <span className="text-white font-medium tracking-widest uppercase text-sm">Click the physical power button on the right</span>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-15px); }
          75% { transform: translateX(15px); }
        }
        .animate-wiggle {
          animation: wiggle 0.15s ease-in-out 3;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
        
        /* Forces standard UI elements inside to bound to the safe area instead of exploding to max-dvh */
        .custom-dvh-fix > * {
           height: 100% !important;
           min-height: 100% !important;
           max-height: 100% !important;
        }

        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none; 
            scrollbar-width: none; 
        }
      `}</style>
    </div>
  );
}

export default PhoneWrapper;
