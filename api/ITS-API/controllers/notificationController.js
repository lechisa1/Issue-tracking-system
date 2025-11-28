const { Notification } = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const getNotificationsForUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { unread, limit = 50, offset = 0 } = req.query;
    const where = { recipient_id: user_id };
    if (unread === "true") where.is_read = false;

    const notifications = await Notification.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const notif = await Notification.findByPk(notification_id);
    if (!notif)
      return res.status(404).json({ message: "Notification not found" });
    notif.is_read = true;
    notif.delivered_at = new Date();
    await notif.save();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { user_id } = req.params;
    await Notification.update(
      { is_read: true, delivered_at: new Date() },
      { where: { recipient_id: user_id, is_read: false } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// In your notificationController.js
const getUnreadCount = async (req, res) => {
  try {
    const { user_id } = req.params;

    const count = await Notification.count({
      where: {
        recipient_id: user_id, // Changed from user_id to recipient_id
        is_read: false,
      },
    });

    res.json({
      success: true,
      data: { unread_count: count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get notification preferences
const getPreferences = async (req, res) => {
  try {
    const { user_id } = req.params;

    let preferences = await UserNotificationPreference.findOne({
      where: { user_id },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await UserNotificationPreference.create({
        user_id,
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update notification preferences
const updatePreferences = async (req, res) => {
  try {
    const { user_id } = req.params;
    const updateData = req.body;

    let preferences = await UserNotificationPreference.findOne({
      where: { user_id },
    });

    if (!preferences) {
      preferences = await UserNotificationPreference.create({
        user_id,
        ...updateData,
      });
    } else {
      await preferences.update(updateData);
    }

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getNotificationsForUser,
  markNotificationRead,
  markAllRead,
  updatePreferences,
  getUnreadCount,
  getPreferences,
};
