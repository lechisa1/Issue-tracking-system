"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("issue_comments", {
      comment_id: {
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
      author_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_internal_note: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable("issue_comments");
  },
};
