"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      notification_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },

      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      issue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "issues",
          key: "issue_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      reference_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      payload: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("notifications");
  },
};
