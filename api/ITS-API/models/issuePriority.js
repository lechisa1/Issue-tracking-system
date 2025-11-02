"use strict";
module.exports = (sequelize, DataTypes) => {
  const IssuePriority = sequelize.define(
    "IssuePriority",
    {
      priority_id: {
        type: DataTypes.CHAR(36),
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
      tableName: "issue_priorities",
      timestamps: false,
    }
  );

  return IssuePriority;
};