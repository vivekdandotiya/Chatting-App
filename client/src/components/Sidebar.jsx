import io from "socket.io-client";

function Sidebar({ users, unread, setUnread, onlineUsers, refreshUsers, socket }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [loadingAction, setLoadingAction] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  // Ensure socket joins setup
  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("setup", currentUser._id);
    }
  }, []);

  const filteredUsers = users?.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const friends = filteredUsers.filter(u => u.connectionStatus === "accepted");
  const invites = filteredUsers.filter(u => u.connectionStatus === "pending_received");
  const discover = filteredUsers.filter(u => u.connectionStatus === "none" || u.connectionStatus === "pending_sent" || u.connectionStatus === "rejected");

  const sendInvite = async (receiverId) => {
    try {
      setLoadingAction(receiverId);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/connections/request`, {
        sender: currentUser._id,
        receiver: receiverId
      });
      socket.emit("sendInvite", { sender: currentUser._id, receiver: receiverId });
      if (refreshUsers) refreshUsers();
    } catch (err) {
      console.error(err);
      alert("Invite failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  const respondInvite = async (senderId, action) => {
    try {
      setLoadingAction(senderId);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/connections/respond`, {
        sender: senderId,
        receiver: currentUser._id,
        action
      });
      if (action === "accept") {
        socket.emit("acceptInvite", { sender: senderId, receiver: currentUser._id });
      }
      if (refreshUsers) refreshUsers();
    } catch (err) {
      console.error(err);
      alert("Response failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="w-full h-[100dvh] max-w-full bg-[#0a0a0a] flex flex-col overflow-hidden border-r border-[#27272a]">
      
      {/* HEADER */}
      <div className="px-4 pt-5 pb-4 border-b border-[#27272a] flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
          Messages
        </h1>

        {/* SEARCH BAR */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121212] border border-[#27272a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="px-3 pt-3 flex gap-2 border-b border-[#27272a] overflow-x-auto scrollbar-hide flex-shrink-0 pb-3">
        {["chats", "invites", "discover"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full font-medium text-xs md:text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white hover:bg-[#18181b]"
            }`}
          >
            {tab === "chats" && `Chats (${friends.length})`}
            {tab === "invites" && `Invites ${invites.length > 0 ? `(${invites.length})` : ''}`}
            {tab === "discover" && "Discover"}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#27272a] scrollbar-track-transparent p-2">
        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div>
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                No friends yet. Check the discover tab!
              </div>
            ) : (
              friends.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    navigate(`/chat/${u._id}`);
                    setUnread((prev) => ({ ...prev, [u._id]: 0 }));
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#121212] cursor-pointer transition border border-transparent hover:border-[#27272a] mb-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a]">
                    <span className="text-white font-bold">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{u.name}</h3>
                    <p className="text-gray-500 text-xs truncate">Chat accessible</p>
                  </div>
                  {unread && unread[u._id] > 0 && (
                    <span className="w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {unread[u._id]}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* INVITES TAB */}
        {activeTab === "invites" && (
          <div>
            {invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                No pending invitations.
              </div>
            ) : (
              invites.map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-3 rounded-lg bg-[#121212] border border-[#27272a] mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{u.name}</h3>
                    <p className="text-gray-400 text-xs">Wants to chat</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => respondInvite(u._id, "accept")}
                      disabled={loadingAction === u._id}
                      className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondInvite(u._id, "reject")}
                      disabled={loadingAction === u._id}
                      className="px-3 py-1.5 bg-[#18181b] text-white border border-[#27272a] text-xs font-bold rounded hover:bg-[#27272a] transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === "discover" && (
          <div>
            {discover.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                No new users to discover.
              </div>
            ) : (
              discover.map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#121212] transition mb-1">
                  <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a]">
                    <span className="text-gray-300 font-semibold">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-200 font-semibold text-sm truncate">{u.name}</h3>
                  </div>
                  {u.connectionStatus === "pending_sent" ? (
                    <span className="px-3 py-1.5 bg-transparent border border-[#27272a] text-gray-500 text-xs font-medium rounded">
                      Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => sendInvite(u._id)}
                      disabled={loadingAction === u._id}
                      className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition"
                    >
                      Invite
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-[#27272a] flex-shrink-0 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Network</p>
            <p className="text-white text-sm font-semibold">{friends.length} <span className="text-gray-500 font-normal">Active connections</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;