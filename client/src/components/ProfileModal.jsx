import React, { useState, useRef } from "react";
import axios from "axios";

const ProfileModal = ({ isOpen, onClose, user, onUpdate, socket }) => {
  const [name, setName] = useState(user?.name || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload/file`, formData);
      setProfilePic(res.data.url);
    } catch (err) {
      setError("Failed to upload image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        userId: user._id,
        name,
        profilePic,
      });

      // Update local storage
      const updatedUser = { ...user, name: res.data.name, profilePic: res.data.profilePic };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Broadcast to others via socket
      if (socket) {
        socket.emit("updateProfile", {
          userId: user._id,
          name: res.data.name,
          profilePic: res.data.profilePic,
        });
      }

      onUpdate(updatedUser);
      onClose();
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (n) => n?.split(" ").map(x => x[0]).join("").toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden animate-zoomIn">
        {/* HEADER */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#18181b] rounded-full transition text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* PHOTO UPLOADER */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#27272a] bg-[#18181b] flex items-center justify-center text-4xl font-black text-gray-500 shadow-xl">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(name)
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-1 right-1 p-3 bg-white text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click icon to change photo</p>
          </div>

          {/* NAME INPUT */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-5 py-4 bg-[#18181b] border border-[#27272a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white transition-all duration-300"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-medium text-center animate-slideUp">{error}</p>}

          {/* ACTIONS */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-[#18181b] text-white font-bold rounded-xl hover:bg-[#27272a] transition duration-300 border border-[#27272a]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
