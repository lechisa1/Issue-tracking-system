"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Issue extends Model {
    static associate(models) {
      // Belongs to Project
      Issue.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      // Belongs to Category
      Issue.belongsTo(models.IssueCategory, {
        foreignKey: "issue_category_id",
        as: "category",
      });

      // Belongs to Priority
      Issue.belongsTo(models.IssuePriority, {
        foreignKey: "priority_id",
        as: "priority",
      });

      // Reported by a User
      Issue.belongsTo(models.User, {
        foreignKey: "reported_by",
        as: "reporter",
      });

      // Assigned to a User
      Issue.belongsTo(models.User, {
        foreignKey: "assigned_to",
        as: "assignee",
      });

      // One issue → Many comments
    //   Issue.hasMany(models.IssueComment, {
    //     foreignKey: "issue_id",
    //     as: "comments",
    //   });

      // One issue → Many attachments
    //   Issue.hasMany(models.IssueAttachment, {
    //     foreignKey: "issue_id",
    //     as: "attachments",
    //   });
    }
  }

  Issue.init(
    {
      issue_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      issue_category_id: DataTypes.UUID,
      priority_id: DataTypes.UUID,
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending", // pending, in_progress, resolved, closed, escalated
      },
      reported_by: DataTypes.UUID,
      current_tier: DataTypes.STRING, // ICT, Central, QA, Developer
      assigned_to: DataTypes.UUID,
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
