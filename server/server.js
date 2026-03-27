require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const Message = require("./models/Message");
const User = require("./models/User");

// ✅ IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");

// ✅ CREATE APP FIRST
const app = express();

// ✅ MIDDLEWARE
app.use(express.json());

app.use(cors({
  origin: "https://chatting-app-beta-umber.vercel.app",
  credentials: true
}));

// ✅ USE ROUTES (AFTER app created)
app.use("/api/auth", authRoutes);

// ✅ DB CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ GET USERS
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// ✅ GET MESSAGES
app.get("/api/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// ✅ SERVER + SOCKET
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chatting-app-beta-umber.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ USER SOCKET MAP
const users = {};

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("setup", (userId) => {
    users[userId] = socket.id;
  });

  socket.on("sendMessage", async (msg) => {
    const newMsg = await Message.create(msg);

    const receiverSocket = users[msg.receiver];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", newMsg);
    }

    socket.emit("receiveMessage", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port", PORT));