"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IssueCategory extends Model {
    static associate(models) {
      // IssueCategory ↔ Issues
      IssueCategory.hasMany(models.Issue, {
        foreignKey: "issue_category_id",
        as: "issues",
      });
    }
  }

  IssueCategory.init(
    {
      category_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING(100), unique: true },
      description: DataTypes.TEXT,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "IssueCategory",
      tableName: "issue_categories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return IssueCategory;
};
