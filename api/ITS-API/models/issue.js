"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Issue extends Model {
    static associate(models) {
      // Issue ↔ Project
      Issue.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Issue ↔ IssueCategory
      Issue.belongsTo(models.IssueCategory, {
        foreignKey: "issue_category_id",
        as: "category",
      });

      // Issue ↔ IssuePriority
      Issue.belongsTo(models.IssuePriority, {
        foreignKey: "priority_id",
        as: "priority",
      });

      // Issue ↔ User (reporter)
      Issue.belongsTo(models.User, {
        foreignKey: "reported_by",
        as: "reporter",
      });

      // Issue ↔ User (current assignee)
      Issue.belongsTo(models.User, {
        foreignKey: "assigned_to",
        as: "assignee",
      });

      // Issue ↔ IssueAssignments
      Issue.hasMany(models.IssueAssignment, {
        foreignKey: "issue_id",
        as: "assignments",
      });

      // Issue ↔ IssueTiers
      Issue.hasMany(models.IssueTier, {
        foreignKey: "issue_id",
        as: "tiers",
      });

      // Issue ↔ IssueEscalations
      Issue.hasMany(models.IssueEscalation, {
        foreignKey: "issue_id",
        as: "escalations",
      });

      // Issue ↔ IssueComments
      Issue.hasMany(models.IssueComment, {
        foreignKey: "issue_id",
        as: "comments",
      });

      // Issue ↔ IssueAttachments
      Issue.hasMany(models.IssueAttachment, {
        foreignKey: "issue_id",
        as: "attachments",
      });

      // Issue ↔ IssueActions
      Issue.hasMany(models.IssueAction, {
        foreignKey: "issue_id",
        as: "actions",
      });

      // Issue ↔ IssueStatusHistory
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
      project_id: DataTypes.UUID,
      title: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      issue_category_id: DataTypes.UUID,
      priority_id: DataTypes.UUID,
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "pending",
      },
      reported_by: DataTypes.UUID,
      current_tier: DataTypes.STRING(50),
      assigned_to: DataTypes.UUID,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      resolved_at: DataTypes.DATE,
      closed_at: DataTypes.DATE,
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

  return Issue;
};
