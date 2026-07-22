import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* Inline keyframes (injected once) */
const styleId = "__login-premium-styles";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const sheet = document.createElement("style");
  sheet.id = styleId;
  sheet.textContent = `
    @keyframes loginSlideUp {
      0%   { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0);    }
    }
    @keyframes loginGridMove {
      0% { background-position: 0 0; }
      100% { background-position: 32px 32px; }
    }
    @keyframes lockShackle {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(4px); }
    }
    @keyframes hudRotateClockwise {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes hudRotateCounter {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    @keyframes shieldPulse {
      0%, 100% { opacity: 0.25; transform: scale(0.97); }
      50%      { opacity: 0.7; transform: scale(1.03); }
    }
    @keyframes loginShakeError {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px);  }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px);  }
    }
    @keyframes loginSpinner {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(sheet);
}

/* SVG icons */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

/* Background patterns */
const BackgroundDecorations = () => (
  <>
    {/* Tight, Data-focused Security Mesh Grid */}
    <div 
      className="absolute inset-0 opacity-100 pointer-events-none"
      style={{
        backgroundImage: "linear-gradient(to right, #cbd5e1 1.2px, transparent 1.2px), linear-gradient(to bottom, #cbd5e1 1.2px, transparent 1.2px)",
        backgroundSize: "32px 32px",
        animation: "loginGridMove 45s linear infinite"
      }}
    />
  </>
);

/* High-tech giant animated HUD lock */
const HighTechLockGraphic = () => (
  <div className="relative flex flex-col items-center justify-center select-none w-[360px] h-[360px]">
    {/* Radial gradient background glow */}
    <div className="absolute w-[280px] h-[280px] rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

    {/* Concentric HUD Rings */}
    <svg className="absolute w-full h-full text-slate-300" viewBox="0 0 200 200" fill="none" stroke="currentColor">
      {/* Outer Rotating HUD Ring */}
      <circle
        cx="100"
        cy="100"
        r="85"
        strokeWidth="1.5"
        strokeDasharray="25 10 50 15 15 8"
        style={{
          animation: "hudRotateClockwise 25s linear infinite",
          transformOrigin: "center"
        }}
      />
      {/* Inner Counter-Rotating Scanning Ring */}
      <circle
        cx="100"
        cy="100"
        r="73"
        strokeWidth="1"
        strokeDasharray="8 8 30 10 45 12"
        style={{
          animation: "hudRotateCounter 16s linear infinite",
          transformOrigin: "center"
        }}
      />
      {/* Target Crosshair Markers */}
      <path d="M100 5v12M100 183v12M5 100h12M183 100h12" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Pulse Shield Arcs */}
      <path
        d="M55 55 A 63 63 0 0 1 145 55"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          animation: "shieldPulse 2.5s ease-in-out infinite",
          transformOrigin: "center"
        }}
      />
      <path
        d="M55 145 A 63 63 0 0 0 145 145"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          animation: "shieldPulse 2.5s ease-in-out infinite",
          transformOrigin: "center"
        }}
      />
    </svg>

    {/* Center Lock Box */}
    <div className="relative z-10 w-24 h-24 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex items-center justify-center">
      {/* Inner grid texture inside the lock */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:6px_6px] opacity-[0.15]" />
      
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-slate-950 relative z-10"
      >
        {/* Shackle */}
        <path
          d="M7 11V7a5 5 0 0 1 10 0v4"
          style={{
            animation: "lockShackle 2.5s ease-in-out infinite",
            transformOrigin: "bottom center"
          }}
        />
        {/* Lock Body */}
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="white" stroke="currentColor" strokeWidth="2.2" />
        {/* Keyhole */}
        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        <path d="M12 17.5v2" strokeWidth="2.5" />
      </svg>
    </div>

    {/* Floating HUD Telemetry Label */}
    <div className="absolute bottom-6 text-center bg-white border border-slate-200/80 px-4 py-1.5 rounded-full shadow-sm">
      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        HUD Lock Active
      </span>
    </div>
  </div>
);

const ServerStatusBadge = ({ ready }) => (
  <div
    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full z-[100] backdrop-blur-md border border-slate-200 bg-white/85 shadow-sm transition-all duration-500"
  >
    <div
      className={`w-2 h-2 rounded-full ${ready ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}
      style={ready ? { boxShadow: "0 0 6px rgba(16,185,129,0.4)" } : { boxShadow: "0 0 6px rgba(239,68,68,0.3)" }}
    />
    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
      {ready ? "Server Ready" : "Server Waking..."}
    </span>
  </div>
);

