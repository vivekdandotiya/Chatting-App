import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ───────────── Inline Keyframes & Custom Animations ───────────── */
const styleId = "__home-premium-styles";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const sheet = document.createElement("style");
  sheet.id = styleId;
  sheet.textContent = `
    @keyframes homeSilverFloat1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -40px) scale(1.1); }
    }
    @keyframes homeSilverFloat2 {
      0%, 100% { transform: translate(0, 0) scale(1.05); }
      50% { transform: translate(-40px, 30px) scale(0.95); }
    }
    @keyframes homeMockupFloat {
      0%, 100% { transform: translateY(0px) rotate(0.5deg); }
      50% { transform: translateY(-8px) rotate(-0.5deg); }
    }
    @keyframes homeFadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes homeGridMove {
      0% { background-position: 0 0; }
      100% { background-position: 40px 40px; }
    }
    @keyframes homePulseGlow {
      0%, 100% { box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1), 0 0 1px 0 rgba(0, 0, 0, 0.2); }
      50% { box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.25), 0 0 1px 0 rgba(0, 0, 0, 0.3); }
    }
  `;
  document.head.appendChild(sheet);
}

/* ───────────── Background Patterns & Silver Orbs ───────────── */
const BackgroundDecorations = () => (
  <>
    {/* Crisp Minimal Grid Pattern with distinct visible lines */}
    <div 
      className="absolute inset-0 opacity-100 pointer-events-none"
      style={{
        backgroundImage: "linear-gradient(to right, #cbd5e1 1.5px, transparent 1.5px), linear-gradient(to bottom, #cbd5e1 1.5px, transparent 1.5px)",
        backgroundSize: "48px 48px",
        animation: "homeGridMove 35s linear infinite"
      }}
    />
    
    {/* Soft Monochrome Silver Blurs (Professional depth) */}
    <div
      className="pointer-events-none absolute top-[-15%] left-[-15%] w-[45vw] h-[45vw] rounded-full opacity-[0.05] blur-[80px]"
      style={{
        background: "radial-gradient(circle, #64748b 0%, transparent 70%)",
        animation: "homeSilverFloat1 20s ease-in-out infinite",
      }}
    />
    <div
      className="pointer-events-none absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] rounded-full opacity-[0.04] blur-[100px]"
      style={{
        background: "radial-gradient(circle, #94a3b8 0%, transparent 70%)",
        animation: "homeSilverFloat2 25s ease-in-out infinite",
      }}
    />
  </>
);

