"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssuePriority extends Model {
    static associate(models) {
      // IssuePriority ↔ Issues
      IssuePriority.hasMany(models.Issue, {
        foreignKey: "priority_id",
        as: "issues",
      });
    }
  }

  IssuePriority.init(
    {
      priority_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING(50), unique: true },
      description: DataTypes.TEXT,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "IssuePriority",
      tableName: "issue_priorities",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return IssuePriority;
};
