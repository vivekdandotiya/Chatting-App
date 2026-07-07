import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* Inline keyframes (injected once) */
const styleId = "__signup-premium-styles";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const sheet = document.createElement("style");
  sheet.id = styleId;
  sheet.textContent = `
    @keyframes signupSlideUp {
      0%   { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0);    }
    }
    @keyframes signupGridMove {
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
    @keyframes signupShakeError {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px);  }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px);  }
    }
    @keyframes signupSpinner {
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
        animation: "signupGridMove 45s linear infinite"
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
    className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5"
    style={{ animation: "signupShakeError 0.45s ease" }}
  >
    <svg className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    <p className="text-red-600 text-xs font-semibold leading-snug">{message}</p>
  </div>
);

const OAuthButton = ({ children, icon }) => (
  <button
    type="button"
    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold
               bg-white border border-slate-200 text-slate-700 hover:text-black hover:border-slate-400 hover:bg-slate-50
               transition-all duration-300"
  >
    {icon}
    {children}
  </button>
);

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);

  // OTP states.
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

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

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;
    setPasswordStrength(strength);
  };

  const validateStep1 = () => {
    if (!name || !email || !password || !confirmPass) {
      setError("Please fill all fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (password.length < 5) {
      setError("Password must be at least 5 characters");
      return false;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain at least one letter and one number");
      return false;
    }
    if (password !== confirmPass) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions");
      return false;
    }
    return true;
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep1()) return;

    try {
      setLoading(true);
      setError("");
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`, { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        { name, email, password, otp }
      );

      localStorage.setItem("user", JSON.stringify(res.data));
      sessionStorage.setItem("user", JSON.stringify(res.data));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Wrong OTP?");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-slate-200";
    if (passwordStrength <= 2) return "bg-red-400";
    if (passwordStrength <= 3) return "bg-amber-400";
    return "bg-slate-900";
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs " +
    "focus:outline-none focus:border-slate-800 " +
    "transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed";

  const labelClass =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5";

  const renderStep1Form = () => (
    <form onSubmit={handleSendOTP} className="space-y-3">
      {/* NAME */}
      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={wakeServer}
          disabled={loading}
          className={inputClass}
        />
      </div>

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
            placeholder="Create password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              checkPasswordStrength(e.target.value);
            }}
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
        {password && (
          <div className="mt-1.5 space-y-1 px-0.5">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Strength</span>
              <span className="text-slate-600">
                {passwordStrength <= 2 ? "Weak" : passwordStrength <= 4 ? "Medium" : "Strong"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div>
        <label className={labelClass}>Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPass ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            onFocus={wakeServer}
            disabled={loading}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            disabled={loading}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors duration-200 disabled:opacity-40"
          >
            {showConfirmPass ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* T&C CHECKBOX */}
      <label className="flex items-start gap-2.5 cursor-pointer group mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 transition-all duration-300">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          disabled={loading}
          className="w-3.5 h-3.5 mt-0.5 rounded border border-slate-200 bg-slate-50 accent-slate-900 cursor-pointer"
        />
        <span className="text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors leading-normal">
          I agree to the <a href="#" className="text-slate-900 hover:underline font-bold">Terms</a> and <a href="#" className="text-slate-900 hover:underline font-bold">Privacy Policy</a>
        </span>
      </label>

      {/* CONTINUE BUTTON */}
      <button
        type="submit"
        disabled={loading || !agreeTerms}
        className="w-full py-3 mt-3 rounded-xl font-bold text-white text-[13px] uppercase tracking-wider
                   bg-slate-950 hover:bg-slate-800 active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200
                   flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <>
            <div
              className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full"
              style={{ animation: "signupSpinner 0.7s linear infinite" }}
            />
                    <span>{isWakingUp ? "Waking server..." : "Processing..."}</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <svg className="w-3.5 h-3.5 stroke-[2.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );

  const renderStep2Form = () => (
    <form onSubmit={handleFinalSignup} className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner text-center">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Verification Code
        </label>
        <input
          type="text"
          maxLength="6"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="w-full bg-transparent text-center text-4xl font-extrabold tracking-[0.4em] text-slate-950 focus:outline-none placeholder-slate-200"
          autoFocus
        />
        <p className="text-[10px] text-slate-400 mt-4 tracking-wider">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full py-4 rounded-xl font-bold text-white text-[14px] uppercase tracking-wider
                     bg-slate-950 hover:bg-slate-800 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div
                className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full"
                style={{ animation: "signupSpinner 0.7s linear infinite" }}
              />
              <span>Verifying...</span>
            </>
          ) : (
            "Verify & Sign Up"
          )}
        </button>

        <div className="flex flex-col items-center gap-3.5 mt-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors"
          >
            Edit Email Address
          </button>
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading}
            className="text-slate-900 hover:text-black text-xs font-bold underline underline-offset-4 decoration-slate-400 transition-colors"
          >
            Resend Code
          </button>
        </div>
      </div>
    </form>
  );

  const renderDivider = () => (
    <div className="my-4.5 flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold select-none">
        Or join with
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );

  const renderOAuth = () => (
    <div className="flex gap-3">
      <OAuthButton
        icon={
          <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      >
        Google
      </OAuthButton>
      <OAuthButton
        icon={
          <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        }
      >
        Apple
      </OAuthButton>
    </div>
  );

  const renderFooter = () => (
    <p className="text-center text-slate-400 text-xs mt-5">
      Already have an account?{" "}
      <button
        onClick={() => navigate("/login")}
        className="text-slate-900 hover:text-black font-bold transition-colors hover:underline underline-offset-2"
      >
        Sign in
      </button>
    </p>
  );

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex overflow-hidden bg-[#f4f4f5] text-slate-800 font-sans relative">
      {/* server status badge */}
      <ServerStatusBadge ready={isServerReady} />

      {/* LEFT COLUMN: SPECTACULAR ANIMATED HUD LOCK (Desktop only) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-slate-50 border-r border-slate-200/70 relative overflow-hidden">
        {/* Background mesh grid */}
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
        {/* Background mesh grid */}
        <BackgroundDecorations />

        {/* Mobile floating background lock (watermark layer visible only under lg breakpoint) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.035] lg:hidden scale-[1.3] z-0">
          <HighTechLockGraphic />
        </div>

        {/* Card container */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{ animation: "signupSlideUp 0.6s cubic-bezier(.16,1,.3,1) both" }}
        >
          <div className="relative p-5 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-100 overflow-hidden">
            
            {/* HEADER */}
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-3 overflow-hidden">
                <img src="/fevicon.png" alt="Varta Logo" className="w-6 h-6 object-contain invert brightness-100" />
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {step === 1 ? "Create Account" : "Verify Email"}
              </h1>
              <p className="text-slate-500 text-[11px] mt-1 font-medium px-4">
                {step === 1
                  ? "Join Varta to start chatting with friends"
                  : `We sent a code to ${email}`}
              </p>
            </div>

            {/* ERROR */}
            {error && <ErrorBanner message={error} />}

            {/* STEP 1 or STEP 2 FORM */}
            {step === 1 ? (
              <>
                {renderStep1Form()}
                {renderDivider()}
                {renderOAuth()}
              </>
            ) : (
              renderStep2Form()
            )}

            {/* FOOTER */}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
