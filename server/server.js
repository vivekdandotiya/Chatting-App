require("dotenv").config({ override: true });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

// ✅ AUTO-GENERATE VAPID KEYS FOR LOCAL DEV
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log("🔑 VAPID Keys not found in environment. Generating new ones...");
  const keys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;

  const envPath = path.join(__dirname, ".env");
  try {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    if (envContent && !envContent.endsWith("\n")) {
      envContent += "\n";
    }
    envContent += `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`;
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log("✅ VAPID Keys successfully generated and saved to server/.env");
  } catch (err) {
    console.error("❌ Failed to write VAPID keys to .env file:", err.message);
  }
}

// ✅ INITIALIZE WEB PUSH
webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_USER || "admin@example.com"}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const Message = require("./models/Message");
const User = require("./models/User");
const Connection = require("./models/Connection");

const app = express();
app.use(express.json());

// ✅ CORS FIX
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ✅ MONGO CONNECT with auto-retry for Render cold starts
const connectDB = async (retries = 10) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${i}/${retries}...`);
      console.log(`   URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@') : 'NOT SET'}`);
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
      });
      console.log("✅ MongoDB Connected Successfully");
      return;
    } catch (err) {
      console.error(`❌ MongoDB Connection Attempt ${i} Failed:`, err.message);
      if (err.message.includes("whitelist") || err.message.includes("IP")) {
        console.error("👉 TIP: Whitelist 0.0.0.0/0 in MongoDB Atlas → Network Access!");
      }
      if (err.message.includes("authentication") || err.message.includes("auth")) {
        console.error("👉 TIP: Check your database username/password in the connection string!");
      }
      if (i < retries) {
        console.log(`⏳ Retrying in 10 seconds...`);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }
  console.error("❌ All MongoDB connection attempts failed. Server will run but DB operations will fail.");
};

connectDB();

// ✅ CHECK ENVS
const requiredEnvs = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "MONGO_URI", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASS"];
requiredEnvs.forEach(env => {
  if (!process.env[env]) console.warn(`⚠️ WARNING: ${env} is missing!`);
});

// ✅ ROUTES
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const statusRoutes = require("./routes/statusRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/status", statusRoutes);

// ✅ HEALTH CHECK (for pre-warming Render)
app.get("/api/health", (req, res) => res.status(200).send("OK"));

