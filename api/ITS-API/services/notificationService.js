// services/notificationService.js
const { Notification, User, sequelize } = require("../models");
const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../utils/sendEmail");
const logger = require("../utils/logger");

/**
 * Create a notification (optionally inside an existing transaction)
 */
async function createNotification({
  recipient_id,
  user_id = null,
  reference_type = null,
  reference_id = null,
  type,
  title,
  body = null,
  payload = null,
  transaction = null,
}) {
  const notification = await Notification.create(
    {
      notification_id: uuidv4(),
      recipient_id,
      user_id,
      reference_type,
      reference_id,
      type,
      title,
      body,
      payload,
    },
    { transaction }
  );

  return notification;
}

/**
 * Send email for a notification (uses your sendEmail util).
 * Updates notification.email_sent_at on success.
 * Call this AFTER the DB transaction is committed.
 */
async function sendEmailForNotification(notification) {
  try {
    const recipient = await User.findByPk(notification.recipient_id);
    if (!recipient || !recipient.email) {
      logger?.warn?.(
        `Recipient not found or has no email: ${notification.recipient_id}`
      );
      return null;
    }

    const subject = notification.title;
    // basic html/text body — adapt to your application's link format
    const text = `${notification.body || ""}\n\nView: ${
      process.env.APP_URL || ""
    }/issues/${notification.reference_id || ""}`;

    await sendEmail(recipient.email, subject, text);

    // mark email_sent_at
    notification.email_sent_at = new Date();
    await notification.save();
    return true;
  } catch (err) {
    logger?.error?.("sendEmailForNotification error", err);
    return null;
  }
}

/**
 * Helper: find users who are "handlers" for a hierarchy node.
 * Default implementation: look for User.hierarchy_node_id === provided.
 * If you have a join table (e.g., HierarchyNodeUser), replace the logic here.
 */
async function getUsersForHierarchyNode(hierarchy_node_id) {
  const { User } = sequelize.models;

  // Simple mapping: find users who belong to that node
  const users = await User.findAll({
    where: { hierarchy_node_id },
    attributes: ["user_id", "email", "full_name"],
  });

  // If you use a join table like HierarchyNodeUser, replace above with join query:
  // const users = await HierarchyNodeUser.findAll({ where: { hierarchy_node_id }, include: [{ model: User }] })

  return users;
}

module.exports = {
  createNotification,
  sendEmailForNotification,
  getUsersForHierarchyNode,
};
