import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        { email, password }
      );

      sessionStorage.setItem("user", JSON.stringify(res.data));

      navigate("/chat");
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">

  <div className="w-[380px] p-8 rounded-2xl bg-[#111] border border-gray-800 shadow-2xl">

    <h1 className="text-3xl font-semibold text-white text-center mb-8">
      Welcome Back
    </h1>

    <form onSubmit={handleLogin} className="space-y-5">

      {/* EMAIL */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
      />

      {/* PASSWORD */}
      <div className="relative">
        <input
          type={showPass ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
        />

        <span
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-3 cursor-pointer text-gray-400"
        >
          {showPass ? "🙈" : "👁️"}
        </span>
      </div>

      {/* BUTTON */}
      <button className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
        Login
      </button>

    </form>

    <p className="text-gray-400 text-sm text-center mt-6">
      Don’t have an account?{" "}
      <span
        onClick={() => navigate("/signup")}
        className="text-white cursor-pointer hover:underline"
      >
        Signup
      </span>
    </p>

  </div>
</div>
  );
}

export default Login;