const ErrorBanner = ({ message }) => (
  <div
    className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5"
    style={{ animation: "loginShakeError 0.45s ease" }}
  >
    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    <p className="text-red-600 text-xs font-semibold leading-snug flex-1">{message}</p>
  </div>
);

const SuccessBanner = ({ message }) => (
  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.6l-4.2-4.2 1.4-1.4L11 13.8l5.8-5.8 1.4 1.4L11 16.6z" />
    </svg>
    <p className="text-emerald-700 text-xs font-semibold leading-snug flex-1">{message}</p>
  </div>
);

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);

  // Proactive backend wake up.
  const wakeServer = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
      setIsServerReady(true);
    } catch (err) {
      console.log("Server still sleeping...");
    }
  };

  React.useEffect(() => {
    wakeServer();
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (user) {
      navigate("/chat");
    }
  }, [navigate]);

  React.useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setIsWakingUp(true), 3000);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        { email, password }
      );

      localStorage.setItem("user", JSON.stringify(res.data));
      sessionStorage.setItem("user", JSON.stringify(res.data));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const openResetMode = () => {
    setError("");
    setSuccess("");
    setIsResetMode(true);
    setResetStep(1);
    setResetEmail(email);
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPass("");
  };

  const closeResetMode = () => {
    setError("");
    setSuccess("");
    setIsResetMode(false);
    setResetStep(1);
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPass("");
  };

  const handleSendResetOTP = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetEmail) {
      setError("Please enter your account email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-reset-otp`, {
        email: resetEmail,
      });
      setResetStep(2);
      setSuccess("Reset code sent. Check your email and enter the 6-digit code below.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetOtp || resetOtp.length < 6) {
      setError("Please enter the 6-digit reset code");
      return;
    }

    if (resetPassword.length < 5) {
      setError("Password must be at least 5 characters");
      return;
    }

    if (!/[a-zA-Z]/.test(resetPassword) || !/\d/.test(resetPassword)) {
      setError("Password must contain at least one letter and one number");
      return;
    }

    if (resetPassword !== resetConfirmPass) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
        email: resetEmail,
        otp: resetOtp,
        password: resetPassword,
      });

      setEmail(resetEmail);
      setPassword("");
      setIsResetMode(false);
      setResetStep(1);
      setResetOtp("");
      setResetPassword("");
      setResetConfirmPass("");
      setSuccess("Password reset successfully. Sign in with your new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs " +
    "focus:outline-none focus:border-slate-800 " +
    "transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed";

  const labelClass =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5";

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex overflow-hidden bg-[#f4f4f5] text-slate-800 font-sans relative">
      {/* server status badge */}
      <ServerStatusBadge ready={isServerReady} />

      {/* LEFT COLUMN: SPECTACULAR ANIMATED HUD LOCK (Desktop only) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-slate-50 border-r border-slate-200/70 relative overflow-hidden">
        {/* Background decorations just for the lock side */}
        <BackgroundDecorations />
        
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <HighTechLockGraphic />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-6">
            End-to-End Privacy Guard
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
            Varta secures your real-time chats with isolated session tokens, active WebSocket connection scanning, and encrypted auth flows.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: COMPACT FORM CONTAINER */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden bg-white">
        {/* Background mesh grid for the card side */}
        <BackgroundDecorations />

        {/* Mobile floating background lock (watermark layer visible only under lg breakpoint) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.035] lg:hidden scale-[1.3] z-0">
          <HighTechLockGraphic />
        </div>

        {/* Card container */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{ animation: "loginSlideUp 0.6s cubic-bezier(.16,1,.3,1) both" }}
        >
          <div className="relative p-5 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-100 overflow-hidden">

            {/* HEADER */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-4 overflow-hidden">
                <img src="/fevicon.png" alt="Varta Logo" className="w-6 h-6 object-contain invert brightness-100" />
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {isResetMode ? "Reset Password" : "Welcome Back"}
              </h1>
              <p className="text-slate-500 text-[11px] mt-1 font-medium">
                {isResetMode
                  ? resetStep === 1
                    ? "Enter your email to receive a reset code"
                    : "Enter the code and choose a new password"
                  : "Sign in to continue to your Varta dashboard"}
              </p>
            </div>

            {/* ERROR */}
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}

            {/* RESET FORM */}
            {isResetMode && (
              resetStep === 1 ? (
                <form onSubmit={handleSendResetOTP} className="space-y-4">
                  <div>
                    <label className={labelClass}>Account Email</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onFocus={wakeServer}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white text-[13px] uppercase tracking-wider bg-slate-950 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full" style={{ animation: "loginSpinner 0.7s linear infinite" }} />
                        <span>{isWakingUp ? "Waking server..." : "Sending code..."}</span>
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeResetMode}
                    disabled={loading}
                    className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-900 transition disabled:opacity-40"
                  >
                    Back to sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reset Email</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{resetEmail}</p>
                  </div>

                  <div>
                    <label className={labelClass}>Verification Code</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      className={`${inputClass} text-center text-lg font-extrabold tracking-[0.35em]`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showResetPass ? "text" : "password"}
                        placeholder="Create new password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        disabled={loading}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPass(!showResetPass)}
                        disabled={loading}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors duration-200 disabled:opacity-40"
                      >
                        {showResetPass ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPass ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={resetConfirmPass}
                        onChange={(e) => setResetConfirmPass(e.target.value)}
                        disabled={loading}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                        disabled={loading}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors duration-200 disabled:opacity-40"
                      >
                        {showResetConfirmPass ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white text-[13px] uppercase tracking-wider bg-slate-950 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full" style={{ animation: "loginSpinner 0.7s linear infinite" }} />
                        <span>{isWakingUp ? "Waking server..." : "Resetting..."}</span>
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setResetStep(1);
                      }}
                      disabled={loading}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition disabled:opacity-40"
                    >
                      Edit email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendResetOTP}
                      disabled={loading}
                      className="text-xs font-bold text-slate-900 hover:text-black underline underline-offset-4 decoration-slate-400 transition disabled:opacity-40"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )
            )}

            {/* FORM */}
            {!isResetMode && <form onSubmit={handleLogin} className="space-y-4">
              {/* EMAIL */}
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={wakeServer}
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={wakeServer}
                    disabled={loading}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors duration-200 disabled:opacity-40"
                  >
                    {showPass ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* REMEMBER / FORGOT */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border border-slate-200 bg-slate-50 accent-slate-900 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={openResetMode}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-slate-900 transition-colors font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-[13px] uppercase tracking-wider
                           bg-slate-950 hover:bg-slate-800 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200
                           flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div
                      className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full"
                      style={{ animation: "loginSpinner 0.7s linear infinite" }}
                    />
                    <span>{isWakingUp ? "Waking server..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-3.5 h-3.5 stroke-[2.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>}

            {/* FOOTER */}
            {!isResetMode && <p className="text-center text-slate-400 text-xs mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-slate-900 hover:text-black font-bold transition-colors hover:underline underline-offset-2"
              >
                Sign up now
              </button>
            </p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
