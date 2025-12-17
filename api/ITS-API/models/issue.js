"use strict";
const { Model } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class Issue extends Model {
    static associate(models) {
      Issue.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      Issue.belongsTo(models.IssueCategory, {
        foreignKey: "issue_category_id",
        as: "category",
      });

      Issue.belongsTo(models.HierarchyNode, {
        foreignKey: "hierarchy_node_id",
        as: "hierarchyNode",
      });

      Issue.belongsTo(models.IssuePriority, {
        foreignKey: "priority_id",
        as: "priority",
      });

      Issue.belongsTo(models.User, {
        foreignKey: "reported_by",
        as: "reporter",
      });

      Issue.belongsTo(models.User, {
        foreignKey: "assigned_to",
        as: "assignee",
      });

      Issue.hasMany(models.IssueAssignment, {
        foreignKey: "issue_id",
        as: "assignments",
      });

      Issue.hasMany(models.IssueTier, {
        foreignKey: "issue_id",
        as: "tiers",
      });

      Issue.hasMany(models.IssueEscalation, {
        foreignKey: "issue_id",
        as: "escalations",
      });

      Issue.hasMany(models.IssueResolution, {
        foreignKey: "issue_id",
        as: "resolutions",
      });

      Issue.hasMany(models.IssueHistory, {
        foreignKey: "issue_id",
        as: "history",
      });

      Issue.hasMany(models.IssueComment, {
        foreignKey: "issue_id",
        as: "comments",
      });

      Issue.hasMany(models.IssueAttachment, {
        foreignKey: "issue_id",
        as: "attachments",
      });

      Issue.hasMany(models.IssueAction, {
        foreignKey: "issue_id",
        as: "actions",
      });

      Issue.hasMany(models.IssueStatusHistory, {
        foreignKey: "issue_id",
        as: "statusHistory",
      });
    }
  }

  Issue.init(
    {
      issue_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      ticket_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      issue_category_id: {
        type: DataTypes.UUID,
      },
      hierarchy_node_id: {
        type: DataTypes.UUID,
      },
      priority_id: {
        type: DataTypes.UUID,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "pending",
      },
      reported_by: {
        type: DataTypes.UUID,
      },
      assigned_to: {
        type: DataTypes.UUID,
      },
      action_taken: {
        type: DataTypes.STRING(255),
      },
      url_path: {
        type: DataTypes.STRING(255),
      },
      issue_description: {
        type: DataTypes.STRING(255),
      },
      issue_occured_time: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      resolved_at: {
        type: DataTypes.DATE,
      },
      closed_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Issue",
      tableName: "issues",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Issue.beforeCreate(async (issue, options) => {
    // console.log("=== BEFORE CREATE HOOK ===");
    // console.log("Issue data:", issue.dataValues);
    // console.log("Ticket number before:", issue.ticket_number);

    if (!issue.ticket_number) {
      // console.log("Generating ticket number...");
      const year = new Date().getFullYear().toString().slice(-2);
      let randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      let ticket = `TICK-${year}-${randomCode}`;

      // Check duplicates
      let exists = await Issue.findOne({
        where: { ticket_number: ticket },
        transaction: options?.transaction,
      });

      while (exists) {
        randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        ticket = `TICK-${year}-${randomCode}`;
        exists = await Issue.findOne({
          where: { ticket_number: ticket },
          transaction: options?.transaction,
        });
      }

      // console.log("Generated ticket:", ticket);
      issue.ticket_number = ticket;
    }
  });

  return Issue;
};
