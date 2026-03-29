import React from 'react';

export default function ExperienceGateway({ setMode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      
      <div className="mb-16 text-center animate-slideDown z-10">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 select-none">Choose Your Experience</h1>
        <p className="text-[#8e8e93] text-lg select-none">How would you like to launch the Application?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10 animate-fadeIn">
        
        {/* Phone Experience Card */}
        <div 
          onClick={() => setMode('phone')}
          className="group relative cursor-pointer rounded-[2rem] bg-[#121212] border border-[#27272a] p-10 hover:border-[#555] hover:bg-[#18181b] transition-all duration-300 flex flex-col items-center text-center shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
        >
          <div className="w-24 h-24 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner">
             <svg className="w-12 h-12 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Phone Simulator</h2>
          <p className="text-[#8e8e93] text-[15px] leading-relaxed max-w-[280px]">
            Experience the app exclusively wrapped in a fully interactive, native iPhone 14 Pro interface.
          </p>
        </div>

        {/* Windows Experience Card */}
        <div 
          onClick={() => setMode('windows')}
          className="group relative cursor-pointer rounded-[2rem] bg-[#121212] border border-[#27272a] p-10 hover:border-[#555] hover:bg-[#18181b] transition-all duration-300 flex flex-col items-center text-center shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
        >
          <div className="w-24 h-24 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner">
             <svg className="w-12 h-12 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Windows Desktop</h2>
          <p className="text-[#8e8e93] text-[15px] leading-relaxed max-w-[280px]">
            Launch the classic full-screen desktop web application utilizing your entire monitor space.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
