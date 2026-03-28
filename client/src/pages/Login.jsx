import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submitHandler = async () => {
    const { data } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
      { email, password }
    );

    sessionStorage.setItem("user", JSON.stringify(data));
    navigate("/chat");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="p-6 bg-white shadow rounded w-80">
        <h2 className="text-xl mb-4 font-bold">Login</h2>

        <input
          className="w-full border p-2 mb-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 mb-2"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submitHandler}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Login
        </button>

        <p className="mt-2 text-sm">
          No account? <Link to="/signup">Signup</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;