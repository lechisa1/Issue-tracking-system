const express = require("express");
const router = express.Router();
const {
  getNotificationsForUser,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  getPreferences,
  updatePreferences,
} = require("../controllers/notificationController");

router.get("/user/:user_id", getNotificationsForUser);
router.patch("/:notification_id/read", markNotificationRead);
router.patch("/user/:user_id/read-all", markAllRead);
router.get("/user/:user_id/preferences", getPreferences);

// Update notification preferences
router.put("/user/:user_id/preferences", updatePreferences);

// Get unread count
router.get("/user/:user_id/unread-count", getUnreadCount);
module.exports = router;
