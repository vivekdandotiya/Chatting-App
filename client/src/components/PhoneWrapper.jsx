import React, { useState, useEffect } from "react";

function PhoneWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [screenState, setScreenState] = useState("off"); // 'off', 'lock', 'unlocked'
  const [passcode, setPasscode] = useState("");
  const [time, setTime] = useState(new Date());
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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
    <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center relative overflow-hidden font-sans">
      {/* PHONE DEVICE */}
      <div className="relative w-[380px] h-[820px] bg-black rounded-[3.5rem] border-[12px] border-[#1f1f1f] shadow-[0_0_50px_rgba(255,255,255,0.03),inset_0_0_10px_rgba(0,0,0,1)] ring-1 ring-white/10 flex flex-col shrink-0">
        
        {/* HARDWARE BUTTONS */}
        {/* Silence switch */}
        <div className="absolute top-24 -left-[15px] w-1 h-8 bg-[#1f1f1f] rounded-l-md border border-black/50 border-r-0"></div>
        {/* Volume up */}
        <div className="absolute top-40 -left-[16px] w-[5px] h-16 bg-[#1f1f1f] rounded-l-md border border-black/50 border-r-0"></div>
        {/* Volume down */}
        <div className="absolute top-60 -left-[16px] w-[5px] h-16 bg-[#1f1f1f] rounded-l-md border border-black/50 border-r-0"></div>
        {/* Power button */}
        <div 
          onClick={() => screenState === "off" ? setScreenState("lock") : setScreenState("off")}
          className="absolute top-44 -right-[16px] w-[5px] h-24 bg-[#2a2a2a] rounded-r-md cursor-pointer hover:bg-[#3f3f3f] transition border border-black/50 border-l-0 shadow-[2px_0_5px_rgba(255,255,255,0.1)] group flex items-center justify-center z-50"
          title="Toggle Power"
        >
          {screenState === "off" && (
            <div className="absolute right-[-40px] px-2 py-1 bg-white text-black text-[10px] rounded uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none whitespace-nowrap">
              Wake
            </div>
          )}
        </div>

        {/* DYNAMIC ISLAND / NOTCH */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-[inset_0_0_2px_rgba(255,255,255,0.05)] border border-[#0a0a0a]">
          {screenState !== "off" && (
            <>
              {/* Camera dot */}
              <div className="w-[14px] h-[14px] rounded-full bg-[#0a0a2a] ring-[1px] ring-blue-900/30 flex items-center justify-center">
                 <div className="w-[6px] h-[6px] rounded-full bg-black"></div>
                 <div className="absolute w-[2px] h-[2px] right-3 top-2 rounded-full bg-white/40 blur-[0.5px]"></div>
              </div>
            </>
          )}
        </div>

        {/* SCREEN CONTENT */}
        <div className="w-full h-full relative rounded-[2.8rem] overflow-hidden bg-black isolation flex flex-col shadow-[0_0_0_2px_rgba(0,0,0,1)] ring-1 ring-white/5">
          
          {screenState === "off" && (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none"></div>
            </div>
          )}

          {screenState === "lock" && (
            <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-between py-16 px-6 text-white relative select-none">
              
              <div className="flex flex-col items-center mt-6 animate-fadeIn">
                <svg className="w-5 h-5 mb-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9v-2c0-3.31-2.69-6-6-6S6 2.69 6 6v2c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4zm-2 0H8v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2z"/></svg>
                <div className="text-[5rem] font-light tracking-tighter mt-0 leading-none" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </div>
                <div className="text-[1.1rem] text-gray-200 mt-2 font-medium tracking-wide">
                  {time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>

              <div className="flex flex-col items-center w-full max-w-[280px] mb-8 z-10 animate-slideUp">
                <h3 className="text-white mb-6 font-medium tracking-wide">Enter Passcode</h3>
                
                {/* Dots */}
                <div className={`flex gap-5 mb-14 ${error ? "animate-wiggle" : ""}`}>
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-[14px] h-[14px] rounded-full border-[1.5px] ${passcode.length > i ? "bg-white border-white" : "border-white bg-transparent"} transition-all duration-150`}
                    ></div>
                  ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full px-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => handleKeyPress(num.toString())}
                      className="w-[72px] h-[72px] rounded-full bg-[#1e1e1e] hover:bg-[#333333] active:bg-[#4ddf] flex flex-col items-center justify-center transition-colors mx-auto"
                    >
                      <span className="text-[32px] font-normal leading-none mt-1">{num}</span>
                      <span className="text-[10px] tracking-widest text-[#8e8e8e] uppercase font-bold mt-1">
                        {num === 2 ? "ABC" : num === 3 ? "DEF" : num === 4 ? "GHI" : num === 5 ? "JKL" : num === 6 ? "MNO" : num === 7 ? "PQRS" : num === 8 ? "TUV" : num === 9 ? "WXYZ" : " "}
                      </span>
                    </button>
                  ))}
                  <div className="col-span-1 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setScreenState("off");
                          setPasscode("");
                        }}
                        className="text-[15px] font-medium text-white hover:text-gray-300 transition"
                      >
                        Cancel
                      </button>
                  </div>
                  <button 
                    onClick={() => handleKeyPress("0")}
                    className="w-[72px] h-[72px] rounded-full bg-[#1e1e1e] hover:bg-[#333333] flex flex-col items-center justify-center transition-colors mx-auto"
                  >
                    <span className="text-[32px] font-normal">0</span>
                  </button>
                  <div className="col-span-1 flex items-center justify-center">
                    {passcode.length > 0 && (
                      <button 
                        onClick={handleDelete}
                        className="text-[15px] font-medium text-white hover:text-gray-300 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fake torch/camera icons at bottom */}
              <div className="absolute bottom-10 left-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zM11 16h2v2h-2z"/></svg>
              </div>
              <div className="absolute bottom-10 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>

            </div>
          )}

          {screenState === "unlocked" && (
            <div className="w-full h-full bg-[#0a0a0a] text-black overflow-y-auto overflow-x-hidden flex flex-col scrollbar-hide">
              <div className="w-full min-h-full">
                {children}
              </div>
            </div>
          )}

        </div>
        
        {/* Home Indicator line */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white rounded-full z-[100] mix-blend-difference pointer-events-none"></div>
      </div>
      
      {screenState === "off" && (
        <div className="absolute top-10 flex items-center gap-3 animate-pulse">
           <svg className="w-6 h-6 text-white rotate-180 scale-y-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
           <span className="text-white font-medium tracking-widest uppercase">Click the physical power button on the right to wake</span>
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
        
        /* Hide scrollbar for the phone wrapper so the illusion doesn't break */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}

export default PhoneWrapper;
