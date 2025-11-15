"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the 'code' column
    await queryInterface.removeColumn("projects", "code");
  },

  async down(queryInterface, Sequelize) {
    // Add the column back in case of rollback
    await queryInterface.addColumn("projects", "code", {
      type: Sequelize.STRING,
      allowNull: true, // adjust according to previous definition
    });
  },
};
