// services/passwordResetService.js
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { User } = require("../models");
const OTPService = require("./otpService");
const { sendEmail } = require("./sendEmail");
const SMSService = require("./smppService"); // or your SMS service
const logger = require("../utils/logger");

class PasswordResetService {
  // Request OTP for password reset
  static async requestOTP(email, phoneNumber = null) {
    try {
      // Find user by email or phone
      const whereClause = {};
      if (email) {
        whereClause.email = email;
      } else if (phoneNumber) {
        whereClause.phone_number = phoneNumber;
      } else {
        throw new Error("Email or phone number is required");
      }

      const user = await User.findOne({ where: whereClause });

      // Always return success message for security (don't reveal if user exists)
      const successMessage =
        "If your account exists, you will receive an OTP shortly.";

      if (!user) {
        return { success: true, message: successMessage };
      }

      // Check rate limiting
      if (!OTPService.canSendOTP(user)) {
        const timeLeft = OTPService.getTimeUntilNextOTP(user);
        return {
          success: false,
          message: `Please wait ${timeLeft} seconds before requesting a new OTP.`,
        };
      }

      // Generate OTP
      const otp = OTPService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to user
      await user.update({
        reset_otp: otp,
        reset_otp_expiry: otpExpiry,
        otp_attempts: 0,
        last_otp_sent_at: new Date(),
      });

      // Send OTP via email and/or SMS
      await this.sendOTP(user, otp);

      logger.info(`OTP sent to user ${user.id}: ${email || phoneNumber}`);

      return {
        success: true,
        message: successMessage,
        method: email ? "email" : "sms",
        // For development only - remove in production
        ...(process.env.NODE_ENV === "development" && { debug_otp: otp }),
      };
    } catch (error) {
      logger.error("Error requesting OTP:", error);
      return { success: false, message: "Error processing OTP request" };
    }
  }

  // Send OTP via email and/or SMS
  static async sendOTP(user, otp) {
    const promises = [];

    // Send via email if user has email
    if (user.email) {
      promises.push(
        sendEmail(
          user.email,
          `Password Reset OTP - ${process.env.APP_NAME}`,
          this.generateEmailTemplate(user.full_name, otp)
        ).catch((error) => {
          logger.error(`Failed to send OTP email to ${user.email}:`, error);
        })
      );
    }

    // Send via SMS if user has phone number and SMS is enabled
    if (user.phone_number && process.env.SMS_ENABLED === "true") {
      const smsMessage = `Your ${process.env.APP_NAME} password reset OTP is: ${otp}. Valid for 10 minutes.`;

      promises.push(
        SMSService.sendSMS(
          user.phone_number,
          smsMessage,
          process.env.SMPP_SOURCE_ADDR || "ITS"
        ).catch((error) => {
          logger.error(
            `Failed to send OTP SMS to ${user.phone_number}:`,
            error
          );
        })
      );
    }

    await Promise.all(promises);
  }

  // Generate email template for OTP
  static generateEmailTemplate(userName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #073954; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .otp { font-size: 32px; font-weight: bold; text-align: center; color: #073954; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME}</h1>
            <h2>Password Reset OTP</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>You have requested to reset your password. Use the OTP below to verify your identity:</p>
            <div class="otp">${otp}</div>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Verify OTP
  static async verifyOTP(email, phoneNumber, otp) {
    try {
      // Find user by email or phone
      const whereClause = {};
      if (email) {
        whereClause.email = email;
      } else if (phoneNumber) {
        whereClause.phone_number = phoneNumber;
      } else {
        throw new Error("Email or phone number is required");
      }

      const user = await User.findOne({ where: whereClause });

      if (!user) {
        return { success: false, message: "Invalid OTP" }; // Generic message for security
      }

      // Validate OTP
      const validation = await OTPService.validateOTP(user, otp);

      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      // OTP is valid - generate reset token for the next step
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await user.update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
        reset_otp: null, // Clear OTP after successful verification
        reset_otp_expiry: null,
        otp_attempts: 0,
      });

      logger.info(`OTP verified successfully for user ${user.id}`);

      return {
        success: true,
        message: "OTP verified successfully",
        resetToken,
        userId: user.id,
      };
    } catch (error) {
      logger.error("Error verifying OTP:", error);
      return { success: false, message: "Error verifying OTP" };
    }
  }

  // Reset password with token
  static async resetPassword(resetToken, newPassword) {
    const t = await require("../models").sequelize.transaction();

    try {
      // Find user with valid reset token
      const user = await User.findOne({
        where: {
          reset_token: resetToken,
          reset_token_expiry: {
            [Op.gt]: new Date(),
          },
        },
        transaction: t,
      });

      if (!user) {
        await t.rollback();
        return { success: false, message: "Invalid or expired reset token" };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        await t.rollback();
        return { success: false, message: passwordValidation.message };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user
      await user.update(
        {
          password: hashedPassword,
          reset_token: null,
          reset_token_expiry: null,
          is_first_logged_in: false,
          updated_at: new Date(),
        },
        { transaction: t }
      );

      await t.commit();

      // Send confirmation
      await this.sendPasswordResetConfirmation(user);

      logger.info(`Password reset successfully for user ${user.id}`);

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      await t.rollback();
      logger.error("Error resetting password:", error);
      return { success: false, message: "Error resetting password" };
    }
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one special character",
      };
    }

    return { isValid: true, message: "Password is strong" };
  }

  // Send password reset confirmation
  static async sendPasswordResetConfirmation(user) {
    const promises = [];

    // Send email confirmation
    if (user.email) {
      promises.push(
        sendEmail(
          user.email,
          `Password Reset Successful - ${process.env.APP_NAME}`,
          `
          Dear ${user.full_name},
          
          Your password has been reset successfully.
          
          If you did not make this change, please contact support immediately.
          
          Best regards,
          ${process.env.APP_NAME} Team
          `
        ).catch((error) => {
          logger.error(
            `Failed to send password reset confirmation to ${user.email}:`,
            error
          );
        })
      );
    }

    // Send SMS confirmation
    if (user.phone_number && process.env.SMS_ENABLED === "true") {
      const smsMessage = `Your ${process.env.APP_NAME} password has been reset successfully.`;

      promises.push(
        SMSService.sendSMS(
          user.phone_number,
          smsMessage,
          process.env.SMPP_SOURCE_ADDR || "ITS"
        ).catch((error) => {
          logger.error(
            `Failed to send password reset SMS to ${user.phone_number}:`,
            error
          );
        })
      );
    }

    await Promise.all(promises);
  }
}

module.exports = PasswordResetService;
