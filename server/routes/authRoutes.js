const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// ✅ DO LIKE THIS ONLY
router.post("/send-otp", authController.sendOTP);
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/profile", authController.updateUserProfile);
router.get("/vapid-public-key", authController.getVapidPublicKey);
router.post("/subscribe", authController.subscribeUser);
router.post("/unsubscribe", authController.unsubscribeUser);
router.get("/push-status", authController.getPushStatus);
router.post("/set-lock", authController.setLockPassword);
router.post("/remove-lock", authController.removeLockPassword);
router.get("/profile-test", (req, res) => res.json({ status: "Profile router is working" }));

module.exports = router;

