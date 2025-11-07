"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
<<<<<<<< HEAD:api/ITS-API/migrations/20251107135805-create-projects-table.js
    await queryInterface.createTable("projects", {
      project_id: {
========
    await queryInterface.createTable("sub_roles", {
      sub_role_id: {
>>>>>>>> b7c3970122813ea0d9fa2de742647a7813777d07:api/ITS-API/migrations/20251106111414-create-sub_roles-table.js
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
<<<<<<<< HEAD:api/ITS-API/migrations/20251107135805-create-projects-table.js
        type: Sequelize.STRING(255),
        allowNull: false,
========
        type: Sequelize.STRING(100),
>>>>>>>> b7c3970122813ea0d9fa2de742647a7813777d07:api/ITS-API/migrations/20251106111414-create-sub_roles-table.js
        unique: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
<<<<<<<< HEAD:api/ITS-API/migrations/20251107135805-create-projects-table.js
========
        allowNull: false,
>>>>>>>> b7c3970122813ea0d9fa2de742647a7813777d07:api/ITS-API/migrations/20251106111414-create-sub_roles-table.js
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

<<<<<<<< HEAD:api/ITS-API/migrations/20251107135805-create-projects-table.js
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("projects");
========
  async down(queryInterface) {
    await queryInterface.dropTable("sub_roles");
>>>>>>>> b7c3970122813ea0d9fa2de742647a7813777d07:api/ITS-API/migrations/20251106111414-create-sub_roles-table.js
  },
};