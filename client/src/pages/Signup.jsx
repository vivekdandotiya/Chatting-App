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
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPass) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPass) {
      alert("Passwords do not match ❌");
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
      alert("Signup failed (User may already exist)");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen flex items-center justify-center bg-black">

  <div className="w-[380px] p-8 rounded-2xl bg-[#111] border border-gray-800 shadow-2xl">

    <h1 className="text-3xl font-semibold text-white text-center mb-8">
      Create Account
    </h1>

    <form onSubmit={handleSignup} className="space-y-5">

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
      />

      <button className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
        Signup
      </button>

    </form>

    <p className="text-gray-400 text-sm text-center mt-6">
      Already have an account?{" "}
      <span
        onClick={() => navigate("/login")}
        className="text-white cursor-pointer hover:underline"
      >
        Login
      </span>
    </p>

  </div>
</div>
  );
}

export default Signup;