/* ───────────── Reusable Feature Card Component ───────────── */
const FeatureCard = ({ title, desc, iconSvg, delay }) => (
  <div
    className="group relative p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-400 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 hover:translate-y-[-4px]"
    style={{
      animation: `homeFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`
    }}
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-slate-50 border border-slate-200 group-hover:scale-105 transition-all duration-300">
      <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        {iconSvg}
      </svg>
    </div>
    
    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-black transition-colors duration-300">
      {title}
    </h3>
    <p className="text-slate-500 text-sm leading-relaxed">
      {desc}
    </p>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    // Check if session user exists
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      navigate("/chat");
    }

    // Scroll listener for sticky header styling
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStart = () => {
    if (isLoggedIn) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#f4f4f5] text-slate-800 font-sans selection:bg-slate-900 selection:text-white">
      {/* Background patterns */}
      <BackgroundDecorations />

      {/* HEADER / NAVIGATION */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-slate-200/80 py-4 shadow-sm"
            : "bg-transparent border-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
              <img src="/fevicon.png" alt="Varta Logo" className="w-6 h-6 object-contain invert brightness-100" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">
              Varta
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => navigate("/chat")}
                className="px-4.5 py-2 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition-all duration-300"
              >
                Go to Chat Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 active:scale-95 transition-all duration-300 shadow-sm"
                >
                  Join Varta
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Subtle Pill Badge */}
        <div 
          className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200"
          style={{ animation: "homeFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800">
            Realtime Communication Suite
          </span>
        </div>

        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-950 max-w-4xl leading-[1.08] mb-6"
          style={{ 
            animation: "homeFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
          }}
        >
          Connect instantly, chat freely & play with{" "}
          <span className="underline decoration-slate-300 underline-offset-8">
            Varta Buddy
          </span>
        </h1>

        <p
          className="text-slate-500 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed mb-10"
          style={{ animation: "homeFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }}
        >
          Varta is the premium, secure, real-time messaging space tailored for you. 
          Send instant messages, post status updates, and challenge your friends in the fully integrated Game Zone!
        </p>

        {/* HERO CTA BUTTON ("Start Conversation buddy..") */}
        <div
          className="mb-16 z-20"
          style={{ animation: "homeFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both" }}
        >
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl font-bold text-white text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-slate-950 hover:bg-slate-800"
            style={{
              animation: "homePulseGlow 4s ease-in-out infinite",
            }}
          >
            <span className="flex items-center gap-3">
              <span>Start Conversation buddy..</span>
              <svg className="w-4 h-4 stroke-[2.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </button>
        </div>

        {/* PREMIUM INTERACTIVE MOCKUP SHOWCASE */}
        <div 
          className="w-full max-w-3xl flex flex-col items-center gap-6 mt-6 px-4"
          style={{
            animation: "homeFadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both"
          }}
        >
          {/* Tab Selector Controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === "chat"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Chat Dashboard
            </button>
            <button
              onClick={() => setActiveTab("game")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === "game"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Game Zone
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Login Portal
            </button>
          </div>

          {/* Browser Frame Window */}
          <div
            className="w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/80 relative overflow-hidden"
            style={{
              animation: "homeMockupFloat 6s ease-in-out infinite",
            }}
          >
            {/* Top mockup chrome bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="px-5 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-400 font-mono tracking-wider select-none">
                {activeTab === "chat" && "varta.com/chat"}
                {activeTab === "game" && "varta.com/chat?game=list"}
                {activeTab === "login" && "varta.com/login"}
              </div>
              <div className="w-10" />
            </div>

            {/* Dynamic Sliding Image Panel */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-50 border-t border-slate-100">
              <img
                src={
                  activeTab === "chat"
                    ? "/varta_chat.png"
                    : activeTab === "game"
                    ? "/varta_game.png"
                    : "/varta_login.png"
                }
                alt="Varta Chat App Interface"
                key={activeTab}
                className="w-full h-full object-cover rounded-b-xl select-none animate-[homeFadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-20 sm:py-28 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-3">
            Minimalist Design, Maximum Performance
          </h2>
          <div className="h-1 w-12 bg-slate-900 rounded-full mb-5" />
          <p className="text-slate-500 text-sm sm:text-base max-w-md">
            Everything you need for seamless digital connections, combined in an optimized browser application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <FeatureCard
            title="Real-Time Chats"
            desc="Exquisite messaging built on top of high speed WebSockets. Share messages instantly with zero lag."
            iconSvg={
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            }
            delay={0.1}
          />
          <FeatureCard
            title="Game Zone"
            desc="Bored of just talking? Challenge your chat buddy in interactive web games directly inside your session."
            iconSvg={
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            }
            delay={0.2}
          />
          <FeatureCard
            title="Status updates"
            desc="Broadcast short moments, quotes, or graphics to your contact list. Automatically active for 24 hours."
            iconSvg={
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM10.5 12.75a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            }
            delay={0.3}
          />
          <FeatureCard
            title="Secure Storage"
            desc="Varta guards session storage using highly isolated client keys, verifying and authenticating all queries."
            iconSvg={
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
            }
            delay={0.4}
          />
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section className="py-20 sm:py-28 px-6 bg-slate-50 border-y border-slate-200/80 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-3">
              Get Started In 3 Easy Steps
            </h2>
            <div className="h-1 w-12 bg-slate-900 rounded-full mb-5" />
            <p className="text-slate-500 text-sm sm:text-base max-w-sm">
              Start chatting with your buddy in less than a minute. No complicated setup required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[1px] bg-slate-200 -z-10" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-950 font-bold text-base mb-6 shadow-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2.5">Quick Setup</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Click "Start Conversation buddy.." and sign up in seconds to secure your chat profile.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-950 font-bold text-base mb-6 shadow-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2.5">Add your Buddy</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Send an invite to your buddy using their email address. Once accepted, they appear instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-950 font-bold text-base mb-6 shadow-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2.5">Chat & Play</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Send messages or status updates, and open the Game Zone for a friendly match!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-20 sm:py-28 px-6 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-3">
            Frequently Asked Questions
          </h2>
          <div className="h-1 w-12 bg-slate-900 rounded-full mb-5" />
        </div>

        <div className="space-y-5">
          <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Is my data and conversation safe?
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Absolutely. Varta utilizes local session credentials and isolated endpoint verification. Chats are managed through an active WebSocket server which prevents data logging when closed.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              What is the "Game Zone" and how do I use it?
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              The Game Zone is a built-in game panel where you can play quick, lightweight games (like Tic-Tac-Toe, Guessing games, etc.) right beside your message container. To open it, click the "Open Game Zone" button at the bottom of your chat list.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Can I use Varta on my mobile phone?
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Yes, Varta is fully responsive. On mobile displays, the sidebar collapses into a clean bottom-sheet navigation mode so you can swap between chats and features with ease.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 sm:py-28 px-6 text-center border-t border-slate-200 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-4">
            Ready to Connect with Your Buddy?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-md leading-relaxed mb-8">
            Sign up now and start talking, sharing status updates, or challenging friends in real time. It is completely free.
          </p>

          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl font-bold text-white text-xs uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-slate-950 hover:bg-slate-800"
            style={{
              animation: "homePulseGlow 4s ease-in-out infinite",
            }}
          >
            Start Conversation buddy..
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-200 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 tracking-tight">Varta</span>
            <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
