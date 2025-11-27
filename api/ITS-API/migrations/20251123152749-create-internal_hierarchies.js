"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("internal_hierarchies", {
      internal_hierarchy_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Optional: create index on parent_id
    await queryInterface.addIndex("internal_hierarchies", ["parent_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("internal_hierarchies");
  },
};
