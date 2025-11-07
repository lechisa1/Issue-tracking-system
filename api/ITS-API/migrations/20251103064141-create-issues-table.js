"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("issues", {
      issue_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      institute_project_id: {
        type: Sequelize.UUID,
        allowNull: true, // nullable for EAI users
        references: {
          model: "institute_projects",
          key: "institue_project_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      issue_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "issue_categories",
          key: "category_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      hierarchy_node_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "hierarchy_node",
          key: "hierarchy_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      priority_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "issue_priorities",
          key: "priority_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "pending", // pending, in_progress, resolved, closed, escalated
      },

      reported_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      action_taken: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      url_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      issue_description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      issue_occured_time: {
        type: Sequelize.DATE,
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

      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      closed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("issues");
  },
};
