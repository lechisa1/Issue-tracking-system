"use strict";
const { Model, Op } = require("sequelize");

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
        allowNull: false,
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

  // ======== FIXED TICKET NUMBER GENERATOR ===========
  Issue.beforeCreate(async (issue) => {
    const year = new Date().getFullYear();
    const yearShort = String(year).slice(-2); // e.g. "25"

    const lastIssue = await Issue.findOne({
      where: {
        ticket_number: { [Op.like]: `TICK-${yearShort}-%` },
      },
      order: [["created_at", "DESC"]],
    });

    let nextNumber = 1;

    if (lastIssue?.ticket_number) {
      const match = lastIssue.ticket_number.match(/-(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    issue.ticket_number = `TICK-${yearShort}-${String(nextNumber).padStart(
      2,
      "0"
    )}`;
  });

  return Issue;
};
