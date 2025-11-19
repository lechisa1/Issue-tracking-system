"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Fetch user_id for aii_system_admin@gmail.com
    const [users] = await queryInterface.sequelize.query(`
      SELECT user_id FROM users WHERE email = 'aii_system_admin@gmail.com'
    `);

    if (!users.length) {
      throw new Error("User aii_system_admin@gmail.com not found. Seed demo-users first.");
    }

    const userId = users[0].user_id;

    // Fetch role_id for Administration
    const [roles] = await queryInterface.sequelize.query(`
      SELECT role_id FROM roles WHERE name = 'Administration'
    `);

    if (!roles.length) {
      throw new Error("Role 'Administration' not found. Seed roles first.");
    }

    const roleId = roles[0].role_id;

    // Assign role to user in user_roles
    await queryInterface.bulkInsert("user_roles", [
      {
        user_role_id: uuidv4(),
        user_id: userId,
        role_id: roleId,
        assigned_by: null, // No one assigned it, it's seeded
        assigned_at: now,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ], { ignoreDuplicates: true });

    // Fetch all permission_ids
    const [permissions] = await queryInterface.sequelize.query(`
      SELECT permission_id FROM permissions
    `);

    if (!permissions.length) {
      throw new Error("No permissions found. Seed permissions first.");
    }

    // Assign all permissions to the role in role_permissions
    const rolePermissions = permissions.map(perm => ({
      role_permission_id: uuidv4(),
      role_id: roleId,
      permission_id: perm.permission_id,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert("role_permissions", rolePermissions, { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    // Remove the role assignment and permissions for the admin user
    const [users] = await queryInterface.sequelize.query(`
      SELECT user_id FROM users WHERE email = 'aii_system_admin@gmail.com'
    `);

    if (users.length) {
      const userId = users[0].user_id;

      // Delete from user_roles
      await queryInterface.bulkDelete("user_roles", { user_id: userId });

      // Fetch role_id for Administration
      const [roles] = await queryInterface.sequelize.query(`
        SELECT role_id FROM roles WHERE name = 'Administration'
      `);

      if (roles.length) {
        const roleId = roles[0].role_id;

        // Delete from role_permissions
        await queryInterface.bulkDelete("role_permissions", { role_id: roleId });
      }
    }
  },
};
