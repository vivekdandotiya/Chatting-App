import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLockScreen from "./AppLockScreen";

const ProfileModal = ({ isOpen, onClose, user, onUpdate, socket }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lockMode, setLockMode] = useState(null); // null, "setup", "disable"
  const hasLock = user?.appLockPassword && user.appLockPassword.hour !== null && user.appLockPassword.minute !== null;
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

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        userId: user._id,
        name,
        profilePic,
      });

      // Update local storage
      const updatedUser = { ...user, name: res.data.name, profilePic: res.data.profilePic };
      localStorage.setItem("user", JSON.stringify(updatedUser));
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("varta_unlocked");
    if (socket) {
      socket.disconnect();
    }
    onClose();
    navigate("/");
    window.location.reload();
  };

  const handleToggleLockClick = () => {
    if (hasLock) {
      setLockMode("disable");
    } else {
      setLockMode("setup");
    }
  };

  const handleSaveLock = async (password) => {
    try {
      setError("");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/set-lock`, {
        userId: user._id,
        hour: password.hour,
        minute: password.minute
      });

      const updatedUser = { ...user, appLockPassword: res.data.appLockPassword };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("varta_unlocked", "true");

      onUpdate(updatedUser);
      setLockMode(null);
    } catch (err) {
      console.error(err);
      setError("Failed to set focus clock target.");
    }
  };

  const handleRemoveLock = async () => {
    try {
      setError("");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/remove-lock`, {
        userId: user._id
      });

      const updatedUser = { ...user, appLockPassword: res.data.appLockPassword };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.removeItem("varta_unlocked");

      onUpdate(updatedUser);
      setLockMode(null);
    } catch (err) {
      console.error(err);
      setError("Failed to disable focus clock.");
    }
  };

  const getInitials = (n) => n?.split(" ").map(x => x[0]).join("").toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden animate-zoomIn relative">
        
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
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#202022] rounded-xl transition text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* PHOTO UPLOADER */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#2a2a2a] bg-[#111111] flex items-center justify-center text-4xl font-black text-emerald-400 shadow-xl relative">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(name)
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-1 right-1 p-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
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
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tap camera icon to change photo</p>
          </div>

          {/* NAME INPUT */}
          <div className="space-y-3">
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-1">Display Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-5 py-3.5 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all duration-300"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-medium text-center animate-slideUp">{error}</p>}

          {/* ACTIONS */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 bg-[#1c1c1c] text-white font-bold rounded-xl hover:bg-[#252528] transition duration-300 border border-[#2a2a2a] text-xs uppercase tracking-wider active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold rounded-xl hover:brightness-110 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
              >
                {saving ? <div className="w-4 h-4 border-2 border-black/60 border-t-transparent rounded-full animate-spin"></div> : "Save Changes"}
              </button>
            </div>
            
            <button 
              type="button"
              onClick={handleToggleLockClick}
              className={`w-full py-3 ${
                hasLock 
                  ? "bg-amber-950/20 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-950/30 text-amber-400"
                  : "bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/30 text-emerald-400"
              } font-bold rounded-xl transition duration-300 text-xs uppercase tracking-wider active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{hasLock ? "Disable Study Clock Mode" : "Enable Study Clock Mode"}</span>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full py-3 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 hover:bg-red-950/30 text-red-400 font-bold rounded-xl transition duration-300 text-xs uppercase tracking-wider active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout Account</span>
            </button>
          </div>

          {lockMode === "setup" && (
            <AppLockScreen
              mode="setup"
              onSave={handleSaveLock}
              onCancel={() => setLockMode(null)}
            />
          )}

          {lockMode === "disable" && (
            <AppLockScreen
              mode="disable"
              targetPassword={user?.appLockPassword}
              onUnlock={handleRemoveLock}
              onCancel={() => setLockMode(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
