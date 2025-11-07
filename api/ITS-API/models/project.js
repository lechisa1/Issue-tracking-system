
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      // Many-to-Many relationship with Institute through InstituteProject
      this.belongsToMany(models.Institute, {
        through: models.InstituteProject,
        foreignKey: "project_id",
        otherKey: "institute_id",
        as: "institutes",
      });
      // One-to-Many relationship with Hierarchy
      this.hasMany(models.Hierarchy, {
        foreignKey: "project_id",
        as: "hierarchies",
      });
    }
  }

  Project.init(
    {
      projects_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        primaryKey: true,
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
      modelName: "Project",
      tableName: "projects",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      paranoid: true, // enables soft delete
    }
  );

  return Project;
};