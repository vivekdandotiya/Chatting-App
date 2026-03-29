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

  const appMode = localStorage.getItem("appMode") || "phone";
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPass) {
      setError("Please fill all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPass) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`,
        { name, email, password }
      );

      sessionStorage.setItem("user", JSON.stringify(res.data));

      navigate("/chat");
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed (User may already exist)"
      );
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Join Us
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Create an account to start chatting
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-slideDown">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
              {/* NAME INPUT */}
              <div className="group relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                />
              </div>

              {/* EMAIL INPUT */}
              <div className="group relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                />
              </div>

              {/* PASSWORD INPUT */}
              <div className="group relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      checkPasswordStrength(e.target.value);
                    }}
                    disabled={loading}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform grayscale"
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="w-full h-1 bg-[#27272a] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD INPUT */}
              <div className="group relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform grayscale"
                  >
                    {showConfirmPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* PASSWORD MATCH INDICATOR */}
                {confirmPass && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${password === confirmPass ? "bg-white" : "bg-gray-500"}`}></div>
                    <span className="text-xs text-slate-400">
                      {password === confirmPass ? "Passwords match" : "Passwords don't match"}
                    </span>
                  </div>
                )}
              </div>

              {/* TERMS CHECKBOX */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-[#18181b] transition">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 mt-1 rounded border border-[#27272a] bg-[#18181b] accent-white cursor-pointer grayscale"
                />
                <span className="text-xs sm:text-sm text-gray-400 group-hover:text-white transition">
                  I agree to the <a href="#" className="text-white hover:underline font-medium">Terms</a> and <a href="#" className="text-white hover:underline font-medium">Privacy Policy</a>
                </span>
              </label>

              {/* SIGNUP BUTTON */}
              <button
                type="submit"
                disabled={loading || !agreeTerms}
                className="w-full py-3 sm:py-4 mt-6 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="my-6 sm:my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#27272a]"></div>
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[#27272a]"></div>
            </div>

            {/* OAUTH BUTTONS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition text-gray-300 hover:text-white text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition text-gray-300 hover:text-white text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                Facebook
              </button>
            </div>

            {/* FOOTER */}
            <p className="text-center text-gray-500 text-sm">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-white hover:underline font-semibold transition">
                Sign in here
              </button>
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
          <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center mb-5 shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
            <svg
              className="w-6 h-6 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-none">
            Join Us
          </h1>
          <p className="text-[#8e8e93] text-[13px] mt-2.5">
            Create an account to start chatting
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 animate-slideDown">
            <svg
              className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* NAME INPUT */}
          <div className="group relative">
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm disabled:opacity-50"
            />
          </div>

          {/* EMAIL INPUT */}
          <div className="group relative">
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm disabled:opacity-50"
            />
          </div>

          {/* PASSWORD INPUT */}
          <div className="group relative">
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                disabled={loading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform disabled:opacity-50 grayscale opacity-80"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {/* PASSWORD STRENGTH */}
            {password && (
              <div className="mt-2.5 px-1 space-y-1.5">
                <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* CONFIRM PASSWORD INPUT */}
          <div className="group relative">
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555555] focus:outline-none focus:border-white transition-all duration-200 text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                disabled={loading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform disabled:opacity-50 grayscale opacity-80"
              >
                {showConfirmPass ? "🙈" : "👁️"}
              </button>
            </div>

            {/* MATCH INDICATOR */}
            {confirmPass && (
              <div className="mt-2.5 ml-1 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPass ? "bg-white" : "bg-[#555555]"}`}></div>
                <span className="text-[11px] text-[#8e8e93] font-medium">
                  {password === confirmPass ? "Passwords match" : "Passwords don't match"}
                </span>
              </div>
            )}
          </div>

          {/* TERMS CHECKBOX */}
          <label className="flex items-start gap-3 cursor-pointer group mt-2 mb-4 p-2 bg-[#141414]/50 rounded-xl hover:bg-[#1a1a1a] transition border border-transparent hover:border-[#2a2a2a]">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 mt-0.5 rounded border border-[#333] bg-black accent-white cursor-pointer grayscale"
            />
            <span className="text-[11px] text-[#8e8e93] group-hover:text-white transition leading-relaxed">
              I agree to the <a href="#" className="text-white hover:underline font-semibold">Terms</a> and <a href="#" className="text-white hover:underline font-semibold">Privacy Policy</a>
            </span>
          </label>

          {/* SIGNUP BUTTON */}
          <button
            type="submit"
            disabled={loading || !agreeTerms}
            className="w-full py-3.5 mt-2 bg-white text-black font-semibold rounded-xl hover:bg-[#e5e5e5] active:bg-[#cccccc] disabled:opacity-50 transition-all duration-200 text-[15px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-7 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#2a2a2a]"></div>
          <span className="text-[10px] text-[#666] uppercase tracking-widest font-semibold">Or continue with</span>
          <div className="flex-1 h-px bg-[#2a2a2a]"></div>
        </div>

        {/* OAUTH BUTTONS */}
        <div className="flex gap-3 mb-8">
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl hover:bg-[#1a1a1a] transition text-[#8e8e93] hover:text-white text-[13px] font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
          </button>
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl hover:bg-[#1a1a1a] transition text-[#8e8e93] hover:text-white text-[13px] font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Apple
          </button>
        </div>

        {/* FOOTER */}
        <p className="text-center text-[#666] text-[13px]">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-white hover:underline font-semibold transition">
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;