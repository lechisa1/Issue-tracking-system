"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("issue_priorities", "color_value", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn("issue_priorities", "response_time", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("issue_priorities", "color_value");
    await queryInterface.removeColumn("issue_priorities", "response_time");
  },
};
