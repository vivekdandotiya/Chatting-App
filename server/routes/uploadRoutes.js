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
        resource_type: "raw",
        folder: "voice_messages",
        format: "webm",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          const errorMsg = error.message === "Must supply api_key" ? "Cloudinary keys are missing! Check your Render dashboard." : "Upload failed";
          return res.status(500).json({ error: errorMsg });
        }
        res.json({ url: result.secure_url });
      }
    );

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  } catch (err) {
    console.error("Upload route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
