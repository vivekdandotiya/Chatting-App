import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import SingleChat from "./pages/SingleChat";
import PhoneWrapper from "./components/PhoneWrapper";
import ExperienceGateway from "./components/ExperienceGateway";

function App() {
  const [appMode, setAppMode] = useState(sessionStorage.getItem('appMode'));

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
    // Re-ping every 10s if not ready
    const interval = setInterval(() => {
      if (!isServerReady) wakeServer();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isServerReady]);


  const handleSetMode = (mode) => {
    sessionStorage.setItem('appMode', mode);
    setAppMode(mode);
  };

  if (!appMode) {
    return <ExperienceGateway setMode={handleSetMode} />;
  }

  const routerContent = (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:id" element={<SingleChat />} />
    </Routes>
  );

  return (
    <BrowserRouter>
      {appMode === "phone" ? (
        <PhoneWrapper>
          {routerContent}
        </PhoneWrapper>
      ) : (
        <div className="w-full min-h-[100dvh]">
          {routerContent}
        </div>
      )}
    </BrowserRouter>
  );
}


export default App;