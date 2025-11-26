"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "internal_node_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "internal_nodes", // table name
        key: "internal_node_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "internal_node_id");
  },
};
