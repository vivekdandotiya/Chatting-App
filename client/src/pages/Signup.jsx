import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ───────────── inline keyframes (injected once) ───────────── */
const styleId = "__signup-premium-styles";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const sheet = document.createElement("style");
  sheet.id = styleId;
  sheet.textContent = `
    @keyframes signupSlideUp {
      0%   { opacity: 0; transform: translateY(32px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @keyframes signupOrbFloat1 {
      0%, 100% { transform: translate(0, 0)   scale(1);   }
      50%      { transform: translate(30px, -50px) scale(1.1); }
    }
    @keyframes signupOrbFloat2 {
      0%, 100% { transform: translate(0, 0)   scale(1);   }
      50%      { transform: translate(-40px, 40px) scale(1.15); }
    }
    @keyframes signupGradientLine {
      0%   { background-position: 0% 50%;   }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%;   }
    }
    @keyframes signupPulseGlow {
      0%, 100% { box-shadow: 0 0 18px 2px rgba(16,185,129,0.25); }
      50%      { box-shadow: 0 0 28px 6px rgba(16,185,129,0.40); }
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

/* ───────────── SVG icons ───────────── */
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

const BackgroundOrbs = () => (
  <>
    <div
      className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-[0.07]"
      style={{
        background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
        animation: "signupOrbFloat1 14s ease-in-out infinite",
      }}
    />
    <div
      className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
      style={{
        background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
        animation: "signupOrbFloat2 18s ease-in-out infinite",
      }}
    />
  </>
);

const AnimatedGradientLine = () => (
  <div
    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
    style={{
      background: "linear-gradient(90deg, transparent, #10b981, #2dd4bf, #10b981, transparent)",
      backgroundSize: "200% 100%",
      animation: "signupGradientLine 4s ease infinite",
    }}
  />
);

const ServerStatusBadge = ({ ready }) => (
  <div
    className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full z-[100] backdrop-blur-md border transition-all duration-500 ${
      ready
        ? "bg-emerald-950/40 border-emerald-500/20"
        : "bg-red-950/30 border-red-500/20 animate-pulse"
    }`}
  >
    <div
      className={`w-2 h-2 rounded-full ${ready ? "bg-emerald-400" : "bg-red-400"}`}
      style={ready ? { boxShadow: "0 0 8px rgba(16,185,129,0.6)" } : { boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}
    />
    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
      {ready ? "Server Ready" : "Server Waking…"}
    </span>
  </div>
);

const ErrorBanner = ({ message }) => (
  <div
    className="mb-5 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3"
    style={{ animation: "signupShakeError 0.45s ease" }}
  >
    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    <p className="text-red-400 text-sm font-medium leading-snug">{message}</p>
  </div>
);

