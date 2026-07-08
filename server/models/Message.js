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
    replyTo: {
      messageId: String,
      senderName: String,
      content: String,
      messageType: String,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,

    
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
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
