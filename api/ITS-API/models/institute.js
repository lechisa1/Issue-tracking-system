"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Institute extends Model {
    static associate(models) {
      // One Institute → Many Users
      Institute.hasMany(models.User, {
        foreignKey: "institute_id",
        as: "users",
      });

      // One Institute → Many Projects
      Institute.hasMany(models.Project, {
        foreignKey: "institute_id",
        as: "projects",
      });
    }
  }

  Institute.init(
    {
      institute_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      address: DataTypes.TEXT,
      contact_email: DataTypes.STRING,
      contact_phone: DataTypes.STRING,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Institute",
      tableName: "institutes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Institute;
};