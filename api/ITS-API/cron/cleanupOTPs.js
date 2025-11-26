// cron/cleanupOTPs.js
const cron = require("node-cron");
const OTPService = require("../utils/otpService");

// Clean expired OTPs every hour
cron.schedule("0 * * * *", () => {
  console.log("Cleaning expired OTPs...");
  OTPService.cleanExpiredOTPs();
});

module.exports = cron;
