import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import SingleChat from "./pages/SingleChat";
import PhoneWrapper from "./components/PhoneWrapper";
import ExperienceGateway from "./components/ExperienceGateway";

function App() {
  const [appMode, setAppMode] = useState(sessionStorage.getItem('appMode'));

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