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

    // Check rate limiting
    const canRequest = await this.canRequestOTP(cleanPhone);
    if (!canRequest) {
      throw new Error(`Please wait 1 minute before requesting a new OTP`);
    }

    const otp = this.generateOTP();
    const resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP - using your existing User model fields
    const user = await User.findOne({ where: { phone_number: cleanPhone } });
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

    const user = await User.findOne({
      where: {
        phone_number: cleanPhone,
        reset_otp: cleanOTP,
        reset_otp_expiry: {
          [Op.gt]: new Date(), // OTP not expired
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired OTP");
    }

    if (user.otp_attempts >= 3) {
      throw new Error("Maximum OTP attempts exceeded");
    }

    // Increment attempts
    await user.increment("otp_attempts");

    return user;
  }

  async canRequestOTP(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    const user = await User.findOne({
      where: {
        phone_number: cleanPhone,
        last_otp_sent_at: {
          [Op.gte]: new Date(Date.now() - 1 * 60 * 1000), // 1 minute rate limit
        },
      },
    });

    return !user;
  }

  async markOTPAsUsed(user) {
    await user.update({
      reset_otp: null,
      reset_otp_expiry: null,
      otp_attempts: 0,
    });
  }
}

module.exports = new OTPService();
