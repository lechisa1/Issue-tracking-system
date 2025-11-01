"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("issue_categories", {
      category_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("issue_categories");
  },
};
