"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("issue_histories", "assignment_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "issue_assignments", // table name
        key: "assignment_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("issue_histories", "assignment_id");
  },
};
