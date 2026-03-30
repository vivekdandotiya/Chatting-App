import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  // 🛡️ OTP STATES
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [otp, setOtp] = useState("");

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
    if (passwordStrength === 0) return "bg-slate-600";
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (isWindows) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden text-white font-sans">
        <div className="relative z-10 w-full max-w-md">
          <div className="relative p-6 sm:p-8 md:p-10 rounded-xl bg-[#121212] border border-[#27272a] shadow-2xl">
            {/* HEADER */}
            <div className="mb-8 sm:mb-10 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <img src="/fevicon.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {step === 1 ? "Join Us" : "Verify Email"}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2 text-center px-4">
                {step === 1 
                  ? "Create an account to start chatting" 
                  : `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-slideDown">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
                <div className="group relative">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                  />
                </div>
                <div className="group relative">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                  />
                </div>
                <div className="group relative">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"} placeholder="Create a strong password"
                      value={password} onChange={(e) => { setPassword(e.target.value); checkPasswordStrength(e.target.value); }}
                      disabled={loading}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} disabled={loading} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform grayscale">
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="w-full h-1 bg-[#27272a] rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="group relative">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"} placeholder="Confirm your password"
                      value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} disabled={loading} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform grayscale">
                      {showConfirmPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-[#18181b] transition">
                  <input
                    type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 mt-1 rounded border border-[#27272a] bg-[#18181b] accent-white cursor-pointer grayscale"
                  />
                  <span className="text-xs sm:text-sm text-gray-400 group-hover:text-white transition">
                    I agree to the <a href="#" className="text-white hover:underline font-medium">Terms</a> and <a href="#" className="text-white hover:underline font-medium">Privacy Policy</a>
                  </span>
                </label>
                <button
                  type="submit" disabled={loading || !agreeTerms}
                  className="w-full py-3 sm:py-4 mt-6 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinalSignup} className="space-y-6">
                <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
                   <label className="block text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Verification Code</label>
                   <input
                    type="text" maxLength="6" placeholder="000000"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-transparent text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div> : "Verify & Sign Up"}
                  </button>
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-white text-sm font-medium transition"
                  >
                    Edit Email Address
                  </button>
                  <button
                    type="button" onClick={handleSendOTP} disabled={loading}
                    className="text-gray-400 hover:text-white text-sm font-medium transition underline underline-offset-4"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            <div className="my-6 sm:my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#27272a]"></div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[#27272a]"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 text-center">
               <button className="py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-gray-400 hover:text-white">Google</button>
               <button className="py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-gray-400 hover:text-white">Facebook</button>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-white hover:underline font-semibold transition">Sign in here</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-black flex flex-col justify-start px-6 sm:px-8 py-8 relative overflow-hidden text-white overflow-y-auto scrollbar-hide font-sans">
      <div className="w-full max-w-sm mx-auto flex flex-col pb-6">
        {/* HEADER */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center mb-5 shadow-[0_4px_20px_rgba(255,255,255,0.15)] overflow-hidden">
            <img src="/fevicon.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-none text-center">
            {step === 1 ? "Join Us" : "Verify Email"}
          </h1>
          <p className="text-[#8e8e93] text-[13px] mt-2.5 text-center px-6 leading-relaxed">
            {step === 1 
              ? "Create an account to start chatting" 
              : `We sent a code to your email. Check your inbox.`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 animate-slideDown">
             <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="group relative">
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <input
                type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm"
              />
            </div>
            <div className="group relative">
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <input
                type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm"
              />
            </div>
            <div className="group relative">
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} placeholder="Create password"
                  value={password} onChange={(e) => { setPassword(e.target.value); checkPasswordStrength(e.target.value); }}
                  className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-[#555]">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="group relative">
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
              <input
                type={showConfirmPass ? "text" : "password"} placeholder="Confirm password"
                value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer group mt-2 mb-4 p-2 bg-[#141414]/50 rounded-xl hover:bg-[#1a1a1a] transition border border-transparent hover:border-[#2a2a2a]">
              <input
                type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border border-[#333] bg-black accent-white cursor-pointer grayscale"
              />
              <span className="text-[11px] text-[#8e8e93] group-hover:text-white transition leading-relaxed">
                I agree to the <a href="#" className="text-white hover:underline font-semibold">Terms</a> and <a href="#" className="text-white hover:underline font-semibold">Privacy Policy</a>
              </span>
            </label>
            <button
              type="submit" disabled={loading || !agreeTerms}
              className="w-full py-3.5 mt-2 bg-white text-black font-semibold rounded-xl"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div> : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSignup} className="space-y-8 animate-fadeIn">
            <div className="flex flex-col items-center justify-center py-6 bg-[#141414] rounded-2xl border border-[#2a2a2a] shadow-inner">
               <input
                 type="text" maxLength="6" placeholder="000000"
                 value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                 className="w-full bg-transparent text-center text-5xl font-black tracking-[0.4em] text-white focus:outline-none"
                 autoFocus
               />
               <p className="text-[10px] text-[#555] mt-4 font-bold uppercase tracking-[0.2em]">Enter 6-digit OTP</p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="submit" disabled={loading}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div> : "Verify & Sign Up"}
              </button>
              <div className="flex flex-col items-center gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)} className="text-[#8e8e93] text-[12px] font-medium hover:text-white transition">Change Email Address</button>
                <button type="button" onClick={handleSendOTP} className="text-white text-[12px] font-bold underline underline-offset-4 decoration-white/20">Resend Code</button>
              </div>
            </div>
          </form>
        )}

        <div className="my-7 flex items-center gap-4">
           <div className="flex-1 h-px bg-[#2a2a2a]"></div>
           <span className="text-[10px] text-[#666] uppercase tracking-widest font-semibold text-center">Or continue with</span>
           <div className="flex-1 h-px bg-[#2a2a2a]"></div>
        </div>

        <div className="flex gap-3 mb-8">
           <button className="flex-1 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-xs text-[#8e8e93]">Google</button>
           <button className="flex-1 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-xs text-[#8e8e93]">Apple</button>
        </div>

        <p className="text-center text-[#666] text-[13px]">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-white hover:underline font-semibold transition">Sign in</button>
        </p>
      </div>
    </div>
  );
}

export default Signup;