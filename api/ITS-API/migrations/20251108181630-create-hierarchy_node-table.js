"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hierarchy_node", {
      hierarchy_node_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("hierarchy_node");
  },
};
