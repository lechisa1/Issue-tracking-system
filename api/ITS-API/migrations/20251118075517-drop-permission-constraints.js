"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration is only for undoing, so up is empty
  },

  async down(queryInterface, Sequelize) {
    // This would recreate the constraints if needed
  },

  async undoPermissionsMigration(queryInterface, Sequelize) {
    // Drop foreign key constraints first
    await queryInterface.removeConstraint(
      "role_sub_roles_permissions",
      "role_sub_roles_permissions_permission_id_fkey"
    );

    await queryInterface.removeConstraint(
      "role_permissions",
      "role_permissions_permission_id_fkey"
    );

    // Now you can drop the table
    await queryInterface.dropTable("permissions");
  },
};
