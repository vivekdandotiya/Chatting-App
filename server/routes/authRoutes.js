const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// ✅ DO LIKE THIS ONLY
router.post("/send-otp", authController.sendOTP);
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/profile", authController.updateUserProfile);

module.exports = router;
