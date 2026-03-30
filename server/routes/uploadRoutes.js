const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ TEST ROUTE (Diagnostic)
router.get("/test", (req, res) => res.json({ status: "Upload route is reachable" }));

router.post("/voice", upload.single("voice"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // Voice/Audio is usually best as raw or video
        folder: "chat_voice",
        format: "webm",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary voice error:", error);
          return res.status(500).json({ error: "Voice upload failed" });
        }
        res.json({ url: result.secure_url });
      }
    );

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  } catch (err) {
    console.error("Voice route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📁 NEW: GENERAL FILE UPLOAD (FOR IMAGES, PDF, DOC)
router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Determine folder based on mimetype
    let folder = "chat_docs";
    if (req.file.mimetype.startsWith("image/")) folder = "chat_images";

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // Automatically detects image, video, or raw
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary file error:", error);
          return res.status(500).json({ error: "File upload failed" });
        }
        res.json({ 
          url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type,
          original_name: req.file.originalname 
        });
      }
    );

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  } catch (err) {
    console.error("File route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
