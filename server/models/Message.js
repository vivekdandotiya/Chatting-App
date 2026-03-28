const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    senderName: String,
    receiver: String,
    content: String,

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    readAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);