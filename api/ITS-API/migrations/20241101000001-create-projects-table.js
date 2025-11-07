"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("projects", {
      project_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
<<<<<<<< HEAD:api/ITS-API/migrations/20251107090252-create-projects.js
        allowNull: false,
        defaultValue: true,
========
        defaultValue: true,
        allowNull: false,
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000001-create-projects-table.js
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("projects");
  },
};
