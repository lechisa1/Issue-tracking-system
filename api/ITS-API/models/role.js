"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsToMany(models.User, {
        through: models.UserRoles,
        foreignKey: "role_id",
        otherKey: "user_id",
        as: "users",
      });
      Role.belongsToMany(models.Permission, {
  through: "role_permissions",
  foreignKey: "role_id",
  otherKey: "permission_id",
  as: "permissions",
});
    }
  }

  Role.init(
    {
      role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING, unique: true },
      description: DataTypes.TEXT,
      role_type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Role;
};
