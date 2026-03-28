require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const Message = require("./models/Message");
const User = require("./models/User");

const app = express();
app.use(express.json());

// ✅ CORS FIX
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ✅ MONGO CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ✅ ROUTES
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

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
  });

  // 🔥 SEND MESSAGE
  socket.on("sendMessage", async (data) => {
    const message = await Message.create({
      sender: data.sender,
      receiver: data.receiver,
      content: data.content,
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

  socket.on("disconnect", () => {
    for (let key in users) {
      if (users[key] === socket.id) {
        delete users[key];
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log("Server running on", PORT));