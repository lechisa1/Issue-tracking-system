'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("hierarchy_node_organization", {
      hierarchy_node_organization_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      hierarchy_node_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "hierarchy_node",
          key: "hierarchy_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
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

    // Add unique constraint to prevent duplicate associations
    await queryInterface.addIndex("hierarchy_node_organization", ["hierarchy_node_id", "institute_id"], {
      unique: true,
      name: "unique_hierarchy_node_institute",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("hierarchy_node_organization");
  },
};
