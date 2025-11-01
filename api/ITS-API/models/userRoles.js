"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserRoles extends Model {
    static associate(models) {
      // Define associations here
      UserRoles.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      UserRoles.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });
      UserRoles.belongsTo(models.User, {
        foreignKey: 'assigned_by',
        as: 'assignedBy'
      });
    }
  }

  UserRoles.init(
    {
      user_role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: { 
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      role_id: { 
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'role_id'
        }
      },

      assigned_by: { 
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      assigned_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
      },
      is_active: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
      },
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