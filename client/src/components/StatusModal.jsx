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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121212] border border-[#27272a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Add Status</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#27272a] bg-[#0c0c0e]">
          <button
            onClick={() => setStatusType("text")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              statusType === "text"
                ? "bg-[#18181b] text-white border-b-2 border-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            Text Status
          </button>
          <button
            onClick={() => setStatusType("image")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              statusType === "image"
                ? "bg-[#18181b] text-white border-b-2 border-white"
                : "text-gray-500 hover:text-white"
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
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={cycleColor}
                  className="bg-black/30 hover:bg-black/50 p-2 rounded-full transition shadow text-white/95"
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
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#27272a] shadow-inner bg-black">
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
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#27272a] hover:border-white/40 cursor-pointer flex flex-col items-center justify-center p-6 text-gray-500 hover:text-white transition-all duration-300"
                >
                  <svg className="w-12 h-12 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-wider text-xs">Choose Photo</span>
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
        <div className="px-6 py-5 border-t border-[#27272a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] text-xs font-black uppercase tracking-widest rounded-xl transition active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isUploading}
            className="flex-1 py-3.5 bg-white text-black hover:bg-gray-200 text-xs font-black uppercase tracking-widest rounded-xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
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
