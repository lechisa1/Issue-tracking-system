// models/projectuserrole.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProjectUserRole extends Model {
    static associate(models) {
      ProjectUserRole.belongsTo(models.Project, {
        foreignKey: "project_id",
        as: "project",
      });

      ProjectUserRole.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      ProjectUserRole.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });

      ProjectUserRole.belongsTo(models.SubRole, {
        foreignKey: "sub_role_id",
        as: "subRole",
      });
    }
  }

  ProjectUserRole.init(
    {
      project_user_role_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sub_role_id: {
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
      modelName: "ProjectUserRole",
      tableName: "project_user_roles",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['project_id', 'user_id']
        }
      ]
    }
  );

  return ProjectUserRole;
};