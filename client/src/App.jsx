import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";

function App() {
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    // 🚀 PROACTIVE WAKE UP
    const wakeServer = async () => {
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
        setIsServerReady(true);
        console.log("✅ Backend is awake and ready!");
      } catch (err) {
        console.log("⏳ Backend is still waking up...");
      }
    };
    
    wakeServer();
    const interval = setInterval(() => {
      if (!isServerReady) wakeServer();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isServerReady]);

  return (
    <BrowserRouter>
      <div className="w-full min-h-[100dvh] bg-[#0c0c0c] text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;