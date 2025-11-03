"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Associations
      User.belongsTo(models.UserType, {
        foreignKey: "user_type_id",
        as: "userType",
      });

      User.belongsTo(models.Institute, {
        foreignKey: "institute_id",
        as: "institute",
      });

      // Many-to-Many with Role through UserRoles
      User.belongsToMany(models.Role, {
        through: models.UserRoles,
        foreignKey: "user_id",
        otherKey: "role_id",
        as: "roles",
      });

      // Optional: direct access to UserRoles
      User.hasMany(models.UserRoles, {
        foreignKey: "user_id",
        as: "userRoles",
      });
      User.hasMany(models.ProjectUser, {
  foreignKey: "user_id",
  as: "projects", // Must match what you use in your include
})
    }
  }

  User.init(
    {
      user_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      user_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      institute_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      position: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      profile_image: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_first_logged_in: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password_changed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: false, 
      underscored: true, 
    }
  );

  return User;
};
