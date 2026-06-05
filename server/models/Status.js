const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userPic: { type: String, default: "" },
    type: { type: String, enum: ["text", "image"], default: "text" },
    content: { type: String, required: true }, // Text content or Cloudinary image URL
    backgroundColor: { type: String, default: "#075e54" }, // Background color for text-based status
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 }, // TTL index in MongoDB
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);
