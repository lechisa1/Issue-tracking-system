// services/notificationService.js
const {
  Notification,
  User,
  ProjectUserRole,
  HierarchyNode,
  sequelize,
} = require("../models");
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
// services/notificationService.js - Updated sendEmailForNotification function
async function sendEmailForNotification(notification) {
  try {
    console.log(
      `🔍 DEBUG - Starting email for notification: ${notification.notification_id}`
    );
    console.log(`🔍 DEBUG - Recipient ID: ${notification.recipient_id}`);
    console.log(`🔍 DEBUG - Notification type: ${notification.type}`);

    // Get recipient user details
    const recipient = await User.findByPk(notification.recipient_id, {
      attributes: ["user_id", "full_name", "email"],
    });

    console.log(`🔍 DEBUG - Recipient found:`, recipient);

    if (!recipient) {
      console.log(
        `❌ No recipient found with ID: ${notification.recipient_id}`
      );
      return null;
    }

    if (!recipient.email) {
      console.log(
        `❌ Recipient has no email: ${recipient.user_id} (${recipient.full_name})`
      );
      return null;
    }

    console.log(`✅ Proceeding to send email to: ${recipient.email}`);

    // Get reporter details for personalized email
    const reporter = await User.findByPk(notification.user_id, {
      attributes: ["full_name"],
    });

    const reporterName = reporter?.full_name || "A user";

    // Enhanced email content based on notification type
    let emailSubject = "";
    let emailBody = "";

    switch (notification.type) {
      case "issue_escalated":
        emailSubject = `🚨 Issue Escalated: ${
          notification.title || "Issue #" + notification.payload?.issue_id
        }`;
        emailBody = `
Hello ${recipient.full_name || "there"},

An issue has been escalated and requires your attention.

Issue Details:
- Title: ${notification.title || "Issue #" + notification.payload?.issue_id}
- Escalated From: ${notification.payload?.from_tier || "Previous Tier"}
- Escalated To: ${notification.payload?.to_tier || "Current Tier"}
- Reason: ${notification.body?.split("Reason: ")[1] || "Not specified"}
- Escalated By: ${reporterName}
- Escalated At: ${new Date().toLocaleString()}

${notification.body || "Please review this escalated issue."}

View the issue: ${process.env.APP_URL || "http://localhost:3000"}/issues/${
          notification.payload?.issue_id || ""
        }

Best regards,
Your Issue Management System
        `.trim();
        break;

      case "issue_created":
        emailSubject = `📋 New Issue: ${notification.title}`;
        emailBody = `
Hello ${recipient.full_name || "there"},

${reporterName} has created a new issue that requires your attention.

Issue: ${notification.title}
Description: ${
          notification.body?.replace("created an issue: ", "") ||
          "No description provided"
        }

View the issue: ${process.env.APP_URL || "http://localhost:3000"}/issues/${
          notification.payload?.issue_id || ""
        }

Best regards,
Your Issue Management System
        `.trim();
        break;

      default:
        emailSubject = `📢 Notification: ${notification.title}`;
        emailBody = `
Hello ${recipient.full_name || "there"},

You have a new notification: ${notification.body}

View: ${process.env.APP_URL || "http://localhost:3000"}

Best regards,
Your Issue Management System
        `.trim();
    }

    console.log(`📧 Preparing to send email to: ${recipient.email}`);
    console.log(`📧 Subject: ${emailSubject}`);
    console.log(`📧 Body length: ${emailBody.length} characters`);

    // Send the email using the imported function
    await sendEmail(recipient.email, emailSubject, emailBody);

    // Mark as sent
    notification.email_sent_at = new Date();
    await notification.save();

    console.log(`✅ Email sent successfully to: ${recipient.email}`);
    return true;
  } catch (err) {
    console.error(
      `❌ sendEmailForNotification error for notification ${notification.notification_id}:`,
      {
        message: err.message,
        stack: err.stack,
        recipient_id: notification.recipient_id,
        type: notification.type,
      }
    );
    return null;
  }
}

/**
 * Helper: find users who are "handlers" for a hierarchy node.
 * Default implementation: look for User.hierarchy_node_id === provided.
 * If you have a join table (e.g., HierarchyNodeUser), replace the logic here.
 */
