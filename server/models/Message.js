const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    senderName: String,
    receiver: String,
    content: String,
    messageType: {
      type: String,
      enum: ["text", "voice", "file"],
      default: "text",
    },
    voiceUrl: String,
    fileUrl: String,
    fileType: String,
    fileName: String,

    
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    readAt: Date,
    reactions: [
      {
        user: String,
        emoji: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);