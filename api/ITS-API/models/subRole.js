"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SubRole extends Model {
    static associate(models) {
      // Optional: if you want to associate SubRole with ProjectUser
      SubRole.hasMany(models.ProjectUser, {
        foreignKey: "sub_role",
        sourceKey: "name", // Assuming in ProjectUser you store sub_role as string
        as: "projectUsers",
      });
    }
  }

  SubRole.init(
    {
      sub_role_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Sub-role name: Frontend, Backend, Technical Manager, QA Head, QA Member",
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
      sequelize,
      modelName: "SubRole",
      tableName: "sub_roles",
      underscored: true,
      timestamps: false,
    }
  );

  return SubRole;
};