// ✅ DB STATUS CHECK (diagnostic endpoint)
app.get("/api/db-status", async (req, res) => {
  const state = mongoose.connection.readyState;
  const stateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  const status = stateMap[state] || "unknown";
  const isConnected = state === 1;

  // Allow forcing a reconnect via ?reconnect=true
  if (req.query.reconnect === "true" && !isConnected) {
    try {
      await mongoose.disconnect().catch(() => {});
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
      });
      return res.status(200).json({
        database: "connected",
        message: "Reconnected successfully!",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(503).json({
        database: "disconnected",
        error: err.message,
        mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, "//***:***@") : "NOT SET",
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.status(isConnected ? 200 : 503).json({
    database: status,
    mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, "//***:***@") : "NOT SET",
    timestamp: new Date().toISOString(),
    tip: !isConnected ? "Try /api/db-status?reconnect=true or check MongoDB Atlas: 1) Resume cluster if paused, 2) Whitelist 0.0.0.0/0 in Network Access" : undefined,
  });
});

// ✅ GET USERS
app.get("/api/users", async (req, res) => {
  const { userId } = req.query;

  try {
    const users = await User.find().select("-password");
    
    if (!userId) {
      return res.json(
        users.map((u) => ({ ...u.toObject(), connectionStatus: "none", unreadCount: 0 }))
      );
    }

    const connections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Count unread messages for each sender to this receiver
    const unreadCounts = await Message.aggregate([
      { 
        $match: { 
          receiver: userId, 
          status: { $ne: "read" },
          isDeleted: { $ne: true }
        } 
      },
      { 
        $group: { 
          _id: "$sender", 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const unreadMap = {};
    unreadCounts.forEach((item) => {
      if (item._id) {
        unreadMap[item._id] = item.count;
      }
    });

    const usersWithStatus = users.map((u) => {
      const userObj = u.toObject();
      // Ensure profilePic defaults to empty string if not present
      if (!userObj.profilePic) userObj.profilePic = "";

      if (userObj._id.toString() === userId) {
        return userObj;
      }

      const connection = connections.find(
        (c) =>
          (c.sender.toString() === userId && c.receiver.toString() === userObj._id.toString()) ||
          (c.receiver.toString() === userId && c.sender.toString() === userObj._id.toString())
      );

      let connectionStatus = "none";
      if (connection) {
        if (connection.status === "accepted") {
          connectionStatus = "accepted";
        } else if (connection.status === "pending") {
          connectionStatus =
            connection.sender.toString() === userId ? "pending_sent" : "pending_received";
        } else if (connection.status === "rejected") {
          connectionStatus = "rejected";
        }
      }

      userObj.connectionStatus = connectionStatus;
      userObj.unreadCount = unreadMap[userObj._id.toString()] || 0;
      return userObj;
    });

    res.json(usersWithStatus);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CONNECTIONS
app.post("/api/connections/request", async (req, res) => {
  const { sender, receiver } = req.body;
  if (!sender || !receiver) return res.status(400).json({ error: "Fields required" });
  
  const existing = await Connection.findOne({
    $or: [{ sender, receiver }, { sender: receiver, receiver: sender }]
  });

  if (existing) {
    if (existing.status === "rejected") {
      // Re-open rejected request
      existing.status = "pending";
      existing.sender = sender;
      existing.receiver = receiver;
      await existing.save();
      return res.json(existing);
    }
    return res.status(400).json({ error: "Connection already exists" });
  }

  const connection = await Connection.create({ sender, receiver, status: "pending" });
  res.json(connection);
});

app.post("/api/connections/respond", async (req, res) => {
  const { sender, receiver, action } = req.body; 
  if (!sender || !receiver || !action) return res.status(400).json({ error: "Fields required" });

  const connection = await Connection.findOne({ sender, receiver: receiver, status: "pending" });
  if (!connection) return res.status(404).json({ error: "Request not found" });

  if (action === "accept") connection.status = "accepted";
  else if (action === "reject") connection.status = "rejected";
  await connection.save();

  res.json(connection);
});

// ✅ GET MESSAGES
app.get("/api/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// ✅ SERVER + SOCKET
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 USER SOCKET MAP
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 SETUP USER
  socket.on("setup", (userId) => {
    users[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(users));
  });

  // 🔥 SEND MESSAGE
  socket.on("sendMessage", async (data) => {
    const message = await Message.create({
      sender: data.sender,
      receiver: data.receiver,
      content: data.content,
      messageType: data.messageType || "text",
      voiceUrl: data.voiceUrl || null,
      fileUrl: data.fileUrl || null,
      fileType: data.fileType || null,
      fileName: data.fileName || null,
      replyTo: data.replyTo || null,
      isForwarded: !!data.isForwarded,
      status: "sent",
    });

    const receiverSocket = users[data.receiver];
    const senderSocket = users[data.sender];

    // send to receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    } else {
      // Receiver is offline/closed: send Web Push notification
      try {
        const senderUser = await User.findById(data.sender);
        const senderName = senderUser ? senderUser.name : "New Message";
        const senderPic = senderUser ? senderUser.profilePic : "";

        const receiverUser = await User.findById(data.receiver);
        if (receiverUser && receiverUser.pushSubscriptions && receiverUser.pushSubscriptions.length > 0) {
          let pushBody = "You have a new message";
          if (data.messageType === "text") {
            pushBody = data.content;
          } else if (data.messageType === "voice") {
            pushBody = "🎙️ Sent a voice message";
          } else if (data.messageType === "image") {
            pushBody = "📷 Sent an image";
          } else if (data.messageType === "file") {
            pushBody = `📁 Sent a file: ${data.fileName || "attachment"}`;
          }

          let notificationTitle = senderName;
          let notificationBody = pushBody;
          let notificationIcon = senderPic || "/fevicon.png";

          const hasLock = receiverUser.appLockPassword && 
                          receiverUser.appLockPassword.hour !== null && 
                          receiverUser.appLockPassword.minute !== null;

          if (hasLock) {
            notificationTitle = "Focus Study Clock";
            notificationBody = "Study Time";
            notificationIcon = "/fevicon.png";
          }

          const notificationPayload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
            icon: notificationIcon,
            url: `/chat/${data.sender}`,
            senderId: data.sender,
            tag: "varta-message"
          });

          const sendPromises = receiverUser.pushSubscriptions.map(async (sub) => {
            try {
              await webpush.sendNotification(sub, notificationPayload);
            } catch (err) {
              // Delete expired/invalid subscriptions (404 or 410)
              if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`Removing expired subscription: ${sub.endpoint}`);
                await User.findByIdAndUpdate(data.receiver, {
                  $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
                });
              } else {
                console.error("Push notification send error:", err);
              }
            }
          });
          await Promise.all(sendPromises);
        }
      } catch (err) {
        console.error("Failed to process push notification:", err);
      }
    }

    // send delivered tick
    if (senderSocket) {
      io.to(senderSocket).emit("messageDelivered", message);
    }
  });

  // 🔥 SEND REACTION
  socket.on("editMessage", async ({ messageId, userId, content }) => {
    try {
      if (!messageId || !userId || !content || !content.trim()) return;

      const msg = await Message.findById(messageId);
      if (!msg || msg.sender !== userId || msg.isDeleted || msg.messageType !== "text") return;

      msg.content = content.trim();
      msg.isEdited = true;
      msg.editedAt = new Date();
      await msg.save();

      const updateData = {
        messageId: msg._id.toString(),
        content: msg.content,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt,
      };

      const receiverSocket = users[msg.receiver];
      const senderSocket = users[msg.sender];
      if (receiverSocket) io.to(receiverSocket).emit("messageEdited", updateData);
      if (senderSocket) io.to(senderSocket).emit("messageEdited", updateData);
    } catch (err) {
      console.error("Error editing message:", err);
    }
  });

  socket.on("togglePinMessage", async ({ messageId, userId }) => {
    try {
      if (!messageId || !userId) return;

      const msg = await Message.findById(messageId);
      if (!msg || msg.isDeleted) return;
      if (msg.sender !== userId && msg.receiver !== userId) return;

      msg.isPinned = !msg.isPinned;
      await msg.save();

      const updateData = { messageId: msg._id.toString(), isPinned: msg.isPinned };
      const receiverSocket = users[msg.receiver];
      const senderSocket = users[msg.sender];
      if (receiverSocket) io.to(receiverSocket).emit("messagePinned", updateData);
      if (senderSocket) io.to(senderSocket).emit("messagePinned", updateData);
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  });

  socket.on("sendReaction", async ({ messageId, userId, emoji }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (!msg.reactions) msg.reactions = [];

      const existingIndex = msg.reactions.findIndex((r) => r.user === userId);

      if (existingIndex > -1) {
        if (msg.reactions[existingIndex].emoji === emoji) {
          // Toggle off if same emoji
          msg.reactions.splice(existingIndex, 1);
        } else {
          // Change emoji
          msg.reactions[existingIndex].emoji = emoji;
        }
      } else {
        // Add new reaction
        msg.reactions.push({ user: userId, emoji });
      }

      await msg.save();

      // Notify both participants
      const receiverSocket = users[msg.receiver];
      const senderSocket = users[msg.sender];

      const updateData = { messageId, reactions: msg.reactions };

      if (receiverSocket) io.to(receiverSocket).emit("receiveReaction", updateData);
      if (senderSocket) io.to(senderSocket).emit("receiveReaction", updateData);
    } catch (err) {
      console.error("Error handling reaction:", err);
    }
  });

  // 🔥 MARK AS READ
  socket.on("markAsRead", async ({ sender, receiver }) => {
    await Message.updateMany(
      { sender, receiver, status: { $ne: "read" } },
      { status: "read" }
    );

    const senderSocket = users[sender];

    if (senderSocket) {
      io.to(senderSocket).emit("messageRead", { receiver });
    }
  });

  // 🔥 TYPING STATUS
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { sender });
    }
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("stopTyping", { sender });
    }
  });

  // 🔥 DELETE MESSAGE
  socket.on("deleteMessage", async ({ messageId, userId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Ensure only sender can delete for everyone
      if (msg.sender !== userId) return;

      msg.isDeleted = true;
      msg.content = "This message was deleted";
      msg.voiceUrl = null;
      msg.fileUrl = null;
      msg.fileType = null;
      msg.fileName = null;
      await msg.save();

      const receiverSocket = users[msg.receiver];
      const senderSocket = users[msg.sender];

      if (receiverSocket) {
        io.to(receiverSocket).emit("messageDeleted", { messageId });
      }
      if (senderSocket) {
        io.to(senderSocket).emit("messageDeleted", { messageId });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  });

  // 🔥 CONNECTIONS INVITES
  socket.on("sendInvite", (data) => {
    const receiverSocket = users[data.receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveInvite", data);
    }
  });

  socket.on("acceptInvite", (data) => {
    const senderSocket = users[data.sender];
    if (senderSocket) {
      io.to(senderSocket).emit("inviteAccepted", data);
    }
  });

  // 🔥 WEB RTC SIGNALING FOR VOICE/VIDEO CALLS
  socket.on("initiateCall", ({ senderId, receiverId, signalData, callType, callerName, callerPic }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("incomingCall", { senderId, signalData, callType, callerName, callerPic });
    } else {
      socket.emit("callFailed", { message: "User is offline" });
    }
  });

  socket.on("acceptCall", ({ callerId, signalData }) => {
    const callerSocket = users[callerId];
    if (callerSocket) {
      io.to(callerSocket).emit("callAccepted", { signalData });
    }
  });

  socket.on("rejectCall", ({ callerId }) => {
    const callerSocket = users[callerId];
    if (callerSocket) {
      io.to(callerSocket).emit("callRejected");
    }
  });

  socket.on("endCall", ({ peerId }) => {
    const peerSocket = users[peerId];
    if (peerSocket) {
      io.to(peerSocket).emit("callEnded");
    }
  });

  socket.on("iceCandidate", ({ peerId, candidate }) => {
    const peerSocket = users[peerId];
    if (peerSocket) {
      io.to(peerSocket).emit("iceCandidate", { candidate });
    }
  });

  // 🔥 UPDATE PROFILE BROADCAST
  socket.on("updateProfile", (data) => {
    // Notify EVERYONE about the profile change
    socket.broadcast.emit("userProfileUpdated", data);
  });

  socket.on("disconnect", () => {
    for (let key in users) {
      if (users[key] === socket.id) {
        delete users[key];
      }
    }
    io.emit("onlineUsers", Object.keys(users));
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log("Server running on", PORT));
