"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssueEscalation extends Model {
    static associate(models) {
      // IssueEscalation ↔ Issue
      IssueEscalation.belongsTo(models.Issue, {
        foreignKey: "issue_id",
        as: "issue",
      });

      // IssueEscalation ↔ User (escalated by)
      IssueEscalation.belongsTo(models.User, {
        foreignKey: "escalated_by",
        as: "escalator",
      });
    }
  }

  IssueEscalation.init(
    {
      escalation_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      issue_id: DataTypes.UUID,
      from_tier: DataTypes.STRING(50),
      to_tier: DataTypes.STRING(50),
      reason: DataTypes.TEXT,
      escalated_by: DataTypes.UUID,
      escalated_at: DataTypes.DATE,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "IssueEscalation",
      tableName: "issue_escalations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return IssueEscalation;
};
