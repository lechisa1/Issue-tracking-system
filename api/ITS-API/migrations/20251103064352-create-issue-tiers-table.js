"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("issue_tiers", {
      issue_tier_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      issue_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "issues",
          key: "issue_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tier_level: {
        type: Sequelize.STRING(50),
        allowNull: false, // ICT, Central, QA, Developer
      },
      handler_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "pending", // pending, solved, escalated
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("issue_tiers");
  },
};
