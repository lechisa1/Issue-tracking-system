"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User ↔ Role through UserRoles
      User.belongsToMany(models.Role, {
        through: models.UserRoles,
        foreignKey: "user_id",
        otherKey: "role_id",
        as: "roles",
      });

      // UserType relation
      User.belongsTo(models.UserType, {
        foreignKey: "user_type_id",
        as: "userType",
      });
  User.hasMany(models.UserRoles, {
    foreignKey: 'assigned_by',
    as: 'assignedRoles'
  });

      // Institute relation
      User.belongsTo(models.Institute, {
        foreignKey: "institute_id",
        as: "institute",
      });

      // Team Membership relation
      User.belongsToMany(models.Team, {
        through: models.TeamMembers,
        foreignKey: "user_id",
        otherKey: "team_id",
        as: "teams",
      });

      // Issues reported or assigned
      User.hasMany(models.Issue, {
        foreignKey: "reported_by",
        as: "reportedIssues",
      });
      User.hasMany(models.Issue, {
        foreignKey: "assigned_to",
        as: "assignedIssues",
      });
    }
  }

  User.init(
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      full_name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      phone_number: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,
      user_type_id: DataTypes.UUID,
      institute_id: { type: DataTypes.UUID, allowNull: true },
      position: DataTypes.STRING,
      is_first_logged_in: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return User;
};
