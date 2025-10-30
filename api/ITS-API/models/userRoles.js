"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserRoles extends Model {
    static associate(models) {
      // Associations are handled by belongsToMany in User and Role
    }
  }

  UserRoles.init(
    {
      user_role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: { type: DataTypes.UUID },
      role_id: { type: DataTypes.UUID },
      user_type: DataTypes.STRING,
      assigned_by: DataTypes.UUID,
      assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: "UserRoles",
      tableName: "user_roles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserRoles;
};
