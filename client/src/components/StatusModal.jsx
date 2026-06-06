import React, { useState, useRef } from "react";
import axios from "axios";

export default function StatusModal({ isOpen, onClose, currentUser, onStatusPosted }) {
  const [statusType, setStatusType] = useState("text"); // "text" | "image"
  const [textContent, setTextContent] = useState("");
  const [bgColorIndex, setBgColorIndex] = useState(0);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const colors = [
    "#075e54", // WhatsApp Teal
    "#128c7e", // Teal light
    "#25d366", // Green
    "#3f51b5", // Indigo
    "#e91e63", // Pink
    "#9c27b0", // Purple
    "#009688", // Teal dark
    "#ff5722", // Deep Orange
    "#795548", // Brown
    "#607d8b", // Blue Grey
  ];

  if (!isOpen) return null;

  const cycleColor = () => {
    setBgColorIndex((prev) => (prev + 1) % colors.length);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    try {
      let content = "";
      if (statusType === "text") {
        if (!textContent.trim()) return alert("Status cannot be empty");
        content = textContent;
      } else {
        if (!imageFile) return alert("Please select an image");
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/upload/file`,
          formData
        );
        content = uploadRes.data.url;
      }

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/status`, {
        userId: currentUser._id,
        type: statusType,
        content,
        backgroundColor: statusType === "text" ? colors[bgColorIndex] : "",
      });

      alert("Status updated successfully!");
      setTextContent("");
      setImageFile(null);
      setImagePreview("");
      if (onStatusPosted) onStatusPosted();
      onClose();
    } catch (err) {
      console.error("Error posting status:", err);
      alert("Failed to post status: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
        
        {/* animated gradient top line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, #10b981, #2dd4bf, #10b981, transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s ease infinite",
          }}
        />

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Add Status</h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-[#202022] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#2a2a2a] bg-[#111111]">
          <button
            onClick={() => setStatusType("text")}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-all ${
              statusType === "text"
                ? "bg-[#161616] text-emerald-400 border-b-2 border-emerald-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Text Status
          </button>
          <button
            onClick={() => setStatusType("image")}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-all ${
              statusType === "image"
                ? "bg-[#161616] text-emerald-400 border-b-2 border-emerald-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Photo Status
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-center min-h-[200px]">
          {statusType === "text" ? (
            <div 
              style={{ backgroundColor: colors[bgColorIndex] }}
              className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center relative transition-all duration-300 shadow-inner"
            >
              <textarea
                placeholder="What's on your mind?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={120}
                className="w-full bg-transparent border-none focus:ring-0 text-xl font-medium placeholder-white/50 text-center focus:outline-none resize-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={cycleColor}
                  className="bg-black/30 hover:bg-black/50 p-2.5 rounded-full transition shadow text-white/95"
                  title="Change Background Color"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1">
              {imagePreview ? (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-inner bg-black">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1.5 rounded-full transition text-white/80"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#2a2a2a] hover:border-emerald-500/30 cursor-pointer flex flex-col items-center justify-center p-6 text-zinc-500 hover:text-emerald-400 transition-all duration-300 group"
                >
                  <svg className="w-12 h-12 mb-3 opacity-60 text-zinc-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Choose Photo</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-5 border-t border-[#2a2a2a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-[#1c1c1c] hover:bg-[#252528] text-white border border-[#2a2a2a] text-xs font-bold uppercase tracking-widest rounded-xl transition active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isUploading}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:brightness-110 text-xs font-bold uppercase tracking-widest rounded-xl transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/60 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <span>Post Status</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
