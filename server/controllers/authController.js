const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ✅ NODEMAILER CONFIG
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASS || "").trim();

  if (!user || !pass) {
    throw new Error("Server email configuration is missing (EMAIL_USER or EMAIL_PASS environment variables not set).");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const isValidPassword = (password) => {
  return password && password.length >= 5 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists BEFORE sending OTP
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: cleanEmail, purpose: "signup" });
    await OTP.create({ email: cleanEmail, otp, purpose: "signup" });

    console.log(`[AUTH LOG] OTP generated for ${cleanEmail}: ${otp}`);

    const senderEmail = (process.env.EMAIL_USER || "").trim();
    const mailOptions = {
      from: `"Varta Security" <${senderEmail}>`,
      to: cleanEmail,
      subject: `Your Varta Verification Code: ${otp}`,
      text: `Your Varta verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; background-color: #0c0c0c; color: #ffffff; border-radius: 16px; border: 1px solid #202022;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Varta</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Account Verification</p>
          </div>
          <div style="background-color: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="color: #d4d4d8; font-size: 13px; margin: 0 0 12px 0;">Enter this code to verify your email address:</p>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #10b981; margin: 14px 0;">${otp}</div>
            <p style="color: #71717a; font-size: 11px; margin: 0; font-weight: 600;">Valid for 5 minutes</p>
          </div>
          <p style="color: #71717a; font-size: 11px; text-align: center; margin: 0; leading-height: 1.5;">If you did not request this code, please ignore this message.</p>
        </div>
      `
    };

    try {
      const transporter = getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH LOG] Email OTP sent to inbox for ${cleanEmail}`);
    } catch (mailError) {
      console.error("[AUTH ERROR] MAIL SEND FAILED:", mailError.message);
      return res.status(500).json({ 
        message: `Failed to send email verification code (${mailError.message}). Please check server email setup or try again.` 
      });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("SEND OTP ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "").trim();

    // 🔒 PASSWORD VALIDATION
    if (!password || password.length < 5) {
      return res.status(400).json({ message: "Password must be at least 5 characters long" });
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one letter and one number" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: cleanEmail, otp, purpose: "signup" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP verified, check if user exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: cleanName || cleanEmail.split("@")[0],
      email: cleanEmail,
      password,
    });

    // Delete OTP after successful registration
    await OTP.deleteMany({ email: cleanEmail, purpose: "signup" });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      appLockPassword: user.appLockPassword || { hour: null, minute: null }
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email: cleanEmail, purpose: "reset" });
    await OTP.create({ email: cleanEmail, otp, purpose: "reset" });

    console.log(`[AUTH LOG] Password Reset OTP generated for ${cleanEmail}: ${otp}`);

    const senderEmail = (process.env.EMAIL_USER || "").trim();
    const mailOptions = {
      from: `"Varta Security" <${senderEmail}>`,
      to: cleanEmail,
      subject: `Your Varta Password Reset Code: ${otp}`,
      text: `Your password reset code is ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; background-color: #0c0c0c; color: #ffffff; border-radius: 16px; border: 1px solid #202022;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Varta</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Password Reset</p>
          </div>
          <div style="background-color: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="color: #d4d4d8; font-size: 13px; margin: 0 0 12px 0;">Your password reset code is:</p>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #10b981; margin: 14px 0;">${otp}</div>
            <p style="color: #71717a; font-size: 11px; margin: 0; font-weight: 600;">Valid for 5 minutes</p>
          </div>
          <p style="color: #71717a; font-size: 11px; text-align: center; margin: 0;">If you did not request a password reset, please ignore this message.</p>
        </div>
      `
    };

    try {
      const transporter = getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH LOG] Reset OTP email sent to inbox for ${cleanEmail}`);
    } catch (mailErr) {
      console.error("[AUTH ERROR] RESET MAIL FAILED:", mailErr.message);
      return res.status(500).json({ 
        message: `Failed to send password reset code (${mailErr.message}). Please check server configuration.` 
      });
    }

    return res.status(200).json({ message: "Password reset code sent successfully" });
  } catch (error) {
    console.log("SEND RESET OTP ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Email, OTP, and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 5 characters and contain one letter and one number" });
    }

    const otpRecord = await OTP.findOne({ email: cleanEmail, otp, purpose: "reset" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    user.password = password;
    await user.save();
    await OTP.deleteMany({ email: cleanEmail, purpose: "reset" });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        appLockPassword: user.appLockPassword || { hour: null, minute: null }
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, profilePic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      appLockPassword: user.appLockPassword || { hour: null, minute: null }
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getVapidPublicKey = async (req, res) => {
  try {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const subscribeUser = async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ message: "UserId and Subscription are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if subscription already exists to avoid duplicates
    const exists = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(200).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("SUBSCRIBE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const unsubscribeUser = async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    if (!userId || !endpoint) {
      return res.status(400).json({ message: "UserId and Endpoint are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pushSubscriptions = user.pushSubscriptions.filter(
      (sub) => sub.endpoint !== endpoint
    );
    await user.save();

    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("UNSUBSCRIBE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPushStatus = async (req, res) => {
  try {
    const { userId } = req.query;
    const hasPublic = !!process.env.VAPID_PUBLIC_KEY;
    const hasPrivate = !!process.env.VAPID_PRIVATE_KEY;
    
    let subscriptionsCount = 0;
    let userDetails = null;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        subscriptionsCount = user.pushSubscriptions ? user.pushSubscriptions.length : 0;
        userDetails = {
          id: user._id,
          name: user.name,
          email: user.email
        };
      }
    }

    res.json({
      vapidKeysConfigured: hasPublic && hasPrivate,
      vapidPublicKeySnippet: process.env.VAPID_PUBLIC_KEY ? `${process.env.VAPID_PUBLIC_KEY.substring(0, 15)}...` : "not set",
      userIdRequested: userId || "none",
      userFound: !!userDetails,
      userDetails,
      subscriptionsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setLockPassword = async (req, res) => {
  try {
    const { userId, hour, minute } = req.body;
    if (!userId || hour === undefined || minute === undefined) {
      return res.status(400).json({ message: "UserId, hour, and minute are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.appLockPassword = { hour, minute };
    await user.save();

    res.status(200).json({
      message: "App lock password set successfully",
      appLockPassword: user.appLockPassword
    });
  } catch (error) {
    console.error("SET LOCK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const removeLockPassword = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.appLockPassword = { hour: null, minute: null };
    await user.save();

    res.status(200).json({
      message: "App lock password removed successfully",
      appLockPassword: user.appLockPassword
    });
  } catch (error) {
    console.error("REMOVE LOCK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  sendOTP, 
  sendResetOTP,
  resetPassword,
  updateUserProfile, 
  getVapidPublicKey, 
  subscribeUser, 
  unsubscribeUser,
  getPushStatus,
  setLockPassword,
  removeLockPassword
};
