const { User } = require("../models");
const otpService = require("../utils/otpService");
const twilioSmsService = require("../utils/twilioSmsService");
const bcrypt = require("bcryptjs");

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

      // Clean phone number
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number",
        });
      }

      // Find user by phone number
      const user = await User.findOne({ where: { phone_number: cleanPhone } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this phone number",
        });
      }

      // Generate and send OTP
      const otp = await otpService.createOTP(cleanPhone);

      // Send OTP via SMS
      const smsResult = await twilioSmsService.sendOTP(cleanPhone, otp);
      if (process.env.NODE_ENV === "development" || smsResult.development) {
        console.log(`📱 OTP for ${cleanPhone}: ${otp}`);
        // You can also log it to a file or use a development-only logging service
      }

      res.json({
        success: true,
        message: "OTP sent successfully to your phone number",
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
