const crypto = require("crypto");
const { Op } = require("sequelize");
const { User } = require("../models");

class OTPService {
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async createOTP(phoneNumber) {
    // Clean phone number (remove non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Check rate limiting - use the same format logic for rate limiting
    const canRequest = await this.canRequestOTP(cleanPhone);
    if (!canRequest) {
      throw new Error(`Please wait 1 minute before requesting a new OTP`);
    }

    const otp = this.generateOTP();
    const resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find user with multiple format support (same as password reset)
    const user = await this.findUserByPhone(cleanPhone);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({
      reset_otp: otp,
      reset_otp_expiry: resetOtpExpiry,
      otp_attempts: 0,
      last_otp_sent_at: new Date(),
    });

    return otp;
  }

  async verifyOTP(phoneNumber, otp) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const cleanOTP = otp.replace(/\D/g, "");

    // Find user with multiple format support
    const user = await this.findUserByPhone(cleanPhone);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify OTP against the found user
    if (user.reset_otp !== cleanOTP || new Date() > user.reset_otp_expiry) {
      // Increment attempts on failure
      await user.increment("otp_attempts");
      throw new Error("Invalid or expired OTP");
    }

    if (user.otp_attempts >= 3) {
      throw new Error("Maximum OTP attempts exceeded");
    }

    return user;
  }

  async canRequestOTP(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Find user with multiple format support for rate limiting
    const user = await this.findUserByPhone(cleanPhone);
    if (!user) {
      return true; // No user found, so no rate limiting issue
    }

    // Check if OTP was sent recently
    if (
      user.last_otp_sent_at &&
      user.last_otp_sent_at >= new Date(Date.now() - 1 * 60 * 1000)
    ) {
      return false;
    }

    return true;
  }

  async markOTPAsUsed(user) {
    await user.update({
      reset_otp: null,
      reset_otp_expiry: null,
      otp_attempts: 0,
    });
  }

  // Helper function to find user by phone with multiple format support
  async findUserByPhone(phoneNumber) {
    const cleanDigits = phoneNumber.replace(/\D/g, "");

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

    console.log("OTP Service - Checking formats:", formatsToCheck);

    const user = await User.findOne({
      where: {
        phone_number: {
          [Op.in]: formatsToCheck,
        },
      },
    });

    return user;
  }
}

module.exports = new OTPService();
