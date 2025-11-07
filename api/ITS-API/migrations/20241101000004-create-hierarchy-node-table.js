"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
<<<<<<<< HEAD:api/ITS-API/migrations/20251102103607-create-issue-priorities-table.js
    await queryInterface.createTable("issue_priorities", {
      priority_id: {
========
    await queryInterface.createTable("hierarchy_node", {
      hierarchy_node_id: {
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000004-create-hierarchy-node-table.js
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      hierarchy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "hierarchy",
          key: "hierarchy_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "hierarchy_node",
          key: "hierarchy_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      name: {
<<<<<<<< HEAD:api/ITS-API/migrations/20251102103607-create-issue-priorities-table.js
        type: Sequelize.STRING(50),
========
        type: Sequelize.STRING(255),
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000004-create-hierarchy-node-table.js
        allowNull: false,
        unique: true,
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
    });
  },

  async down(queryInterface, Sequelize) {
<<<<<<<< HEAD:api/ITS-API/migrations/20251102103607-create-issue-priorities-table.js
    await queryInterface.dropTable("issue_priorities");
========
    await queryInterface.dropTable("hierarchy_node");
>>>>>>>> 5d280705be4ef03218f1229173928a4841a15d50:api/ITS-API/migrations/20241101000004-create-hierarchy-node-table.js
  },
};
