const { User } = require("../models");
const otpService = require("../utils/otpService");
const twilioSmsService = require("../utils/twilioSmsService");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
function normalizeEthiopianPhone(phone) {
  let digits = phone.replace(/\D/g, ""); // remove non-digits

  if (digits.startsWith("0")) digits = "251" + digits.slice(1);
  else if (digits.startsWith("9")) digits = "251" + digits;
  else if (digits.startsWith("251")) digits = digits;
  else digits = "251" + digits;

  return digits;
}

class PasswordResetSMSController {
  async requestReset(req, res) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      console.log("phoneeeeeeeeeeeeeeeeeeeeeee", phoneNumber);

      // 1. Clean input - remove all non-digits
      const cleanDigits = phoneNumber.replace(/\D/g, "");

      console.log("Clean digits:", cleanDigits);

      // 2. Normalize to different formats for database lookup
      let formatsToCheck = [];

      // If it's already in 251 format (12 digits)
      if (cleanDigits.startsWith("251") && cleanDigits.length === 12) {
        formatsToCheck = [
          cleanDigits, // 251995475373
          "0" + cleanDigits.slice(3), // 0995475373
          "+" + cleanDigits, // +251995475373
        ];
      }
      // If it's in 0 format (10 digits)
      else if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
        formatsToCheck = [
          cleanDigits, // 0995475373
          "251" + cleanDigits.slice(1), // 251995475373
          "+251" + cleanDigits.slice(1), // +251995475373
        ];
      }
      // If it's in 9 format (9 digits)
      else if (cleanDigits.startsWith("9") && cleanDigits.length === 9) {
        formatsToCheck = [
          cleanDigits, // 995475373
          "0" + cleanDigits, // 0995475373
          "251" + cleanDigits, // 251995475373
          "+251" + cleanDigits, // +251995475373
        ];
      }
      // If it's any other format, try common variations
      else {
        formatsToCheck = [
          cleanDigits,
          "0" + cleanDigits,
          "251" + cleanDigits,
          "+251" + cleanDigits,
          cleanDigits.startsWith("251")
            ? "0" + cleanDigits.slice(3)
            : cleanDigits,
          cleanDigits.startsWith("0")
            ? "251" + cleanDigits.slice(1)
            : cleanDigits,
        ].filter(Boolean);
      }

      // Remove duplicates
      formatsToCheck = [...new Set(formatsToCheck)];

      console.log("Checking formats:", formatsToCheck);

      // 3. Search using OR condition
      const user = await User.findOne({
        where: {
          phone_number: {
            [Op.in]: formatsToCheck,
          },
        },
      });

      if (!user) {
        console.log(
          "User not found with any of these formats:",
          formatsToCheck
        );
        return res.status(404).json({
          success: false,
          message: "No account found with this phone number",
        });
      }

      console.log("User found:", user.phone_number);

      // 4. Normalized sending format: 2519xxxxxxxx
      let cleanPhone;
      if (cleanDigits.startsWith("251") && cleanDigits.length === 12) {
        cleanPhone = cleanDigits;
      } else if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
        cleanPhone = "251" + cleanDigits.slice(1);
      } else if (cleanDigits.startsWith("9") && cleanDigits.length === 9) {
        cleanPhone = "251" + cleanDigits;
      } else {
        cleanPhone = "251" + cleanDigits.replace(/^251/, "").replace(/^0/, "");
      }

      // Ensure it's exactly 12 digits
      cleanPhone = cleanPhone.slice(0, 12);

      console.log("Sending OTP to:", cleanPhone);

      // 5. Generate and send OTP
      const otp = await otpService.createOTP(cleanPhone);

      // For development, log the OTP
      if (process.env.NODE_ENV === "development") {
        console.log(`📱 OTP for ${cleanPhone}: ${otp}`);
      }

      await twilioSmsService.sendOTP(cleanPhone, otp);

      res.json({
        success: true,
        message: "OTP sent successfully",
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({
          success: false,
          message: "Phone number and OTP are required",
        });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const cleanOTP = otp.replace(/\D/g, "");

      if (cleanOTP.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "OTP must be 6 digits",
        });
      }

      await otpService.verifyOTP(cleanPhone, cleanOTP);

      res.json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { phoneNumber, otp, newPassword } = req.body;

      if (!phoneNumber || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Phone number, OTP, and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const cleanOTP = otp.replace(/\D/g, "");

      // Verify OTP first - this returns the user object
      const user = await otpService.verifyOTP(cleanPhone, cleanOTP);

      // Update password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await user.update({
        password: hashedPassword,
        password_changed_at: new Date(),
      });

      // Mark OTP as used
      await otpService.markOTPAsUsed(user);

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PasswordResetSMSController();
