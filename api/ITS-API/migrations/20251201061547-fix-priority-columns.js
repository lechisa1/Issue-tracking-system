"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add color_value safely
    const table = await queryInterface.describeTable("issue_priorities");

    if (!table["color_value"]) {
      await queryInterface.addColumn("issue_priorities", "color_value", {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!table["response_time"]) {
      await queryInterface.addColumn("issue_priorities", "response_time", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("issue_priorities");

    if (table["color_value"]) {
      await queryInterface.removeColumn("issue_priorities", "color_value");
    }

    if (table["response_time"]) {
      await queryInterface.removeColumn("issue_priorities", "response_time");
    }
  },
};