const OAuthButton = ({ children, icon }) => (
  <button
    type="button"
    className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium
               bg-white/[0.03] border border-[#2a2a2a] backdrop-blur-sm
               text-zinc-400 hover:text-white hover:border-emerald-500/30 hover:bg-white/[0.06]
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

  // 🛡️ OTP STATES
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [otp, setOtp] = useState("");

  // 🚀 PROACTIVE WAKE UP
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
  }, []);

  React.useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setIsWakingUp(true), 3000); // 3s delay
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const appMode = sessionStorage.getItem("appMode") || "phone";
  const isWindows = appMode === "windows";

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

      sessionStorage.setItem("user", JSON.stringify(res.data));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Wrong OTP?");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-zinc-700";
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-amber-500";
    if (passwordStrength <= 4) return "bg-emerald-500/70";
    return "bg-gradient-to-r from-emerald-500 to-teal-400";
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder-zinc-600 text-sm " +
    "focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 " +
    "transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed";

  const labelClass =
    "block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-0.5";

  /* ─── shared form step 1 ─── */
  const renderStep1Form = () => (
    <form onSubmit={handleSendOTP} className="space-y-4">
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 transition-colors duration-200 disabled:opacity-40"
          >
            {showPass ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        </div>
        {password && (
          <div className="mt-2 space-y-1.5 px-0.5">
            <div className="w-full h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Strength</span>
              <span className="text-zinc-400">
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 transition-colors duration-200 disabled:opacity-40"
          >
            {showConfirmPass ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* T&C CHECKBOX */}
      <label className="flex items-start gap-3 cursor-pointer group mt-2 p-2 rounded-xl bg-white/[0.01] border border-transparent hover:border-[#2a2a2a]/40 hover:bg-white/[0.03] transition-all duration-300">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 mt-0.5 rounded border border-[#2a2a2a] bg-[#111111] accent-emerald-500 cursor-pointer"
        />
        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors leading-normal">
          I agree to the <a href="#" className="text-emerald-400 hover:underline font-semibold">Terms</a> and <a href="#" className="text-emerald-400 hover:underline font-semibold">Privacy Policy</a>
        </span>
      </label>

      {/* CONTINUE BUTTON */}
      <button
        type="submit"
        disabled={loading || !agreeTerms}
        className="w-full py-3.5 mt-4 rounded-xl font-bold text-black text-[15px]
                   bg-gradient-to-r from-emerald-500 to-teal-400
                   hover:opacity-90 active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200
                   flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <>
            <div
              className="w-4 h-4 border-2 border-black/60 border-t-transparent rounded-full"
              style={{ animation: "signupSpinner 0.7s linear infinite" }}
            />
            <span>{isWakingUp ? "Waking up server…" : "Processing…"}</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );

  /* ─── shared form step 2 (OTP) ─── */
  const renderStep2Form = () => (
    <form onSubmit={handleFinalSignup} className="space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-inner text-center">
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
          Verification Code
        </label>
        <input
          type="text"
          maxLength="6"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="w-full bg-transparent text-center text-4xl font-extrabold tracking-[0.4em] text-white focus:outline-none placeholder-zinc-800"
          autoFocus
        />
        <p className="text-[10px] text-zinc-600 mt-4 tracking-wider">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full py-4 rounded-xl font-bold text-black text-[15px]
                     bg-gradient-to-r from-emerald-500 to-teal-400
                     hover:opacity-90 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div
                className="w-4 h-4 border-2 border-black/60 border-t-transparent rounded-full"
                style={{ animation: "signupSpinner 0.7s linear infinite" }}
              />
              <span>Verifying…</span>
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
            className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold transition-colors"
          >
            Edit Email Address
          </button>
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold underline underline-offset-4 decoration-emerald-500/30 transition-colors"
          >
            Resend Code
          </button>
        </div>
      </div>
    </form>
  );

  /* ─── shared divider ─── */
  const renderDivider = () => (
    <div className="my-7 flex items-center gap-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold select-none">
        Or join with
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
    </div>
  );

  /* ─── shared OAuth row ─── */
  const renderOAuth = () => (
    <div className="flex gap-3">
      <OAuthButton
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      >
        Google
      </OAuthButton>
      <OAuthButton
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        }
      >
        Apple
      </OAuthButton>
    </div>
  );

  /* ─── shared footer ─── */
  const renderFooter = () => (
    <p className="text-center text-zinc-600 text-sm mt-8">
      Already have an account?{" "}
      <button
        onClick={() => navigate("/login")}
        className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors hover:underline underline-offset-2"
      >
        Sign in
      </button>
    </p>
  );

  /* ═══════════════════════════════════════════════
     ██  WINDOWS MODE
     ═══════════════════════════════════════════════ */
  if (isWindows) {
    return (
      <div
        className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
        style={{ background: "#0c0c0c", fontFamily: "'Inter', sans-serif" }}
      >
        {/* background orbs */}
        <BackgroundOrbs />

        {/* server status */}
        <ServerStatusBadge ready={isServerReady} />

        {/* card */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{ animation: "signupSlideUp 0.7s cubic-bezier(.16,1,.3,1) both" }}
        >
          <div className="relative p-8 sm:p-10 rounded-2xl bg-[#161616] border border-[#2a2a2a] shadow-2xl overflow-hidden">
            {/* animated gradient top line */}
            <AnimatedGradientLine />

            {/* HEADER */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 overflow-hidden bg-[#161616] border border-[#2a2a2a]">
                <img src="/fevicon.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {step === 1 ? "Create Account" : "Verify Email"}
              </h1>
              <p className="text-zinc-500 text-sm mt-2.5 px-4">
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
    );
  }

  /* ═══════════════════════════════════════════════
     ██  PHONE MODE  (default)
     ═══════════════════════════════════════════════ */
  return (
    <div
      className="min-h-full w-full flex flex-col justify-center px-6 sm:px-8 py-8 relative overflow-hidden"
      style={{ background: "#0c0c0c", fontFamily: "'Inter', sans-serif" }}
    >
      {/* background orbs */}
      <BackgroundOrbs />

      {/* server status */}
      <ServerStatusBadge ready={isServerReady} />

      {/* content wrapper */}
      <div
        className="w-full max-w-sm mx-auto flex flex-col relative z-10"
        style={{ animation: "signupSlideUp 0.7s cubic-bezier(.16,1,.3,1) both" }}
      >
        {/* HEADER */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 overflow-hidden bg-[#161616] border border-[#2a2a2a]">
            <img src="/fevicon.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-none">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-zinc-500 text-[13px] mt-2.5 px-4 leading-normal">
            {step === 1
              ? "Join Varta to start chatting with friends"
              : `We sent a code to your email.`}
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
  );
}

export default Signup;