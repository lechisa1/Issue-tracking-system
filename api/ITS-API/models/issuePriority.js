// models/issuepriority.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssuePriority extends Model {
    static associate(models) {
      // 🔹 Link to IssueResponseTime
      this.belongsTo(models.IssueResponseTime, {
        foreignKey: "response_time_id",
        as: "responseTime",
      });
    }

    // 🟢 Example helper method to check if priority jumps to central
    canJumpToCentral() {
      // Only active priorities can "jump"
      return this.is_active === true;
    }
  }

  IssuePriority.init(
    {
      priority_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color_value: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      response_time_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "IssuePriority",
      tableName: "issue_priorities",
      timestamps: false,
      underscored: true,
    }
  );

  return IssuePriority;
};
