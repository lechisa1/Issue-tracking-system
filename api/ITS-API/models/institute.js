"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Institute extends Model {
    static associate(models) {
      // Many-to-Many relationship with Project through InstituteProject
      this.belongsToMany(models.Project, {
        through: models.InstituteProject,
        foreignKey: "institute_id",
        otherKey: "project_id",
        as: "projects",
      });
    }
  }

  Institute.init(
    {
      institute_id: {
        type: DataTypes.CHAR(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
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
      deletedAt: "deleted_at",
      paranoid: true, // Enables soft delete
    }
  );

  return Institute;
};
