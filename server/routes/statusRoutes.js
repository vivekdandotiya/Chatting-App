const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Connection = require("../models/Connection");
const Status = require("../models/Status");

// ✅ POST /api/status - Post a status update
router.post("/", async (req, res) => {
  try {
    const { userId, type, content, backgroundColor } = req.body;

    if (!userId || !type || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const status = await Status.create({
      user: userId,
      userName: user.name,
      userPic: user.profilePic || "",
      type,
      content,
      backgroundColor: backgroundColor || "#075e54",
    });

    res.status(201).json(status);
  } catch (err) {
    console.error("Post status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET /api/status - Get status updates of self and connected friends
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    // Find all accepted connections for this user
    const connections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
    });

    // Extract connection user IDs
    const friendIds = connections.map((c) =>
      c.sender.toString() === userId ? c.receiver.toString() : c.sender.toString()
    );

    // Include self
    const allUserIds = [userId, ...friendIds];

    // Find active statuses for these users
    const activeStatuses = await Status.find({
      user: { $in: allUserIds },
    }).sort({ createdAt: 1 });

    // Group active statuses by user
    const grouped = {};

    activeStatuses.forEach((status) => {
      const uId = status.user.toString();
      if (!grouped[uId]) {
        grouped[uId] = {
          user: {
            _id: uId,
            name: status.userName,
            profilePic: status.userPic,
          },
          statuses: [],
        };
      }
      grouped[uId].statuses.push(status);
    });

    // Convert grouped object to array
    const result = Object.values(grouped);

    res.json(result);
  } catch (err) {
    console.error("Get status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