// utils/hierarchyUtils.js
const getUsersForHierarchyNode = async (hierarchy_node_id) => {
  try {
    console.log(`🔍 Getting users for hierarchy node: ${hierarchy_node_id}`);

    const users = await User.findAll({
      include: [
        {
          model: ProjectUserRole,
          as: "projectRoles",
          where: { hierarchy_node_id },
          required: true,
        },
      ],
      attributes: ["user_id", "full_name", "email"],
    });

    console.log(
      `✅ Found ${users.length} users for hierarchy node ${hierarchy_node_id}`
    );

    return users;
  } catch (error) {
    console.error("❌ Error in getUsersForHierarchyNode:", error);
    return [];
  }
};
// utils/hierarchyUtils.js
const getUsersWithSameParentHierarchy = async (
  reporter_id,
  issue_hierarchy_node_id
) => {
  try {
    console.log(
      `🔍 Finding users with same parent hierarchy as reporter: ${reporter_id}`
    );

    // Step 1: Get the reporter's hierarchy node and its parent
    const reporterHierarchy = await ProjectUserRole.findOne({
      where: { user_id: reporter_id },
      include: [
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          include: [
            {
              model: HierarchyNode,
              as: "parent",
            },
          ],
        },
      ],
    });

    if (!reporterHierarchy || !reporterHierarchy.hierarchyNode) {
      console.log("❌ No hierarchy found for reporter");
      return [];
    }

    const reporterParentNode = reporterHierarchy.hierarchyNode.parent;
    if (!reporterParentNode) {
      console.log("❌ No parent hierarchy found for reporter");
      return [];
    }

    console.log(
      `🏢 Reporter's parent hierarchy: ${reporterParentNode.hierarchy_node_id} (${reporterParentNode.name})`
    );

    // Step 2: Find all users who belong to this parent hierarchy node
    const siblingUsers = await User.findAll({
      include: [
        {
          model: ProjectUserRole,
          as: "projectRoles",
          where: {
            hierarchy_node_id: reporterParentNode.hierarchy_node_id,
          },
          required: true,
        },
      ],
      attributes: ["user_id", "full_name", "email"],
    });

    console.log(
      `✅ Found ${siblingUsers.length} users with same parent hierarchy`
    );

    return siblingUsers;
  } catch (error) {
    console.error("❌ Error in getUsersWithSameParentHierarchy:", error);
    return [];
  }
};
// utils/hierarchyUtils.js
const getUsersWithParentHierarchy = async (hierarchy_node_id) => {
  try {
    console.log(
      `🔍 Finding parent hierarchy users for node: ${hierarchy_node_id}`
    );

    // Step 1: Get the hierarchy node and its parent
    const hierarchyNode = await HierarchyNode.findOne({
      where: { hierarchy_node_id },
      include: [
        {
          model: HierarchyNode,
          as: "parent",
        },
      ],
    });

    if (!hierarchyNode) {
      console.log("❌ Hierarchy node not found");
      return [];
    }

    const parentNode = hierarchyNode.parent;
    if (!parentNode) {
      console.log("❌ No parent hierarchy found for this node");
      return [];
    }

    console.log(
      `🏢 Parent hierarchy: ${parentNode.hierarchy_node_id} (${parentNode.name})`
    );

    // Step 2: Find all users who belong to this parent hierarchy node
    const parentUsers = await User.findAll({
      include: [
        {
          model: ProjectUserRole,
          as: "projectRoles",
          where: {
            hierarchy_node_id: parentNode.hierarchy_node_id,
          },
          required: true,
        },
      ],
      attributes: ["user_id", "full_name", "email"],
    });

    console.log(
      `✅ Found ${parentUsers.length} users at parent hierarchy level`
    );

    return parentUsers;
  } catch (error) {
    console.error("❌ Error in getUsersWithParentHierarchy:", error);
    return [];
  }
};
module.exports = {
  createNotification,
  sendEmailForNotification,
  getUsersForHierarchyNode,
  getUsersWithSameParentHierarchy,
  getUsersWithParentHierarchy,
};
