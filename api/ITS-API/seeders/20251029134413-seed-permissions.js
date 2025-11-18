"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const permissions = [
      // User Management
      { resource: "users", action: "create" },
      { resource: "users", action: "read" },
      { resource: "users", action: "update" },
      { resource: "users", action: "delete" },
      { resource: "users", action: "assign_role" },

      // Role Management
      { resource: "roles", action: "create" },
      { resource: "roles", action: "read" },
      { resource: "roles", action: "update" },
      { resource: "roles", action: "delete" },
      { resource: "roles", action: "assign_permission" },

      // Project Management
      { resource: "projects", action: "create" },
      { resource: "projects", action: "read" },
      { resource: "projects", action: "update" },
      { resource: "projects", action: "delete" },
      { resource: "projects", action: "assign_users" },

      // Issue Management
      { resource: "issues", action: "create" },
      { resource: "issues", action: "read" },
      { resource: "issues", action: "update" },
      { resource: "issues", action: "delete" },
      { resource: "issues", action: "assign" },
      { resource: "issues", action: "change_status" },
      { resource: "issues", action: "add_comment" },
      { resource: "issues", action: "view_comments" },

      // Institute Management
      { resource: "institutes", action: "create" },
      { resource: "institutes", action: "read" },
      { resource: "institutes", action: "update" },
      { resource: "institutes", action: "delete" },

      // Notification Management
      { resource: "notifications", action: "send" },
      { resource: "notifications", action: "read" },
      { resource: "notifications", action: "view" },

      // Attachment Management
      { resource: "attachments", action: "upload" },
      { resource: "attachments", action: "download" },
      { resource: "attachments", action: "delete" },

      // Reports & Analytics
      { resource: "reports", action: "view" },
      { resource: "reports", action: "export" },

      // System Management
      { resource: "system", action: "manage" },
      { resource: "audit", action: "view" },

      // Escalation permissions
      { resource: "escalation", action: "can_escalate_direct_to_qal" },
      { resource: "escalation", action: "can_escalate_direct_to_qa" },
      { resource: "escalation", action: "can_escalate_direct_to_fed" },
      { resource: "escalation", action: "can_escalate_direct_to_bed" },
    ];

    // Insert permissions one by one, ignoring duplicates
    for (const perm of permissions) {
      try {
        await queryInterface.bulkInsert("permissions", [{
          permission_id: uuidv4(),
          resource: perm.resource,
          action: perm.action,
          created_at: now,
          updated_at: now,
        }], {
          ignoreDuplicates: true // This will ignore duplicate key errors
        });
      } catch (error) {
        // If duplicate error, just continue
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Permission ${perm.resource}:${perm.action} already exists, skipping...`);
          continue;
        }
        throw error; // Re-throw other errors
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};