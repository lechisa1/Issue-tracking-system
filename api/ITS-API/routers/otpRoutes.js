// routes/otpRoutes.js
const express = require("express");
const router = express.Router();
const PasswordResetService = require("../utils/passwordResetService");
const OTPService = require("../utils/otpService");

// Request OTP for password reset
router.post("/request-otp", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const result = await PasswordResetService.requestOTP(email, phoneNumber);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const result = await PasswordResetService.verifyOTP(
      email,
      phoneNumber,
      otp
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    const result = await PasswordResetService.resetPassword(
      resetToken,
      newPassword
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Check OTP rate limit
router.post("/check-rate-limit", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const whereClause = {};
    if (email) {
      whereClause.email = email;
    } else {
      whereClause.phone_number = phoneNumber;
    }

    const user = await require("../models").User.findOne({
      where: whereClause,
    });

    if (!user) {
      return res.json({
        canSend: true,
        timeLeft: 0,
      });
    }

    const canSend = OTPService.canSendOTP(user);
    const timeLeft = OTPService.getTimeUntilNextOTP(user);

    res.json({
      canSend,
      timeLeft,
    });
  } catch (error) {
    console.error("Error checking rate limit:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
