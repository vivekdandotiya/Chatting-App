require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const Message = require("./models/Message");

const app = express();
app.use(express.json());

// ✅ CORS FIX
app.use(cors({
  origin: "https://chatting-app-beta-umber.vercel.app",
  credentials: true
}));

// ✅ DB CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ✅ GET MESSAGES (CHAT HISTORY)
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

// ✅ GET USERS
const User = require("./models/User");
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

const server = http.createServer(app);

// ✅ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "https://chatting-app-beta-umber.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 🔥 USER SOCKET MAP
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // register user socket
  socket.on("setup", (userId) => {
    users[userId] = socket.id;
  });

  // send message
  socket.on("sendMessage", async (msg) => {
    console.log("Message:", msg);

    const newMsg = await Message.create(msg);

    const receiverSocket = users[msg.receiver];
    const senderSocket = users[msg.sender];

    // send to receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", newMsg);
    }

    // send back to sender
    if (senderSocket) {
      io.to(senderSocket).emit("receiveMessage", newMsg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let key in users) {
      if (users[key] === socket.id) {
        delete users[key];
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});