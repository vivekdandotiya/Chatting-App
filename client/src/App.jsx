import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import SingleChat from "./pages/SingleChat";
import PhoneWrapper from "./components/PhoneWrapper";

function App() {
  return (
    <BrowserRouter>
      <PhoneWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<SingleChat />} />
        </Routes>
      </PhoneWrapper>
    </BrowserRouter>
  );
}

export default App;