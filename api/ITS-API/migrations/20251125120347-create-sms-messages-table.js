// migrations/YYYYMMDDHHMMSS-create-sms-messages.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sms_messages", {
      sms_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sender: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "ITS",
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "sent", "delivered", "failed"),
        defaultValue: "pending",
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("sms_messages", ["recipient"]);
    await queryInterface.addIndex("sms_messages", ["status"]);
    await queryInterface.addIndex("sms_messages", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sms_messages");
  },
};
