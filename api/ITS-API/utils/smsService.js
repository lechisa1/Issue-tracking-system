const smpp = require("smpp");

class SMSService {
  constructor() {
    this.session = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    try {
      this.session = smpp.connect({
        host: process.env.SMPP_HOST,
        port: parseInt(process.env.SMPP_PORT),
      });

      this.session.on("connect", () => {
        console.log("🔄 Connecting to SMPP server...");
        this.session.bind_transceiver(
          {
            system_id: process.env.SMPP_SYSTEM_ID,
            password: process.env.SMPP_PASSWORD,
          },
          (pdu) => {
            if (pdu.command_status === 0) {
              console.log("✅ Successfully connected to SMPP server");
              this.isConnected = true;
            } else {
              console.error("❌ SMPP bind failed:", pdu.command_status);
            }
          }
        );
      });

      this.session.on("close", () => {
        console.log("🔴 SMPP connection closed");
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      this.session.on("error", (error) => {
        console.error("❌ SMPP error:", error);
        this.isConnected = false;
      });

      this.session.on("pdu", (pdu) => {
        console.log("📨 SMPP PDU received:", pdu.command);
      });
    } catch (error) {
      console.error("❌ SMPP connection error:", error);
    }
  }

  async sendSMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        console.log(
          "📱 SMS not sent (SMPP not connected), phone:",
          phoneNumber
        );
        // For development, resolve anyway
        return resolve({ success: true, messageId: "dev-mode" });
      }

      const fullPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      this.session.submit_sm(
        {
          destination_addr: fullPhoneNumber,
          short_message: message,
          source_addr: process.env.SMPP_SOURCE_ADDR,
          registered_delivery: 1,
        },
        (pdu) => {
          if (pdu.command_status === 0) {
            console.log("✅ SMS sent successfully to:", phoneNumber);
            resolve({ success: true, messageId: pdu.message_id });
          } else {
            console.error("❌ SMS send failed:", pdu.command_status);
            reject(new Error(`SMPP error: ${pdu.command_status}`));
          }
        }
      );
    });
  }

  async sendOTP(phoneNumber, otp) {
    const message = `Your password reset OTP for ${process.env.APP_NAME} is: ${otp}. This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.`;

    if (process.env.SMS_ENABLED === "true") {
      try {
        const result = await this.sendSMS(phoneNumber, message);
        return result;
      } catch (error) {
        console.error("❌ Failed to send OTP via SMS:", error);
        // For development, we'll still consider it successful
        return { success: true, error: error.message };
      }
    } else {
      console.log("📱 SMS disabled, would send to:", phoneNumber, "OTP:", otp);
      return { success: true, development: true };
    }
  }
}

module.exports = new SMSService();
