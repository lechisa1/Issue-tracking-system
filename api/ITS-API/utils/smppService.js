// services/smppService.js
const smpp = require("smpp");
const logger = require("./logger");
const { Sms } = require("../models");

class SMPPService {
  constructor() {
    this.session = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Format phone number for Ethiopia
  formatPhoneNumber(phoneNumber) {
    try {
      // Remove any non-digit characters
      let cleaned = phoneNumber.replace(/\D/g, "");

      // Handle Ethiopian numbers
      if (cleaned.startsWith("0")) {
        // Convert 09... to +2519...
        cleaned = "251" + cleaned.substring(1);
      } else if (cleaned.startsWith("9") && cleaned.length === 9) {
        // Assume it's 9... format, add 251
        cleaned = "251" + cleaned;
      } else if (cleaned.startsWith("251") && cleaned.length === 12) {
        // Already in correct format
        cleaned = cleaned;
      } else {
        throw new Error(`Unrecognized phone number format: ${phoneNumber}`);
      }

      // Validate the final number
      if (cleaned.length !== 12) {
        throw new Error(`Invalid phone number length: ${cleaned}`);
      }

      return cleaned;
    } catch (error) {
      logger.error(
        `Phone number formatting failed for ${phoneNumber}: ${error.message}`
      );
      throw error;
    }
  }

  // Connect to SMPP server
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.session) {
        return resolve(this.session);
      }

      // Check if SMPP configuration exists
      if (
        !process.env.SMPP_HOST ||
        !process.env.SMPP_PORT ||
        !process.env.SMPP_SYSTEM_ID ||
        !process.env.SMPP_PASSWORD
      ) {
        logger.warn("SMPP configuration missing. SMS functionality disabled.");
        throw new Error("SMPP configuration not found");
      }

      logger.info(
        `Connecting to SMPP server at ${process.env.SMPP_HOST}:${process.env.SMPP_PORT}`
      );

      this.session = smpp.connect({
        host: process.env.SMPP_HOST,
        port: parseInt(process.env.SMPP_PORT),
        auto_enquire_link_period: 15000,
        reconnect: true,
        reconnect_period: 5000,
      });

      this.session.on("connect", () => {
        logger.info("SMPP TCP connection established, attempting bind...");
      });

      this.session.on("close", () => {
        logger.warn("SMPP connection closed");
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.session.on("error", (error) => {
        logger.error(`SMPP connection error: ${error.message}`);
        this.isConnected = false;
        reject(error);
      });

      this.session.on("bind", (pdu) => {
        if (pdu.command_status === 0) {
          logger.info("SMPP successfully bound");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(this.session);
        } else {
          const error = new Error(
            `SMPP bind failed with status: ${pdu.command_status}`
          );
          logger.error(error.message);
          reject(error);
        }
      });

      // Bind to SMPP server
      setTimeout(() => {
        this.session.bind_transceiver({
          system_id: process.env.SMPP_SYSTEM_ID,
          password: process.env.SMPP_PASSWORD,
        });
      }, 1000);
    });
  }

  // Attempt reconnection
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(
        `Attempting SMPP reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          logger.error(
            `Reconnection attempt ${this.reconnectAttempts} failed: ${error.message}`
          );
        });
      }, 5000);
    } else {
      logger.error(
        "Max reconnection attempts reached. SMPP service unavailable."
      );
    }
  }

  // Send SMS message
  async sendSMS(
    phoneNumber,
    message,
    sender = process.env.SMPP_SOURCE_ADDR || "ITS",
    createdBy = null
  ) {
    let smsRecord;

    try {
      // First, create a pending SMS record
      smsRecord = await Sms.create({
        sender,
        recipient: phoneNumber,
        message,
        status: "pending",
        sent_at: null,
        created_by: createdBy,
      });

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      logger.info(`Sending SMS to ${formattedNumber}`);

      // Connect to SMPP server
      const session = await this.connect();

      // Send message
      return new Promise((resolve, reject) => {
        session.submit_sm(
          {
            source_addr: sender,
            destination_addr: formattedNumber,
            short_message: message,
            registered_delivery: 1, // Request delivery receipt
          },
          async (pdu) => {
            if (pdu.command_status === 0) {
              const messageId = pdu.message_id;
              logger.info(`SMS sent successfully. Message ID: ${messageId}`);

              // Update SMS record
              await Sms.update(
                {
                  status: "sent",
                  message_id: messageId,
                  sent_at: new Date(),
                },
                {
                  where: { sms_id: smsRecord.sms_id },
                }
              );

              resolve({
                success: true,
                messageId: messageId,
                smsId: smsRecord.sms_id,
              });
            } else {
              const errorMsg = `SMPP submit_sm failed with status: ${pdu.command_status}`;
              logger.error(errorMsg);

              await Sms.update(
                {
                  status: "failed",
                  error: errorMsg,
                },
                {
                  where: { sms_id: smsRecord.sms_id },
                }
              );

              reject(new Error(errorMsg));
            }
          }
        );
      });
    } catch (error) {
      logger.error(`SMS sending failed: ${error.message}`);

      // Update SMS record if it was created
      if (smsRecord) {
        await Sms.update(
          {
            status: "failed",
            error: error.message,
          },
          {
            where: { sms_id: smsRecord.sms_id },
          }
        );
      }

      throw error;
    }
  }

  // Close SMPP connection
  close() {
    if (this.session) {
      this.session.unbind();
      this.session.close();
      this.isConnected = false;
      logger.info("SMPP connection closed gracefully");
    }
  }
}

// Create singleton instance
module.exports = new SMPPService();
