"use strict";
module.exports = (sequelize, DataTypes) => {
  const IssuePriority = sequelize.define(
    "IssuePriority",
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
        type: DataTypes.TEXT,
        allowNull: true,
      },
      response_time: {
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
