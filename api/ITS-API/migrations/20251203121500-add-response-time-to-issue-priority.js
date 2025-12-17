"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add response_time_id column
    await queryInterface.addColumn("issue_priorities", "response_time_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Add is_active column
    await queryInterface.addColumn("issue_priorities", "is_active", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    // Add FK constraint to issue_response_times
    await queryInterface.addConstraint("issue_priorities", {
      fields: ["response_time_id"],
      type: "foreign key",
      name: "fk_issuepriority_response_time",
      references: {
        table: "issue_response_times",
        field: "response_time_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "issue_priorities",
      "fk_issuepriority_response_time"
    );

    await queryInterface.removeColumn("issue_priorities", "response_time_id");
    await queryInterface.removeColumn("issue_priorities", "is_active");
  },
};
