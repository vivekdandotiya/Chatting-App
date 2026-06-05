require("dotenv").config({ override: true });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

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
        users.map((u) => ({ ...u.toObject(), connectionStatus: "none" }))
      );
    }

    const connections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
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
      status: "sent",
    });


    const receiverSocket = users[data.receiver];
    const senderSocket = users[data.sender];

    // send to receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }

    // send delivered tick
    if (senderSocket) {
      io.to(senderSocket).emit("messageDelivered", message);
    }
  });

  // 🔥 SEND REACTION
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