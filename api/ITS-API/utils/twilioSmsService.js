const twilio = require("twilio");

class TwilioSmsService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

 
  formatEthiopianPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    console.log("📱 Cleaning phone number:", phoneNumber, "→", cleaned);

    if (cleaned.length === 10) {
      // If it starts with 9 (new format) or 0 (old format)
      if (cleaned.startsWith("9")) {
        return `+251${cleaned}`; 
      } else if (cleaned.startsWith("0")) {
        return `+251${cleaned.substring(1)}`; 
      }
    } else if (cleaned.length === 9 && cleaned.startsWith("9")) {
      
      return `+251${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith("251")) {
     
      return `+${cleaned}`;
    }

    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Format phone number for Ethiopian numbers
      const formattedNumber = this.formatEthiopianPhoneNumber(phoneNumber);

      console.log("📱 Attempting to send SMS to:", formattedNumber);
      console.log("📱 Original number:", phoneNumber);

      // Check if SMS is enabled and we're not in development
      if (process.env.SMS_ENABLED !== "true") {
        console.log("📱 SMS DISABLED - Would send to:", formattedNumber);
        console.log("📱 Message:", message);
        return {
          success: true,
          development: true, 
          formattedNumber,
          message,
        };
      }

      // Send real SMS (this will work in production when SMS_ENABLED=true)
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber,
      });

      console.log("✅ REAL SMS sent successfully:", result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        formattedNumber,
        development: false, // This is a real SMS
      };
    } catch (error) {
      console.error("❌ Twilio SMS error:", error.message);

      // For development, still return success but log the error
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📱 Development mode - SMS would be sent to:",
          this.formatEthiopianPhoneNumber(phoneNumber)
        );
        console.log("📱 Message:", message);
        console.log("📱 Twilio error (simulated):", error.message);
        return {
          success: true,
          development: true,
          error: error.message,
          formattedNumber: this.formatEthiopianPhoneNumber(phoneNumber),
        };
      }

      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendOTP(phoneNumber, otp) {
    const message = `Your password reset OTP for ${process.env.APP_NAME} is: ${otp}. Valid for 10 minutes.`;

    return await this.sendSMS(phoneNumber, message);
  }
}

module.exports = new TwilioSmsService();
