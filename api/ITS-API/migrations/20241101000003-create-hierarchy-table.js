"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("hierarchy", {
      hierarchy_id: {
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
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "project_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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
<<<<<<< HEAD:api/ITS-API/migrations/20251103091745-create-project-table.js
      deleted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
=======
>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000003-create-hierarchy-table.js
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("hierarchy");
  },
};
