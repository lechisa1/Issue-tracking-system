"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [
      // User Management
      { permission_id: uuidv4(), name: "user:create", description: "Create new users", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "user:read", description: "View users", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "user:update", description: "Update user details", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "user:delete", description: "Delete users", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "user:assign_role", description: "Assign roles to users", created_at: new Date(), updated_at: new Date() },

      // Role & Permission Management
      { permission_id: uuidv4(), name: "role:create", description: "Create new roles", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "role:read", description: "View roles", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "role:update", description: "Update role details", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "role:delete", description: "Delete roles", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "permission:assign", description: "Assign permissions to roles", created_at: new Date(), updated_at: new Date() },

      // Project Management
      { permission_id: uuidv4(), name: "project:create", description: "Create new projects", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "project:read", description: "View project details", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "project:update", description: "Update project details", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "project:delete", description: "Delete projects", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "project:assign_users", description: "Assign users to project", created_at: new Date(), updated_at: new Date() },

      // Issue Management
      { permission_id: uuidv4(), name: "issue:create", description: "Create new issues", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:read", description: "View issues", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:update", description: "Update issue details", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:delete", description: "Delete issues", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:assign", description: "Assign issues to developers/QA", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:change_status", description: "Update issue status", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:add_comment", description: "Add comments to issues", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "issue:view_comments", description: "View comments on issues", created_at: new Date(), updated_at: new Date() },

      // Notifications
      { permission_id: uuidv4(), name: "notification:send", description: "Send notifications to users", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "notification:read", description: "Mark notifications as read", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "notification:view", description: "View notifications", created_at: new Date(), updated_at: new Date() },

      // Attachments
      { permission_id: uuidv4(), name: "attachment:add", description: "Upload attachments to issues or projects", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "attachment:read", description: "View/download attachments", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "attachment:delete", description: "Delete attachments", created_at: new Date(), updated_at: new Date() },

      // Reports & Analytics
      { permission_id: uuidv4(), name: "report:view", description: "View issue/project reports", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "report:export", description: "Export reports to PDF/Excel", created_at: new Date(), updated_at: new Date() },

      // Audit & Logs
      { permission_id: uuidv4(), name: "audit:view", description: "View system activity logs", created_at: new Date(), updated_at: new Date() },
      { permission_id: uuidv4(), name: "audit:export", description: "Export logs for compliance", created_at: new Date(), updated_at: new Date() },
    ];

    await queryInterface.bulkInsert("permissions", permissions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};
