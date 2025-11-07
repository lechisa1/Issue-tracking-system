"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
<<<<<<<< HEAD:api/ITS-API/migrations/20251107090304-create-institute-projects.js
    await queryInterface.createTable("instituteProjects", {
      institue_project_id: {
========
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.createTable("institutes", {
      institute_id: {
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000000-create-institutes-table.js
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
<<<<<<<< HEAD:api/ITS-API/migrations/20251107090304-create-institute-projects.js
      institute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "institutes",
          key: "institute_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      projects_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "project_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
========
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000000-create-institutes-table.js
      },
      has_branch: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
    });
  },

  async down(queryInterface, Sequelize) {
<<<<<<<< HEAD:api/ITS-API/migrations/20251107090304-create-institute-projects.js
    await queryInterface.dropTable("instituteProjects");
========
    await queryInterface.dropTable("institutes");
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000000-create-institutes-table.js
  },
};
