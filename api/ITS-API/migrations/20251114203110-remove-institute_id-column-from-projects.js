"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make institute_id nullable in projects table
    await queryInterface.changeColumn("projects", "institute_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to NOT NULL if needed
    await queryInterface.changeColumn("projects", "institute_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
