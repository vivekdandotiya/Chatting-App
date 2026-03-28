require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const Message = require("./models/Message");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "https://chatting-app-beta-umber.vercel.app",
  credentials: true
}));

app.use("/api/auth", authRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// USERS
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// MESSAGES
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

const server = http.createServer(app);

// 🔥 SOCKET
const io = new Server(server, {
  cors: {
    origin: "https://chatting-app-beta-umber.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ONLINE USERS
  socket.on("setup", (userId) => {
    users[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(users));
  });

  // SEND MESSAGE + NOTIFICATION
  socket.on("sendMessage", async (msg) => {
    const newMsg = await Message.create(msg);

    const receiverSocket = users[msg.receiver];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", newMsg);

      io.to(receiverSocket).emit("notification", {
        from: msg.senderName,
        content: msg.content,
      });
    }

    socket.emit("receiveMessage", newMsg);
  });

  // TYPING
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", sender);
    }
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("stopTyping", sender);
    }
  });

  // DISCONNECT
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
server.listen(PORT, () => console.log("Server running on port", PORT));