import React from 'react';

const BackgroundOrbs = () => (
  <>
    <div
      className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-[0.06]"
      style={{
        background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
        animation: "float 20s ease-in-out infinite",
      }}
    />
    <div
      className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
      style={{
        background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
        animation: "float 25s ease-in-out 5s infinite",
      }}
    />
  </>
);

export default function ExperienceGateway({ setMode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#0c0c0c] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
      <BackgroundOrbs />
      
      <div className="mb-16 text-center animate-slideDown z-10">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 select-none">
          Choose Your <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Experience</span>
        </h1>
        <p className="text-zinc-500 text-lg select-none">How would you like to launch Varta?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10 animate-fadeIn">
        
        {/* Phone Experience Card */}
        <div 
          onClick={() => setMode('phone')}
          className="group relative cursor-pointer rounded-[2rem] bg-[#161616] border border-[#2a2a2a] p-10 hover:border-emerald-500/30 hover:bg-[#1c1c1c] transition-all duration-300 flex flex-col items-center text-center shadow-2xl hover:shadow-[0_0_50px_rgba(16,185,129,0.08)]"
        >
          <div className="w-24 h-24 rounded-2xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center mb-8 group-hover:scale-105 group-hover:border-emerald-500/30 group-hover:bg-gradient-to-tr group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300 shadow-inner">
             <svg className="w-12 h-12 text-zinc-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
             </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Phone Simulator</h2>
          <p className="text-zinc-500 text-[15px] leading-relaxed max-w-[280px]">
            Experience the app wrapped in a fully interactive, native iPhone 14 Pro simulator interface.
          </p>
        </div>

        {/* Windows Experience Card */}
        <div 
          onClick={() => setMode('windows')}
          className="group relative cursor-pointer rounded-[2rem] bg-[#161616] border border-[#2a2a2a] p-10 hover:border-emerald-500/30 hover:bg-[#1c1c1c] transition-all duration-300 flex flex-col items-center text-center shadow-2xl hover:shadow-[0_0_50px_rgba(16,185,129,0.08)]"
        >
          <div className="w-24 h-24 rounded-2xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center mb-8 group-hover:scale-105 group-hover:border-emerald-500/30 group-hover:bg-gradient-to-tr group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300 shadow-inner">
             <svg className="w-12 h-12 text-zinc-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
             </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Windows Desktop</h2>
          <p className="text-zinc-500 text-[15px] leading-relaxed max-w-[280px]">
            Launch the direct full-screen desktop web application utilizing your browser width.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
