const { Notification, HierarchyNode, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

async function notifyUsers({
  issue_id,
  type,
  title,
  message,
  target_user_ids,
}) {
  if (!Array.isArray(target_user_ids) || target_user_ids.length === 0) return;

  const notifications = target_user_ids.map((user_id) => ({
    notification_id: uuidv4(),
    user_id,
    issue_id: issue_id || null,
    type,
    title,
    message,
    created_at: new Date(),
  }));

  await Notification.bulkCreate(notifications);
}

module.exports = { notifyUsers };
